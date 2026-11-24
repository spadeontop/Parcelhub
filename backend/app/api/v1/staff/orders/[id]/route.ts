import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { orders, staff } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import {
  computeClaimWindow,
  computeRefundableAmount,
  computeRefundWindow,
  formatStaffFullName,
  getStaffOrderStatusMessage,
  matchOrderByIdOrTicket,
} from "@/app/lib/v1/orders";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  OrderId,
  StaffGetOrderRes,
  StaffId,
  StaffOrderDetail,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const refundedByStaff = alias(staff, "refunded_by_staff");

    const [order] = await db
      .select({
        id: orders.id,
        ticketCode: orders.ticketCode,
        trackingId: orders.trackingId,
        recipientName: orders.recipientName,
        price: orders.price,
        amountReceived: orders.amountReceived,
        change: orders.change,
        status: orders.status,
        statusTimeline: orders.statusTimeline,
        claimRequested: orders.claimRequested,
        claimExpiresAt: orders.claimExpiresAt,
        courierPaid: orders.courierPaid,
        courierPaidBy: orders.courierPaidBy,
        courierPaidAt: orders.courierPaidAt,
        activatedAt: orders.activatedAt,
        cancelledBy: orders.cancelledBy,
        cancelledByRole: orders.cancelledByRole,
        cancelReasonCode: orders.cancelReasonCode,
        cancelReason: orders.cancelReason,
        cancelledAt: orders.cancelledAt,
        refundRequested: orders.refundRequested,
        refundInitiatedAt: orders.refundInitiatedAt,
        refundExpiresAt: orders.refundExpiresAt,
        refundReasonCode: orders.refundReasonCode,
        refundReason: orders.refundReason,
        isRefunded: orders.isRefunded,
        refundAmount: orders.refundAmount,
        refundedBy: orders.refundedBy,
        refundedAt: orders.refundedAt,
        timestamp: orders.timestamp,
        courierPaidByFirstName: staff.firstName,
        courierPaidByLastName: staff.lastName,
        refundedByFirstName: refundedByStaff.firstName,
        refundedByLastName: refundedByStaff.lastName,
      })
      .from(orders)
      .leftJoin(staff, eq(orders.courierPaidBy, staff.id))
      .leftJoin(refundedByStaff, eq(orders.refundedBy, refundedByStaff.id))
      .where(matchOrderByIdOrTicket(lookupId))
      .limit(1);

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    const { isClaimActive, claimRemainingSeconds } = computeClaimWindow(
      order.claimRequested,
      order.claimExpiresAt
    );
    const refundableAmount = computeRefundableAmount(order);
    const { isRefundActive, refundRemainingSeconds } = computeRefundWindow(
      order.refundRequested,
      order.refundExpiresAt
    );

    const orderDetail: StaffOrderDetail = {
      orderId: order.id as OrderId,
      ticketCode: order.ticketCode,
      trackingId: order.trackingId,
      customer: order.recipientName,
      amountToPay: order.price,
      amountReceived: order.amountReceived ?? null,
      change: order.change ?? 0,
      timestamp: order.timestamp.toISOString(),
      status: order.status,
      statusMessage: getStaffOrderStatusMessage(order.status),
      isClaimActive,
      claimRemainingSeconds,
      courierPaid: order.courierPaid,
      courierPaidBy: (order.courierPaidBy as StaffId) || null,
      courierPaidByName: formatStaffFullName(
        order.courierPaidByFirstName,
        order.courierPaidByLastName
      ),
      courierPaidAt: order.courierPaidAt ? order.courierPaidAt.toISOString() : null,
      createdAt: order.statusTimeline?.[0]?.timestamp || order.timestamp.toISOString(),
      statusTimeline: order.statusTimeline,
      cancelledBy: order.cancelledBy ?? null,
      cancelledByRole: order.cancelledByRole ?? null,
      cancelReasonCode: order.cancelReasonCode ?? null,
      cancelReason: order.cancelReason ?? null,
      cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
      isRefundEligible: refundableAmount > 0,
      refundableAmount,
      refundRequested: order.refundRequested,
      refundInitiatedAt: order.refundInitiatedAt ? order.refundInitiatedAt.toISOString() : null,
      refundExpiresAt: order.refundExpiresAt ? order.refundExpiresAt.toISOString() : null,
      isRefundActive,
      refundRemainingSeconds,
      refundReasonCode: order.refundReasonCode ?? null,
      refundReason: order.refundReason ?? null,
      isRefunded: order.isRefunded,
      refundAmount: order.refundAmount ?? null,
      refundedBy: (order.refundedBy as StaffId) || null,
      refundedByName: formatStaffFullName(
        order.refundedByFirstName,
        order.refundedByLastName
      ),
      refundedAt: order.refundedAt ? order.refundedAt.toISOString() : null,
    };

    const response: StaffGetOrderRes = orderDetail;
    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Staff Get Order Error]:", err);
    return jsonError("Internal server error fetching order detail", 500, "Internal Server Error");
  }
}
