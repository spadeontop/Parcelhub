import { NextRequest } from "next/server";
import { desc, eq, ne, count, and, or, ilike, sql, gt, gte, lte, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { orders, staff } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import {
  computeClaimWindow,
  formatStaffFullName,
  getStaffOrderStatusMessage,
  serializeOrderCancelFields,
  serializeStaffOrderRefundFields,
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
    const forEach = searchParams.get("forEach") === "true";

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
        isNotNull(orders.amountReceived),
        gt(orders.amountReceived, 0),
        gte(orders.amountReceived, orders.price)
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

    const orderBaseSelect = {
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
      totalCount: sql<number>`count(*) over()`.as("total_count"),
    };

    const staffJoinSelect = {
      courierPaidByFirstName: sql<string | null>`${staff.firstName}`.as(
        "courier_paid_by_first_name"
      ),
      courierPaidByLastName: sql<string | null>`${staff.lastName}`.as(
        "courier_paid_by_last_name"
      ),
      refundedByFirstName: sql<string | null>`${refundedByStaff.firstName}`.as(
        "refunded_by_first_name"
      ),
      refundedByLastName: sql<string | null>`${refundedByStaff.lastName}`.as(
        "refunded_by_last_name"
      ),
    };

    const useForEachBuckets = forEach && !statusFilter;

    let dbOrders;
    let hasMore = false;
    let statusCounts: Partial<Record<OrderStatus, number>> | undefined;

    if (useForEachBuckets) {
      // Rank orders before joining staff so the derived table has no duplicate joined
      // column names and staff joins only run on the sliced per-status buckets.
      const ranked = db
        .select({
          ...orderBaseSelect,
          rn: sql<number>`row_number() over (partition by ${orders.status} order by ${orders.timestamp} desc, ${orders.id} desc)`.as(
            "rn"
          ),
          bucketCount: sql<number>`count(*) over (partition by ${orders.status})`.as(
            "bucket_count"
          ),
        })
        .from(orders)
        .where(whereClause)
        .as("ranked_orders");

      const bucketedOrders = await db
        .select({
          id: ranked.id,
          ticketCode: ranked.ticketCode,
          trackingId: ranked.trackingId,
          recipientName: ranked.recipientName,
          price: ranked.price,
          amountReceived: ranked.amountReceived,
          change: ranked.change,
          status: ranked.status,
          statusTimeline: ranked.statusTimeline,
          modifiedBy: ranked.modifiedBy,
          claimRequested: ranked.claimRequested,
          claimInitiatedAt: ranked.claimInitiatedAt,
          claimExpiresAt: ranked.claimExpiresAt,
          courierPaid: ranked.courierPaid,
          courierPaidBy: ranked.courierPaidBy,
          courierPaidAt: ranked.courierPaidAt,
          activatedAt: ranked.activatedAt,
          cancelledBy: ranked.cancelledBy,
          cancelledByRole: ranked.cancelledByRole,
          cancelReasonCode: ranked.cancelReasonCode,
          cancelReason: ranked.cancelReason,
          cancelledAt: ranked.cancelledAt,
          refundRequested: ranked.refundRequested,
          refundInitiatedAt: ranked.refundInitiatedAt,
          refundExpiresAt: ranked.refundExpiresAt,
          refundReasonCode: ranked.refundReasonCode,
          refundReason: ranked.refundReason,
          isRefunded: ranked.isRefunded,
          refundAmount: ranked.refundAmount,
          refundedBy: ranked.refundedBy,
          refundedAt: ranked.refundedAt,
          timestamp: ranked.timestamp,
          totalCount: ranked.totalCount,
          bucketCount: ranked.bucketCount,
          ...staffJoinSelect,
        })
        .from(ranked)
        .leftJoin(staff, eq(ranked.courierPaidBy, staff.id))
        .leftJoin(refundedByStaff, eq(ranked.refundedBy, refundedByStaff.id))
        .where(and(gt(ranked.rn, offset), lte(ranked.rn, offset + limit)))
        .orderBy(desc(ranked.timestamp), desc(ranked.id));

      hasMore = bucketedOrders.some(
        (o: (typeof bucketedOrders)[number]) => Number(o.bucketCount) > offset + limit
      );
      statusCounts = {};
      if (offset === 0) {
        for (const o of bucketedOrders) {
          if (statusCounts[o.status as OrderStatus] === undefined) {
            statusCounts[o.status as OrderStatus] = Number(o.bucketCount);
          }
        }
      } else {
        const groupedCounts = await db
          .select({ status: orders.status, count: count() })
          .from(orders)
          .where(whereClause)
          .groupBy(orders.status);
        for (const row of groupedCounts) {
          statusCounts[row.status as OrderStatus] = Number(row.count);
        }
      }
      dbOrders = bucketedOrders;
    } else {
      dbOrders = await db
        .select({
          ...orderBaseSelect,
          ...staffJoinSelect,
        })
        .from(orders)
        .leftJoin(staff, eq(orders.courierPaidBy, staff.id))
        .leftJoin(refundedByStaff, eq(orders.refundedBy, refundedByStaff.id))
        .where(whereClause)
        .orderBy(desc(orders.timestamp), desc(orders.id))
        .limit(limit)
        .offset(offset);
    }

    let totalCount = Number(dbOrders[0]?.totalCount || 0);
    if (dbOrders.length === 0 && offset > 0) {
      if (statusCounts) {
        totalCount = Object.values(statusCounts).reduce((sum, n) => sum + (n ?? 0), 0);
      } else {
        const [countResult] = await db
          .select({ count: count() })
          .from(orders)
          .where(whereClause);
        totalCount = Number(countResult?.count || 0);
      }
    }
    const nowMs = Date.now();

    const formattedOrders: StaffOrderSummary[] = dbOrders.map((o: (typeof dbOrders)[number]) => {
      const { isClaimActive, claimRemainingSeconds } = computeClaimWindow(
        o.claimRequested,
        o.claimExpiresAt,
        nowMs
      );
      return {
        id: o.id as OrderId,
        ticketCode: o.ticketCode,
        trackingId: o.trackingId,
        customer: o.recipientName,
        amountToPay: o.price,
        amountReceived: o.amountReceived ?? null,
        change: o.change ?? 0,
        timestamp: o.timestamp.toISOString(),
        status: o.status,
        statusMessage: getStaffOrderStatusMessage(o.status),
        activatedAt: o.activatedAt ? o.activatedAt.toISOString() : null,
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
        ...serializeOrderCancelFields(o),
        ...serializeStaffOrderRefundFields(o, nowMs),
      };
    });

    const response: StaffListOrdersRes = {
      orders: formattedOrders,
      pagination: {
        totalCount,
        limit,
        offset,
        hasMore: useForEachBuckets ? hasMore : offset + formattedOrders.length < totalCount,
      },
      ...(statusCounts ? { statusCounts } : {}),
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Staff List Orders Error]:", err);
    return jsonError("Internal server error fetching orders", 500, "Internal Server Error");
  }
}
