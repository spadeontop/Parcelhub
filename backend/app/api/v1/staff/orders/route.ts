import { NextRequest } from "next/server";
import { desc, eq, ne, count, and, or, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, staff } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
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
];

function getStatusMessage(status: OrderStatus): string {
  switch (status) {
    case "AWAITING_PARCEL":
      return "Awaiting parcel arrival";
    case "READY_TO_CLAIM":
      return "Ready for customer pickup";
    case "PAYMENT_REQUIRED":
      return "Awaiting customer cash deposit";
    case "PENDING_INITIALIZATION":
      return "Pending initialization";
    case "CLAIMED":
      return "Parcel claimed";
    case "CANCELLED":
      return "Order cancelled";
    default:
      return status;
  }
}

export async function GET(request: NextRequest) {
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
    //    Parse query params (status, search, limit, offset)
    // ---------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status");
    const rawSearch = searchParams.get("search")?.trim();

    if (rawStatus && !VALID_ORDER_STATUSES.includes(rawStatus as OrderStatus)) {
      return jsonError(
        `Invalid status filter. Allowed values: ${VALID_ORDER_STATUSES.join(", ")}`,
        400
      );
    }
    const statusFilter = rawStatus as OrderStatus | null;
    const searchFilter = rawSearch && rawSearch.length > 0 ? rawSearch : null;

    const { limit, offset } = parsePagination(searchParams, 20, 20);

    // Build filter expressions strictly scoped to non-draft orders, status, and (trackingId OR ticketCode)
    const conditions = [ne(orders.status, "PENDING_INITIALIZATION")];
    if (statusFilter) {
      conditions.push(eq(orders.status, statusFilter));
    }
    if (searchFilter) {
      conditions.push(
        or(
          ilike(orders.trackingId, `%${searchFilter}%`),
          ilike(orders.ticketCode, `%${searchFilter}%`)
        )!
      );
    }
    const whereClause = and(...conditions);

    // ---------------------------------------------------------
    // 3. Business Logic:
    //    a. Fetch paginated orders (LEFT JOIN staff for courierPaidByName) and totalCount
    //       in a single query using COUNT(*) OVER() to halve DB pool concurrency under bursts
    //    b. Compute live claim statuses and format summaries
    // ---------------------------------------------------------
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
        isRefunded: orders.isRefunded,
        timestamp: orders.timestamp,
        courierPaidByFirstName: staff.firstName,
        courierPaidByLastName: staff.lastName,
        totalCount: sql<number>`count(*) over()`,
      })
      .from(orders)
      .leftJoin(staff, eq(orders.courierPaidBy, staff.id))
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
      let isClaimActive = false;
      let claimRemainingSeconds = 0;

      if (o.claimRequested && o.claimExpiresAt) {
        const expiresMs = new Date(o.claimExpiresAt).getTime();
        const diffSec = Math.floor((expiresMs - nowMs) / 1000);
        if (diffSec > 0) {
          isClaimActive = true;
          claimRemainingSeconds = diffSec;
        }
      }

      const courierPaidByName =
        o.courierPaidByFirstName || o.courierPaidByLastName
          ? `${o.courierPaidByFirstName ?? ""} ${o.courierPaidByLastName ?? ""}`.trim()
          : undefined;

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
        statusMessage: getStatusMessage(o.status),
        isClaimActive,
        claimRemainingSeconds,
        courierPaid: o.courierPaid,
        courierPaidBy: (o.courierPaidBy as StaffId) || null,
        courierPaidByName,
        courierPaidAt: o.courierPaidAt ? o.courierPaidAt.toISOString() : null,
        createdAt: o.statusTimeline?.[0]?.timestamp || o.timestamp.toISOString(),
        statusTimeline: o.statusTimeline,
      };
    });

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK with orders and pagination metadata
    // ---------------------------------------------------------
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
    const errorMsg =
      err instanceof Error ? err.message : "Internal server error fetching orders";
    return jsonError(errorMsg, 500);
  }
}
