import { NextRequest } from "next/server";
import { and, count, desc, eq, getTableColumns, gt, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { OrderRow, orders } from "@/db/schema";
import { authenticateCustomerRequest, customerAuthErrorResponse } from "@/app/lib/v1/auth";
import {
  computeClaimWindow,
  ORDER_NON_IMAGE_COLUMNS,
  serializeOrderCancelFields,
  serializeOrderRefundFields,
} from "@/app/lib/v1/orders";
import { parsePagination } from "@/app/lib/pagination";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerListOrdersRes,
  CustomerOrderSummary,
  OrderId,
  OrderStatus,
} from "@/app/types/v1/api";

const VALID_ORDER_STATUSES: readonly OrderStatus[] = [
  "PAYMENT_REQUIRED",
  "AWAITING_PARCEL",
  "READY_TO_CLAIM",
  "CLAIMED",
  "CANCELLED",
  "REFUNDED",
] as const;

export async function GET(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation:
    //    Require valid 15-minute authToken, strictly CUSTOMER role & valid DB user
    // ---------------------------------------------------------
    const auth = await authenticateCustomerRequest(request);
    if (!auth.session) {
      return customerAuthErrorResponse(auth);
    }

    // ---------------------------------------------------------
    // 2. Request Validation:
    //    Parse optional 'type' filter & pagination parameters
    // ---------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
    const forEach = searchParams.get("forEach") === "true";
    const includeOrders = searchParams.get("includeOrders") !== "false";
    let statusFilter: OrderStatus | undefined;

    if (typeParam) {
      if (!VALID_ORDER_STATUSES.includes(typeParam as OrderStatus)) {
        return jsonError("Invalid status filter", 400);
      }
      statusFilter = typeParam as OrderStatus;
    }

    const { limit, offset } = parsePagination(searchParams, 20, 100);

    // ---------------------------------------------------------
    // 3. Logic:
    //    Query per-status counts (and account totalOrders) strictly for this
    //    customer, omitting PENDING_INITIALIZATION drafts at the DB level.
    //    When includeOrders=false, skip fetching order rows and return only counts.
    //    Otherwise, also fetch orders with optional status filter, sorting by
    //    timestamp DESC, paginated by limit & offset (or per-status buckets when
    //    forEach=true and no single status filter).
    // ---------------------------------------------------------
    const customerId = auth.session.userId;
    const baseAccountWhere = and(
      eq(orders.customerId, customerId),
      ne(orders.status, "PENDING_INITIALIZATION")
    );

    const statusCountsQuery = db
      .select({
        status: orders.status,
        count: count(),
      })
      .from(orders)
      .where(baseAccountWhere)
      .groupBy(orders.status);

    const fetchOrderRows = async (): Promise<Omit<OrderRow, "proofImageUrl">[]> => {
      if (!includeOrders) {
        return [];
      }

      if (forEach && !statusFilter) {
        const { proofImageUrl: _proofImageUrl, ...nonImageColumns } = getTableColumns(orders);
        void _proofImageUrl;
        const ranked = db
          .select({
            ...nonImageColumns,
            rn: sql<number>`row_number() over (partition by ${orders.status} order by ${orders.timestamp} desc)`.as(
              "rn"
            ),
          })
          .from(orders)
          .where(baseAccountWhere)
          .as("ranked_orders");

        return await db
          .select()
          .from(ranked)
          .where(and(gt(ranked.rn, offset), lte(ranked.rn, offset + limit)))
          .orderBy(desc(ranked.timestamp));
      }

      return await db.query.orders.findMany({
        where: statusFilter
          ? and(eq(orders.customerId, customerId), eq(orders.status, statusFilter))
          : baseAccountWhere,
        orderBy: [desc(orders.timestamp)],
        limit,
        offset,
        columns: ORDER_NON_IMAGE_COLUMNS,
      });
    };

    const [statusCountRows, rows] = await Promise.all([statusCountsQuery, fetchOrderRows()]);

    let totalOrders = 0;
    const allStatusCounts: Partial<Record<OrderStatus, number>> = {};
    for (const row of statusCountRows) {
      const statusCount = Number(row.count);
      totalOrders += statusCount;
      allStatusCounts[row.status as OrderStatus] = statusCount;
    }

    const statusCounts: Partial<Record<OrderStatus, number>> = statusFilter
      ? { [statusFilter]: allStatusCounts[statusFilter] ?? 0 }
      : allStatusCounts;

    const nowMs = Date.now();

    const orderSummaries: CustomerOrderSummary[] = rows.map((row: Omit<OrderRow, "proofImageUrl">) => {
      return {
        id: row.id as OrderId,
        ticketCode: row.ticketCode,
        trackingId: row.trackingId,
        productName: row.productName,
        price: row.price,
        amountReceived: row.amountReceived ?? null,
        change: row.change,
        status: row.status,
        timestamp: row.timestamp.toISOString(),
        activatedAt: row.activatedAt ? row.activatedAt.toISOString() : null,
        courierPaid: row.courierPaid,
        isClaimActive: computeClaimWindow(row.claimRequested, row.claimExpiresAt, nowMs).isClaimActive,
        ...serializeOrderCancelFields(row),
        ...serializeOrderRefundFields(row, nowMs),
      };
    });

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK with formatted order list and account/status totals
    // ---------------------------------------------------------
    const response: CustomerListOrdersRes = {
      statusMessage: "Orders retrieved",
      orders: orderSummaries,
      totalOrders,
      statusCounts,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to retrieve orders. Please try again.", 500);
  }
}


