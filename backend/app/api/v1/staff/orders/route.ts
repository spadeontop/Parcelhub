import { NextRequest } from "next/server";
import { desc, eq, count, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, staff, OrderRow } from "@/db/schema";
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
  "PENDING_INITIALIZATION",
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
    //    Parse query params (status, limit, offset)
    // ---------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get("status");

    if (rawStatus && !VALID_ORDER_STATUSES.includes(rawStatus as OrderStatus)) {
      return jsonError(
        `Invalid status filter. Allowed values: ${VALID_ORDER_STATUSES.join(", ")}`,
        400
      );
    }
    const statusFilter = rawStatus as OrderStatus | null;

    const { limit, offset } = parsePagination(searchParams, 20, 100);

    // ---------------------------------------------------------
    // 3. Business Logic:
    //    a. Count total matching orders for pagination metadata
    //    b. Fetch paginated orders from database ordered by timestamp desc
    //    c. Compute live claim statuses and staff names
    // ---------------------------------------------------------
    const countQuery = db
      .select({ count: count() })
      .from(orders);

    const totalCountResult = statusFilter
      ? await countQuery.where(eq(orders.status, statusFilter))
      : await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    const ordersQuery = db
      .select({
        id: orders.id,
        ticketCode: orders.ticketCode,
        trackingId: orders.trackingId,
        productName: orders.productName,
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
      })
      .from(orders);

    const dbOrders = statusFilter
      ? await ordersQuery
          .where(eq(orders.status, statusFilter))
          .orderBy(desc(orders.timestamp))
          .limit(limit)
          .offset(offset)
      : await ordersQuery
          .orderBy(desc(orders.timestamp))
          .limit(limit)
          .offset(offset);

    // Collect courier staff IDs to fetch names in one batch if needed
    const staffIdsToFetch: string[] = Array.from(
      new Set(
        dbOrders
          .map((o) => o.courierPaidBy)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    const staffMap = new Map<string, string>();
    if (staffIdsToFetch.length > 0) {
      const staffList = await db
        .select()
        .from(staff)
        .where(inArray(staff.id, staffIdsToFetch));

      for (const s of staffList) {
        staffMap.set(s.id, `${s.firstName} ${s.lastName}`);
      }
    }

    const nowMs = Date.now();

    const formattedOrders: StaffOrderSummary[] = dbOrders.map((o) => {
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

      const courierPaidByName = o.courierPaidBy
        ? staffMap.get(o.courierPaidBy)
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
