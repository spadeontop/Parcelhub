import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { isUniqueViolation } from "@/app/lib/v1/db-errors";
import { sendFcmNotification } from "@/app/lib/v1/fcm";
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

    let updatedOrder: { id: string } | undefined;
    try {
      [updatedOrder] = await db
        .update(orders)
        .set({
          ...(normalizedTrackingId ? { trackingId: normalizedTrackingId } : {}),
          amountReceived: body.amountReceived,
          change,
          status: "AWAITING_PARCEL",
          statusTimeline: appendStatusTimelineSql("AWAITING_PARCEL", now.toISOString()),
          modifiedBy: auth.session.userId,
          timestamp: now,
        })
        .where(and(eq(orders.id, order.id), eq(orders.status, "PAYMENT_REQUIRED")))
        .returning({ id: orders.id });
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

    const response: StaffActivateOrderRes = {
      statusMessage: "Order activated and awaiting parcel delivery",
      change,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Staff Activate Order Error]:", err);
    return jsonError("Internal server error activating order", 500, "Internal Server Error");
  }
}
