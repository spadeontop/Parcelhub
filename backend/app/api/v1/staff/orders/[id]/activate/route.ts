import { NextRequest } from "next/server";
import { and, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { isUniqueViolation } from "@/app/lib/v1/db-errors";
import { sendFcmNotification } from "@/app/lib/v1/fcm";
import { publishOrderSignal } from "@/app/lib/v1/realtime";
import {
  appendStatusTimelineSql,
  hasActivePaidTrackingId,
  matchOrderByIdOrTicket,
  normalizeTrackingId,
  ORDER_NON_IMAGE_COLUMNS,
} from "@/app/lib/v1/orders";
import { parseJsonBody } from "@/app/lib/v1/request";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  StaffActivateOrderReq,
  StaffActivateOrderRes,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateStaffRequest(request, ["STAFF"]);
    if (!auth.session) {
      return jsonError(auth.error || "Unauthorized", auth.status, "Unauthorized");
    }

    const { id } = await params;
    const lookupId = id?.trim();

    if (!lookupId) {
      return jsonError("Order ID or Ticket Code is required", 400);
    }

    const parsedBody = await parseJsonBody<StaffActivateOrderReq>(
      request,
      "Invalid JSON request body"
    );
    if (!parsedBody.ok) {
      return parsedBody.response;
    }
    const body = parsedBody.data;

    if (
      typeof body.amountReceived !== "number" ||
      isNaN(body.amountReceived) ||
      body.amountReceived < 0
    ) {
      return jsonError("Valid numeric amountReceived is required", 400);
    }

    const order = await db.query.orders.findFirst({
      where: matchOrderByIdOrTicket(lookupId),
      columns: ORDER_NON_IMAGE_COLUMNS,
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    if (order.status !== "PAYMENT_REQUIRED") {
      return jsonError(
        `Order cannot be activated in status ${order.status}. Only PAYMENT_REQUIRED orders can be activated.`,
        400
      );
    }

    if (body.amountReceived < order.price) {
      return jsonError(
        `amountReceived must be at least the order price of ${order.price}`,
        400
      );
    }

    const normalizedTrackingId = order.trackingId
      ? normalizeTrackingId(order.trackingId)
      : null;

    if (normalizedTrackingId && (await hasActivePaidTrackingId(normalizedTrackingId, order.id))) {
      return jsonError(
        `Tracking ID "${normalizedTrackingId}" is already registered to another active parcel. Cannot activate duplicate parcel.`,
        409,
        "Conflict"
      );
    }

    const change = Math.max(0, body.amountReceived - order.price);
    const now = new Date();
    const nowIso = now.toISOString();

    type AutoCancelledRow = {
      id: string;
      customerId: string;
      ticketCode: string | null;
      previousStatus: "PENDING_INITIALIZATION" | "PAYMENT_REQUIRED";
    };

    let updatedOrder: { id: string } | undefined;
    let autoCancelledOrders: AutoCancelledRow[] = [];

    try {
      const txResult = await db.transaction(async (tx: typeof db) => {
        const [activated] = await tx
          .update(orders)
          .set({
            ...(normalizedTrackingId ? { trackingId: normalizedTrackingId } : {}),
            amountReceived: body.amountReceived,
            change,
            status: "AWAITING_PARCEL",
            activatedAt: now,
            activatedBy: auth.session!.userId,
            statusTimeline: appendStatusTimelineSql("AWAITING_PARCEL", nowIso),
            modifiedBy: auth.session!.userId,
            timestamp: now,
          })
          .where(and(eq(orders.id, order.id), eq(orders.status, "PAYMENT_REQUIRED")))
          .returning({ id: orders.id });

        if (!activated) {
          return { activated: undefined, autoCancelled: [] as AutoCancelledRow[] };
        }

        if (!normalizedTrackingId) {
          return { activated, autoCancelled: [] as AutoCancelledRow[] };
        }

        const competingRows = await tx
          .select({
            id: orders.id,
            customerId: orders.customerId,
            ticketCode: orders.ticketCode,
            status: orders.status,
          })
          .from(orders)
          .where(
            and(
              ne(orders.id, order.id),
              inArray(orders.status, ["PENDING_INITIALIZATION", "PAYMENT_REQUIRED"]),
              or(
                eq(orders.trackingId, normalizedTrackingId),
                sql`${orders.id} IN (
                  SELECT os.order_id
                  FROM order_screenshots os
                  WHERE os.checks->>'trackingId_strict' IS NOT NULL
                    AND upper(regexp_replace(os.checks->>'trackingId_strict', '[[:space:]]+', '', 'g')) = ${normalizedTrackingId}
                )`
              )
            )
          );

        if (competingRows.length === 0) {
          return { activated, autoCancelled: [] as AutoCancelledRow[] };
        }

        const systemReasonText = `Auto-cancelled: Tracking ID ${normalizedTrackingId} was paid and activated on another order (${order.ticketCode || order.id}).`;
        const competingIds = competingRows.map((r: (typeof competingRows)[number]) => r.id);

        const updatedCompeting = await tx
          .update(orders)
          .set({
            status: "CANCELLED",
            statusTimeline: appendStatusTimelineSql("CANCELLED", nowIso),
            cancelledBy: "SYSTEM",
            cancelledByRole: "SYSTEM",
            cancelReasonCode: "SYSTEM_DUPLICATE_TRACKING_ACTIVATED",
            cancelReason: systemReasonText,
            cancelledAt: now,
            claimRequested: false,
            modifiedBy: "SYSTEM",
            timestamp: now,
          })
          .where(
            and(
              inArray(orders.id, competingIds),
              inArray(orders.status, ["PENDING_INITIALIZATION", "PAYMENT_REQUIRED"])
            )
          )
          .returning({ id: orders.id });

        const updatedIdSet = new Set(
          updatedCompeting.map((row: (typeof updatedCompeting)[number]) => row.id)
        );

        return {
          activated,
          autoCancelled: competingRows
            .filter((r: (typeof competingRows)[number]) => updatedIdSet.has(r.id))
            .map((r: (typeof competingRows)[number]) => ({
              id: r.id,
              customerId: r.customerId,
              ticketCode: r.ticketCode,
              previousStatus: r.status as "PENDING_INITIALIZATION" | "PAYMENT_REQUIRED",
            })),
        };
      });

      updatedOrder = txResult.activated;
      autoCancelledOrders = txResult.autoCancelled;
    } catch (updateErr: unknown) {
      if (isUniqueViolation(updateErr, "orders_paid_tracking_id_unique")) {
        return jsonError(
          `Tracking ID "${normalizedTrackingId ?? order.trackingId}" is already registered to another active parcel. Cannot activate duplicate parcel.`,
          409,
          "Conflict"
        );
      }
      throw updateErr;
    }

    if (!updatedOrder) {
      return jsonError(
        "Order has already been activated or its status changed concurrently",
        409,
        "Conflict"
      );
    }

    sendFcmNotification({
      userId: order.customerId,
      title: "Payment Verified",
      body: `Payment received for ${normalizedTrackingId || order.productName || "your parcel"}. Now awaiting courier arrival.`,
      notifId: order.id,
      data: {
        orderId: order.id,
        ticketCode: order.ticketCode,
        status: "AWAITING_PARCEL",
      },
    }).catch(() => {});

    publishOrderSignal(["staff:orders", `customer:${order.customerId}`], {
      event: "ORDER_ACTIVATED",
      orderId: order.id,
      ticketCode: order.ticketCode ?? null,
      status: "AWAITING_PARCEL",
      updatedAt: nowIso,
    });

    for (const cancelled of autoCancelledOrders) {
      const channels =
        cancelled.previousStatus === "PAYMENT_REQUIRED"
          ? ["staff:orders", `customer:${cancelled.customerId}`]
          : [`customer:${cancelled.customerId}`];

      publishOrderSignal(channels, {
        event: "ORDER_CANCELLED",
        orderId: cancelled.id,
        ticketCode: cancelled.ticketCode ?? null,
        status: "CANCELLED",
        updatedAt: nowIso,
      });

      if (cancelled.previousStatus === "PAYMENT_REQUIRED") {
        sendFcmNotification({
          userId: cancelled.customerId,
          title: "Order Auto-Cancelled",
          body: `Your order for tracking ID ${normalizedTrackingId} was automatically cancelled because it was paid and activated on another order.`,
          notifId: cancelled.id,
          data: {
            orderId: cancelled.id,
            ticketCode: cancelled.ticketCode ?? "",
            status: "CANCELLED",
          },
        }).catch(() => {});
      }
    }

    const response: StaffActivateOrderRes = {
      statusMessage: "Order activated and awaiting parcel delivery",
      change,
      autoCancelledCount: autoCancelledOrders.length,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Staff Activate Order Error]:", err);
    return jsonError("Internal server error activating order", 500, "Internal Server Error");
  }
}
