import { NextRequest } from "next/server";
import { desc, eq, ne, count, and, or, ilike, sql, gt, isNotNull } from "drizzle-orm";
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
} from "@/app/lib/v1/orders";
import { parsePagination } from "@/app/lib/pagination";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  OrderId,
  OrderStatus,
  StaffId,
  StaffListOrdersRes,
  StaffOrderSummary,
} from "@/app/types/v1/api";

const VALID_ORDER_STATUSES: OrderStatus[] = [
  "PAYMENT_REQUIRED",
  "AWAITING_PARCEL",
  "READY_TO_CLAIM",
  "CLAIMED",
  "CANCELLED",
  "REFUNDED",
];

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStaffRequest(request, ["STAFF"]);
    if (!auth.session) {
      return jsonError(auth.error || "Unauthorized", auth.status, "Unauthorized");
    }

    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status");
    const rawSearch = searchParams.get("search")?.trim();
    const refundEligibleOnly = searchParams.get("refundEligible") === "true";

    if (rawStatus && !VALID_ORDER_STATUSES.includes(rawStatus as OrderStatus)) {
      return jsonError(
        `Invalid status filter. Allowed values: ${VALID_ORDER_STATUSES.join(", ")}`,
        400
      );
    }
    const statusFilter = rawStatus as OrderStatus | null;
    const searchFilter = rawSearch && rawSearch.length > 0 ? rawSearch : null;

    const { limit, offset } = parsePagination(searchParams, 20, 20);

    const conditions = [ne(orders.status, "PENDING_INITIALIZATION")];
    if (statusFilter) {
      conditions.push(eq(orders.status, statusFilter));
    }
    if (refundEligibleOnly) {
      conditions.push(
        eq(orders.status, "CANCELLED"),
        eq(orders.isRefunded, false),
        eq(orders.courierPaid, false),
        isNotNull(orders.activatedAt),
        gt(orders.price, 0)
      );
    }
    if (searchFilter) {
      const escapedSearch = searchFilter.replace(/[\\%_]/g, "\\$&");
      conditions.push(
        or(
          ilike(orders.trackingId, `%${escapedSearch}%`),
          ilike(orders.ticketCode, `%${escapedSearch}%`)
        )!
      );
    }
    const whereClause = and(...conditions);

    const refundedByStaff = alias(staff, "refunded_by_staff");

    const dbOrders = await db
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
        modifiedBy: orders.modifiedBy,
        claimRequested: orders.claimRequested,
        claimInitiatedAt: orders.claimInitiatedAt,
        claimExpiresAt: orders.claimExpiresAt,
        courierPaid: orders.courierPaid,
        courierPaidBy: orders.courierPaidBy,
        courierPaidAt: orders.courierPaidAt,
        activatedAt: orders.activatedAt,
        cancelledByRole: orders.cancelledByRole,
        cancelReasonCode: orders.cancelReasonCode,
        cancelReason: orders.cancelReason,
        cancelledAt: orders.cancelledAt,
        refundRequested: orders.refundRequested,
        refundExpiresAt: orders.refundExpiresAt,
        isRefunded: orders.isRefunded,
        refundAmount: orders.refundAmount,
        refundedBy: orders.refundedBy,
        refundedAt: orders.refundedAt,
        timestamp: orders.timestamp,
        courierPaidByFirstName: staff.firstName,
        courierPaidByLastName: staff.lastName,
        refundedByFirstName: refundedByStaff.firstName,
        refundedByLastName: refundedByStaff.lastName,
        totalCount: sql<number>`count(*) over()`,
      })
      .from(orders)
      .leftJoin(staff, eq(orders.courierPaidBy, staff.id))
      .leftJoin(refundedByStaff, eq(orders.refundedBy, refundedByStaff.id))
      .where(whereClause)
      .orderBy(desc(orders.timestamp))
      .limit(limit)
      .offset(offset);

    let totalCount = Number(dbOrders[0]?.totalCount || 0);
    if (dbOrders.length === 0 && offset > 0) {
      const [countResult] = await db
        .select({ count: count() })
        .from(orders)
        .where(whereClause);
      totalCount = Number(countResult?.count || 0);
    }
    const nowMs = Date.now();

    const formattedOrders: StaffOrderSummary[] = dbOrders.map((o: (typeof dbOrders)[number]) => {
      const { isClaimActive, claimRemainingSeconds } = computeClaimWindow(
        o.claimRequested,
        o.claimExpiresAt,
        nowMs
      );
      const refundableAmount = computeRefundableAmount(o);
      const { isRefundActive, refundRemainingSeconds } = computeRefundWindow(
        o.refundRequested,
        o.refundExpiresAt,
        nowMs
      );

      return {
        id: o.id as OrderId,
        ticketCode: o.ticketCode,
        trackingId: o.trackingId,
        customer: o.recipientName,
        amountToPay: o.price,
        amountReceived: o.amountReceived || 0,
        change: o.change || 0,
        timestamp: o.timestamp.toISOString(),
        status: o.status,
        statusMessage: getStaffOrderStatusMessage(o.status),
        isClaimActive,
        claimRemainingSeconds,
        courierPaid: o.courierPaid,
        courierPaidBy: (o.courierPaidBy as StaffId) || null,
        courierPaidByName: formatStaffFullName(
          o.courierPaidByFirstName,
          o.courierPaidByLastName
        ),
        courierPaidAt: o.courierPaidAt ? o.courierPaidAt.toISOString() : null,
        createdAt: o.statusTimeline?.[0]?.timestamp || o.timestamp.toISOString(),
        statusTimeline: o.statusTimeline,
        cancelledByRole: o.cancelledByRole ?? null,
        cancelReasonCode: o.cancelReasonCode ?? null,
        cancelReason: o.cancelReason ?? null,
        cancelledAt: o.cancelledAt ? o.cancelledAt.toISOString() : null,
        isRefundEligible: refundableAmount > 0,
        refundableAmount,
        isRefundActive,
        refundRemainingSeconds,
        isRefunded: o.isRefunded,
        refundAmount: o.refundAmount ?? null,
        refundedBy: (o.refundedBy as StaffId) || null,
        refundedByName: formatStaffFullName(
          o.refundedByFirstName,
          o.refundedByLastName
        ),
        refundedAt: o.refundedAt ? o.refundedAt.toISOString() : null,
      };
    });

    const response: StaffListOrdersRes = {
      orders: formattedOrders,
      pagination: {
        totalCount,
        limit,
        offset,
        hasMore: offset + formattedOrders.length < totalCount,
      },
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Staff List Orders Error]:", err);
    return jsonError("Internal server error fetching orders", 500, "Internal Server Error");
  }
}
