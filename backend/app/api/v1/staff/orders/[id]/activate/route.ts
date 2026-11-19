import { NextRequest } from "next/server";
import { and, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { isUniqueViolation } from "@/app/lib/v1/db-errors";
import { sendFcmNotification } from "@/app/lib/v1/fcm";
import { ORDER_NON_IMAGE_COLUMNS } from "@/app/lib/v1/orders";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  OrderStatus,
  StaffActivateOrderReq,
  StaffActivateOrderRes,
  StatusTimelineEntry,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation:
    //    Ensure Bearer token is present, valid HS256 JWT, and role is strictly STAFF
    // ---------------------------------------------------------
    const auth = await authenticateStaffRequest(request, ["STAFF"]);
    if (!auth.session) {
      return jsonError(auth.error || "Unauthorized", auth.status, "Unauthorized");
    }

    // ---------------------------------------------------------
    // 2. Request Validation:
    //    Extract route parameter {id} and body {amountReceived}
    // ---------------------------------------------------------
    const { id } = await params;
    const lookupId = id?.trim();

    if (!lookupId) {
      return jsonError("Order ID or Ticket Code is required", 400);
    }

    let body: StaffActivateOrderReq;
    try {
      body = (await request.json()) as StaffActivateOrderReq;
    } catch {
      return jsonError("Invalid JSON request body", 400);
    }

    if (
      typeof body.amountReceived !== "number" ||
      isNaN(body.amountReceived) ||
      body.amountReceived < 0
    ) {
      return jsonError("Valid numeric amountReceived is required", 400);
    }

    // ---------------------------------------------------------
    // 3. Business Logic:
    //    a. Fetch order from DB by ID or ticketCode
    //    b. Ensure order status is PAYMENT_REQUIRED
    //    c. Ensure amountReceived >= order.price
    //    d. Update order to AWAITING_PARCEL and calculate change
    // ---------------------------------------------------------
    const order = await db.query.orders.findFirst({
      where: or(eq(orders.id, lookupId), eq(orders.ticketCode, lookupId)),
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

    // ---------------------------------------------------------
    // Unique Tracking ID Enforcement:
    // Ensure another active parcel (AWAITING_PARCEL, READY_TO_CLAIM, CLAIMED)
    // doesn't already hold the same trackingId before activating this order.
    // ---------------------------------------------------------
    if (order.trackingId) {
      const activePaidDuplicate = await db.query.orders.findFirst({
        where: and(
          eq(orders.trackingId, order.trackingId),
          ne(orders.id, order.id),
          inArray(orders.status, [
            "AWAITING_PARCEL",
            "READY_TO_CLAIM",
            "CLAIMED",
          ] as OrderStatus[])
        ),
        columns: { id: true },
      });

      if (activePaidDuplicate) {
        return jsonError(
          `Tracking ID "${order.trackingId}" is already registered to another active parcel. Cannot activate duplicate parcel.`,
          409,
          "Conflict"
        );
      }
    }

    const change = Math.max(0, body.amountReceived - order.price);
    const now = new Date();
    const nowIso = now.toISOString();
    const timelineEntry: StatusTimelineEntry = {
      status: "AWAITING_PARCEL",
      timestamp: nowIso,
    };

    let updatedOrder: { id: string } | undefined;
    try {
      [updatedOrder] = await db
        .update(orders)
        .set({
          amountReceived: body.amountReceived,
          change,
          status: "AWAITING_PARCEL",
          statusTimeline: sql<StatusTimelineEntry[]>`coalesce(${orders.statusTimeline}, '[]'::jsonb) || ${JSON.stringify([timelineEntry])}::jsonb`,
          modifiedBy: auth.session.userId,
          timestamp: now,
        })
        .where(and(eq(orders.id, order.id), eq(orders.status, "PAYMENT_REQUIRED")))
        .returning({ id: orders.id });
    } catch (updateErr: unknown) {
      if (isUniqueViolation(updateErr, "orders_paid_tracking_id_unique")) {
        return jsonError(
          `Tracking ID "${order.trackingId}" is already registered to another active parcel. Cannot activate duplicate parcel.`,
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

    // Non-fatal FCM push to customer
    sendFcmNotification({
      userId: order.customerId,
      title: "Payment Verified",
      body: `Payment received for ${order.trackingId || order.productName || "your parcel"}. Now awaiting courier arrival.`,
      notifId: order.id,
      data: {
        orderId: order.id,
        ticketCode: order.ticketCode,
        status: "AWAITING_PARCEL",
      },
    }).catch(() => {});

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK conforming to StaffActivateOrderRes
    // ---------------------------------------------------------
    const response: StaffActivateOrderRes = {
      statusMessage: "Order activated and awaiting parcel delivery",
      change,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal server error activating order";
    return jsonError(errorMsg, 500);
  }
}
