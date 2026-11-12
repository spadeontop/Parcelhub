import { NextRequest } from "next/server";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderScreenshots } from "@/db/schema";
import { authenticateCustomerRequest } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerGetOrderRes,
  CustomerOrderDetail,
  CustomerUpdateOrderReq,
  CustomerUpdateOrderRes,
  OrderId,
  OrderStatus,
  OrderStatusHistoryTuple,
  StatusTimelineEntry,
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    //    Resolve {id} and strictly require all confirmation fields
    // ---------------------------------------------------------
    const { id: rawId } = await params;
    const identifier = rawId?.trim();

    if (!identifier) {
      return jsonError("Order identifier is required", 400);
    }

    let body: CustomerUpdateOrderReq;
    try {
      body = (await request.json()) as CustomerUpdateOrderReq;
    } catch {
      return jsonError("Invalid request body", 400);
    }

    if (!body?.order || typeof body.order !== "object") {
      return jsonError("Order payload is required", 400);
    }

    const trackingId =
      typeof body.order.trackingId === "string" ? body.order.trackingId.trim() : "";
    const productName =
      typeof body.order.productName === "string" ? body.order.productName.trim() : "";
    const recipientName =
      typeof body.order.recipientName === "string" ? body.order.recipientName.trim() : "";
    const price = body.order.price;

    if (
      !trackingId ||
      !productName ||
      !recipientName ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return jsonError(
        "trackingId, productName, recipientName, and a non-negative price are required",
        400
      );
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Fetch order by UUID or ticketCode matching customerId
    //    b. Enforce one-shot continuation strictly from PENDING_INITIALIZATION
    //    c. Enforce AI_VERIFICATION gate when enabled in environment
    //    d. Check trackingId uniqueness against paid non-cancelled orders
    //    e. Update order details and transition status -> PAYMENT_REQUIRED
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

    if (order.status !== "PENDING_INITIALIZATION") {
      return jsonError(
        `Order cannot be updated in its current status (${order.status}). Only PENDING_INITIALIZATION orders can be confirmed.`,
        400,
        "OrderNotEditable"
      );
    }

    if (process.env.AI_VERIFICATION === "true") {
      const screenshot = await db.query.orderScreenshots.findFirst({
        where: eq(orderScreenshots.orderId, order.id),
      });

      if (!screenshot || !screenshot.isVerified) {
        return jsonError(
          "Order screenshot has not passed AI verification",
          403,
          "Forbidden"
        );
      }
    }

    const paidDuplicate = await db.query.orders.findFirst({
      where: and(
        eq(orders.trackingId, trackingId),
        ne(orders.id, order.id),
        inArray(orders.status, [
          "AWAITING_PARCEL",
          "READY_TO_CLAIM",
          "CLAIMED",
        ] as OrderStatus[])
      ),
    });

    if (paidDuplicate) {
      return jsonError(
        "Tracking number is already registered to a paid active parcel",
        409,
        "Conflict"
      );
    }

    const now = new Date();
    const currentTimeline = (order.statusTimeline ?? []) as StatusTimelineEntry[];
    const updatedTimeline: StatusTimelineEntry[] = [
      ...currentTimeline,
      {
        status: "PAYMENT_REQUIRED",
        timestamp: now.toISOString(),
      },
    ];

    const [updatedOrder] = await db
      .update(orders)
      .set({
        trackingId,
        productName,
        recipientName,
        price,
        status: "PAYMENT_REQUIRED",
        statusTimeline: updatedTimeline,
        modifiedBy: auth.session.userId,
        timestamp: now,
      })
      .where(
        and(eq(orders.id, order.id), eq(orders.status, "PENDING_INITIALIZATION"))
      )
      .returning();

    if (!updatedOrder) {
      return jsonError(
        "Order is no longer in PENDING_INITIALIZATION status",
        400,
        "OrderNotEditable"
      );
    }

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK confirming transition to PAYMENT_REQUIRED
    // ---------------------------------------------------------
    const response: CustomerUpdateOrderRes = {
      statusMessage: "Order updated successfully",
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to update order. Please try again.", 500);
  }
}

