import { NextRequest } from "next/server";
import { and, eq, gt, gte, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { sendFcmNotification } from "@/app/lib/v1/fcm";
import {
  appendStatusTimelineSql,
  computeRefundableAmount,
  matchOrderByIdOrTicket,
  ORDER_NON_IMAGE_COLUMNS,
} from "@/app/lib/v1/orders";
import { parseOptionalJsonBody } from "@/app/lib/v1/request";
import { publishOrderSignal } from "@/app/lib/v1/realtime";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import type { OrderId, StaffRefundOrderReq, StaffRefundOrderRes } from "@/app/types/v1/api";

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

    const parsedBody = await parseOptionalJsonBody<StaffRefundOrderReq>(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const order = await db.query.orders.findFirst({
      where: matchOrderByIdOrTicket(lookupId),
      columns: ORDER_NON_IMAGE_COLUMNS,
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    if (order.status === "REFUNDED" || order.isRefunded) {
      return jsonError("Order has already been refunded", 409, "OrderAlreadyRefunded");
    }

    if (order.status !== "CANCELLED") {
      return jsonError(
        `Cannot refund order in current status (${order.status}). Order must be CANCELLED.`,
        400,
        "OrderNotCancelled"
      );
    }

    if (order.courierPaid) {
      return jsonError(
        "Cannot refund order because the courier has already been paid.",
        409,
        "CourierAlreadyPaid"
      );
    }

    const refundableAmount = computeRefundableAmount(order);
    if (refundableAmount <= 0) {
      return jsonError(
        "This order has no refundable counter deposit.",
        400,
        "OrderNotRefundEligible"
      );
    }

    if (!order.refundRequested || !order.refundInitiatedAt) {
      return jsonError(
        "Cannot release refund: Customer has not initiated the refund pass on their device.",
        403,
        "RefundNotInitiated"
      );
    }

    const now = new Date();
    const isExpired =
      !order.refundExpiresAt || new Date(order.refundExpiresAt).getTime() < now.getTime();

    if (isExpired) {
      return jsonError(
        "Cannot release refund: The customer refund window has expired. Customer must re-initiate the refund pass.",
        403,
        "RefundWindowExpired"
      );
    }

    const nowIso = now.toISOString();

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "REFUNDED",
        statusTimeline: appendStatusTimelineSql("REFUNDED", nowIso),
        isRefunded: true,
        refundRequested: false,
        refundAmount: refundableAmount,
        refundedBy: auth.session.userId,
        refundedAt: now,
        modifiedBy: auth.session.userId,
        timestamp: now,
      })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.status, "CANCELLED"),
          eq(orders.isRefunded, false),
          eq(orders.courierPaid, false),
          isNotNull(orders.activatedAt),
          gt(orders.price, 0),
          eq(orders.refundRequested, true),
          gte(orders.refundExpiresAt, now)
        )
      )
      .returning({
        id: orders.id,
        refundAmount: orders.refundAmount,
        refundedAt: orders.refundedAt,
      });

    if (!updatedOrder) {
      return jsonError(
        "Order has already been refunded or its refund window changed concurrently",
        409,
        "Conflict"
      );
    }

    sendFcmNotification({
      userId: order.customerId,
      title: "Refund Completed",
      body: `₱${refundableAmount} cash refund has been released for ${order.trackingId || order.productName || "your order"}.`,
      notifId: order.id,
      data: {
        orderId: order.id,
        ticketCode: order.ticketCode,
        status: "REFUNDED",
      },
    }).catch(() => {});

    publishOrderSignal(["staff:orders", `customer:${order.customerId}`], {
      event: "ORDER_REFUNDED",
      orderId: order.id,
      ticketCode: order.ticketCode ?? null,
      status: "REFUNDED",
      updatedAt: nowIso,
    });

    const response: StaffRefundOrderRes = {
      statusMessage: "Order refunded successfully",
      orderId: updatedOrder.id as OrderId,
      status: "REFUNDED",
      refundAmount: updatedOrder.refundAmount ?? refundableAmount,
      refundedAt: (updatedOrder.refundedAt ?? now).toISOString(),
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Staff Refund Order Error]:", err);
    return jsonError("Internal server error refunding order", 500, "Internal Server Error");
  }
}
