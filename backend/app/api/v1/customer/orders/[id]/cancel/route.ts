import { NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateCustomerRequest, customerAuthErrorResponse } from "@/app/lib/v1/auth";
import {
  appendStatusTimelineSql,
  computeRefundInfo,
  matchOrderByIdOrTicket,
  ORDER_NON_IMAGE_COLUMNS,
  parseOptionalCancelOrRefundReason,
} from "@/app/lib/v1/orders";
import { parseOptionalJsonBody } from "@/app/lib/v1/request";
import { publishOrderSignal } from "@/app/lib/v1/realtime";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import type {
  CustomerCancelOrderReq,
  CustomerCancelOrderRes,
  OrderId,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateCustomerRequest(request);
    if (!auth.session) {
      return customerAuthErrorResponse(auth);
    }

    const { id: rawId } = await params;
    const identifier = rawId?.trim();
    if (!identifier) {
      return jsonError("Order identifier is required", 400);
    }

    const parsedBody = await parseOptionalJsonBody<CustomerCancelOrderReq>(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const parsedReason = parseOptionalCancelOrRefundReason(parsedBody.data);
    if (!parsedReason.ok) {
      return jsonError(parsedReason.error, 400);
    }

    const order = await db.query.orders.findFirst({
      where: and(
        matchOrderByIdOrTicket(identifier),
        eq(orders.customerId, auth.session.userId)
      ),
      columns: ORDER_NON_IMAGE_COLUMNS,
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    if (order.status === "CANCELLED") {
      return jsonError("Order is already cancelled", 409, "OrderAlreadyCancelled");
    }

    if (order.status === "REFUNDED" || order.isRefunded) {
      return jsonError("Order has already been refunded", 409, "OrderAlreadyRefunded");
    }

    if (order.status === "READY_TO_CLAIM" || order.status === "CLAIMED") {
      return jsonError(
        `Order cannot be cancelled in status ${order.status}.`,
        400,
        "OrderNotCancellable"
      );
    }

    if (order.status === "AWAITING_PARCEL" && order.courierPaid) {
      return jsonError(
        "Order cannot be cancelled because the courier has already been paid.",
        409,
        "CourierAlreadyPaid"
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "CANCELLED",
        statusTimeline: appendStatusTimelineSql("CANCELLED", nowIso),
        cancelledBy: auth.session.userId,
        cancelledByRole: "CUSTOMER",
        cancelReasonCode: parsedReason.reasonCode,
        cancelReason: parsedReason.reason,
        cancelledAt: now,
        claimRequested: false,
        modifiedBy: auth.session.userId,
        timestamp: now,
      })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.customerId, auth.session.userId),
          inArray(orders.status, [
            "PENDING_INITIALIZATION",
            "PAYMENT_REQUIRED",
            "AWAITING_PARCEL",
          ]),
          eq(orders.courierPaid, false)
        )
      )
      .returning({
        id: orders.id,
        ticketCode: orders.ticketCode,
        status: orders.status,
        activatedAt: orders.activatedAt,
        amountReceived: orders.amountReceived,
        price: orders.price,
        courierPaid: orders.courierPaid,
        isRefunded: orders.isRefunded,
        refundAmount: orders.refundAmount,
        cancelledBy: orders.cancelledBy,
        cancelledByRole: orders.cancelledByRole,
        cancelReasonCode: orders.cancelReasonCode,
        cancelReason: orders.cancelReason,
        cancelledAt: orders.cancelledAt,
      });

    if (!updatedOrder) {
      return jsonError(
        "Order status changed concurrently and could not be cancelled",
        409,
        "Conflict"
      );
    }

    const { isRefundEligible, refundAmount } = computeRefundInfo(updatedOrder);
    const channels =
      order.status === "PENDING_INITIALIZATION"
        ? [`customer:${auth.session.userId}`]
        : ["staff:orders", `customer:${auth.session.userId}`];

    publishOrderSignal(channels, {
      event: "ORDER_CANCELLED",
      orderId: updatedOrder.id,
      ticketCode: updatedOrder.ticketCode ?? null,
      status: "CANCELLED",
      updatedAt: nowIso,
    });

    const response: CustomerCancelOrderRes = {
      statusMessage: "Order cancelled successfully",
      orderId: updatedOrder.id as OrderId,
      status: "CANCELLED",
      cancelledBy: updatedOrder.cancelledBy ?? auth.session.userId,
      cancelledByRole: updatedOrder.cancelledByRole ?? "CUSTOMER",
      cancelReasonCode: updatedOrder.cancelReasonCode ?? null,
      cancelReason: updatedOrder.cancelReason ?? null,
      cancelledAt: (updatedOrder.cancelledAt ?? now).toISOString(),
      isRefundEligible,
      refundAmount,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Customer Cancel Order Error]:", err);
    return jsonError("Unable to cancel order. Please try again.", 500);
  }
}
