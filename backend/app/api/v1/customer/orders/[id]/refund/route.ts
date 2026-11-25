import { NextRequest } from "next/server";
import { and, eq, gt, gte, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateCustomerRequest, customerAuthErrorResponse } from "@/app/lib/v1/auth";
import {
  computeRefundInfo,
  computeRefundWindow,
  matchOrderByIdOrTicket,
  ORDER_NON_IMAGE_COLUMNS,
  parseOptionalCancelOrRefundReason,
} from "@/app/lib/v1/orders";
import { parseOptionalJsonBody } from "@/app/lib/v1/request";
import { publishOrderSignal } from "@/app/lib/v1/realtime";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import type {
  CustomerInitiateRefundReq,
  CustomerInitiateRefundRes,
  OrderId,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getRefundTimerMinutes(): number {
  const envVal = process.env.CLIENT_REFUND_TIMER || process.env.CLIENT_RETRIEVE_TIMER;
  if (!envVal) return 5;
  const parsed = parseInt(envVal, 10);
  return isNaN(parsed) || parsed <= 0 ? 5 : parsed;
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

    const parsedBody = await parseOptionalJsonBody<CustomerInitiateRefundReq>(request);
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

    if (order.status === "REFUNDED" || order.isRefunded) {
      return jsonError("Order has already been refunded", 409, "OrderAlreadyRefunded");
    }

    if (order.status !== "CANCELLED") {
      return jsonError(
        `Order must be cancelled before requesting a refund (current status: ${order.status}).`,
        400,
        "OrderNotCancelled"
      );
    }

    if (order.courierPaid) {
      return jsonError(
        "Order is not eligible for refund because the courier has already been paid.",
        409,
        "CourierAlreadyPaid"
      );
    }

    const { isRefundEligible, refundAmount } = computeRefundInfo(order);
    if (!isRefundEligible || refundAmount <= 0) {
      return jsonError(
        "This order has no refundable counter deposit.",
        400,
        "OrderNotRefundEligible"
      );
    }

    const durationMinutes = getRefundTimerMinutes();
    const initiatedAt = new Date();
    const expiresAt = new Date(initiatedAt.getTime() + durationMinutes * 60 * 1000);

    const [updatedOrder] = await db
      .update(orders)
      .set({
        refundRequested: true,
        refundInitiatedAt: initiatedAt,
        refundExpiresAt: expiresAt,
        refundReasonCode:
          parsedReason.reasonCode ?? order.refundReasonCode ?? order.cancelReasonCode ?? null,
        refundReason: parsedReason.reason ?? order.refundReason ?? order.cancelReason ?? null,
        modifiedBy: auth.session.userId,
        timestamp: initiatedAt,
      })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.customerId, auth.session.userId),
          eq(orders.status, "CANCELLED"),
          eq(orders.isRefunded, false),
          eq(orders.courierPaid, false),
          isNotNull(orders.activatedAt),
          isNotNull(orders.amountReceived),
          gt(orders.amountReceived, 0),
          gte(orders.amountReceived, orders.price)
        )
      )
      .returning({
        id: orders.id,
        refundRequested: orders.refundRequested,
        refundInitiatedAt: orders.refundInitiatedAt,
        refundExpiresAt: orders.refundExpiresAt,
        refundReasonCode: orders.refundReasonCode,
        refundReason: orders.refundReason,
      });

    if (!updatedOrder) {
      return jsonError(
        "Order is no longer eligible for a refund pass",
        409,
        "Conflict"
      );
    }

    publishOrderSignal(["staff:orders", `customer:${auth.session.userId}`], {
      event: "REFUND_INITIATED",
      orderId: order.id,
      ticketCode: order.ticketCode ?? null,
      status: "CANCELLED",
      updatedAt: initiatedAt.toISOString(),
    });

    const effectiveInitiatedAt = updatedOrder.refundInitiatedAt ?? initiatedAt;
    const effectiveExpiresAt = updatedOrder.refundExpiresAt ?? expiresAt;
    const { isRefundActive, refundRemainingSeconds } = computeRefundWindow(
      updatedOrder.refundRequested,
      effectiveExpiresAt,
      initiatedAt.getTime()
    );

    const response: CustomerInitiateRefundRes = {
      statusMessage: "Refund pass initiated",
      orderId: updatedOrder.id as OrderId,
      refundAmount,
      refundRequested: updatedOrder.refundRequested,
      refundInitiatedAt: effectiveInitiatedAt.toISOString(),
      refundExpiresAt: effectiveExpiresAt.toISOString(),
      isRefundActive,
      refundRemainingSeconds,
      durationMinutes,
      refundReasonCode: updatedOrder.refundReasonCode ?? null,
      refundReason: updatedOrder.refundReason ?? null,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Customer Initiate Refund Error]:", err);
    return jsonError("Unable to initiate refund. Please try again.", 500);
  }
}
