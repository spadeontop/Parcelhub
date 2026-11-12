import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { OrderRow, orders } from "@/db/schema";
import { authenticateCustomerRequest } from "@/app/lib/v1/auth";
import { parsePagination } from "@/app/lib/pagination";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerListOrdersRes,
  CustomerOrderSummary,
  OrderId,
  OrderStatus,
} from "@/app/types/v1/api";

const VALID_ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING_INITIALIZATION",
  "PAYMENT_REQUIRED",
  "AWAITING_PARCEL",
  "READY_TO_CLAIM",
  "CLAIMED",
  "CANCELLED",
] as const;

export async function GET(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation:
    //    Require valid 15-minute authToken, strictly CUSTOMER role & valid DB user
    // ---------------------------------------------------------
    const auth = await authenticateCustomerRequest(request);
    if (!auth.session) {
      if (auth.status === 403) {
        return jsonError("Access denied", 403, "Forbidden");
      }
      if (auth.status === 404) {
        return jsonError("Account not found", 404, "Not Found");
      }
      return jsonError("Please log in again", 401, "Unauthorized");
    }

    // ---------------------------------------------------------
    // 2. Request Validation:
    //    Parse optional 'type' filter & pagination parameters
    // ---------------------------------------------------------
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");
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
    //    Query orders strictly for this customer, applying optional status filter,
    //    sorting by timestamp DESC, paginated by limit & offset.
    // ---------------------------------------------------------
    const rows: OrderRow[] = await db.query.orders.findMany({
      where: statusFilter
        ? and(eq(orders.customerId, auth.session.userId), eq(orders.status, statusFilter))
        : eq(orders.customerId, auth.session.userId),
      orderBy: [desc(orders.timestamp)],
      limit,
      offset,
    });

    const now = new Date();

    const orderSummaries: CustomerOrderSummary[] = rows.map((row: OrderRow) => ({
      id: row.id as OrderId,
      ticketCode: row.ticketCode,
      trackingId: row.trackingId,
      productName: row.productName,
      status: row.status,
      timestamp: row.timestamp.toISOString(),
      isClaimActive:
        row.claimRequested &&
        row.claimExpiresAt !== null &&
        new Date(row.claimExpiresAt) > now,
    }));

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK with formatted order list
    // ---------------------------------------------------------
    const response: CustomerListOrdersRes = {
      statusMessage: "Orders retrieved",
      orders: orderSummaries,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to retrieve orders. Please try again.", 500);
  }
}


