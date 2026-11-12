import { NextRequest } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateCustomerRequest } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerGetOrderRes,
  CustomerOrderDetail,
  OrderId,
  OrderStatusHistoryTuple,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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
    //    Resolve and validate id param
    // ---------------------------------------------------------
    const { id: rawId } = await params;
    const identifier = rawId?.trim();

    if (!identifier) {
      return jsonError("Order identifier is required", 400);
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Find order by either UUID (id) or ticketCode
    //    b. Verify ownership: must match auth.session.userId
    //    c. Compute isClaimActive and claimRemainingSeconds
    // ---------------------------------------------------------
    const order = await db.query.orders.findFirst({
      where: and(
        or(eq(orders.id, identifier), eq(orders.ticketCode, identifier.toUpperCase())),
        eq(orders.customerId, auth.session.userId)
      ),
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    const now = Date.now();
    let isClaimActive = false;
    let claimRemainingSeconds = 0;

    if (order.claimRequested && order.claimExpiresAt) {
      const expiresAtMs = new Date(order.claimExpiresAt).getTime();
      if (expiresAtMs > now) {
        isClaimActive = true;
        claimRemainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
      }
    }

    const orderDetail: CustomerOrderDetail = {
      id: order.id as OrderId,
      ticketCode: order.ticketCode,
      trackingId: order.trackingId,
      productName: order.productName,
      recipientName: order.recipientName,
      price: order.price,
      change: order.change,
      status: order.status,
      statusTimeline: (order.statusTimeline ?? []) as unknown as OrderStatusHistoryTuple,
      imageUrl: order.imageUrl,
      proofImageUrl: order.proofImageUrl,
      claimInitiatedAt: order.claimInitiatedAt ? order.claimInitiatedAt.toISOString() : null,
      claimExpiresAt: order.claimExpiresAt ? order.claimExpiresAt.toISOString() : null,
      isClaimActive,
      claimRemainingSeconds,
    };

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK with order details
    // ---------------------------------------------------------
    const response: CustomerGetOrderRes = {
      statusMessage: "Order details retrieved",
      order: orderDetail,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to retrieve order. Please try again.", 500);
  }
}

