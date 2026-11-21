import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderScreenshots } from "@/db/schema";
import { authenticateCustomerRequest, customerAuthErrorResponse } from "@/app/lib/v1/auth";
import {
  appendStatusTimelineSql,
  computeClaimWindow,
  hasActivePaidTrackingId,
  matchOrderByIdOrTicket,
  normalizeTrackingId,
  ORDER_NON_IMAGE_COLUMNS,
} from "@/app/lib/v1/orders";
import { parseJsonBody } from "@/app/lib/v1/request";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerGetOrderRes,
  CustomerOrderDetail,
  CustomerUpdateOrderReq,
  CustomerUpdateOrderRes,
  OrderId,
  OrderStatusHistoryTuple,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { isClaimActive, claimRemainingSeconds } = computeClaimWindow(
      order.claimRequested,
      order.claimExpiresAt
    );

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
      claimInitiatedAt: order.claimInitiatedAt ? order.claimInitiatedAt.toISOString() : null,
      claimExpiresAt: order.claimExpiresAt ? order.claimExpiresAt.toISOString() : null,
      isClaimActive,
      claimRemainingSeconds,
    };

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
    const auth = await authenticateCustomerRequest(request);
    if (!auth.session) {
      return customerAuthErrorResponse(auth);
    }

    const { id: rawId } = await params;
    const identifier = rawId?.trim();

    if (!identifier) {
      return jsonError("Order identifier is required", 400);
    }

    const parsedBody = await parseJsonBody<CustomerUpdateOrderReq>(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }
    const body = parsedBody.data;

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

    const [order] = await db
      .select({
        id: orders.id,
        status: orders.status,
        screenshotVerified: orderScreenshots.isVerified,
      })
      .from(orders)
      .leftJoin(orderScreenshots, eq(orderScreenshots.orderId, orders.id))
      .where(
        and(
          matchOrderByIdOrTicket(identifier),
          eq(orders.customerId, auth.session.userId)
        )
      )
      .limit(1);

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

    if (process.env.AI_VERIFICATION === "true" && !order.screenshotVerified) {
      return jsonError(
        "Order screenshot has not passed AI verification",
        403,
        "Forbidden"
      );
    }

    const normalizedTrackingId = normalizeTrackingId(trackingId);
    if (await hasActivePaidTrackingId(normalizedTrackingId, order.id)) {
      return jsonError(
        "Tracking number is already registered to a paid active parcel",
        409,
        "Conflict"
      );
    }

    const now = new Date();
    const [updatedOrder] = await db
      .update(orders)
      .set({
        trackingId: normalizedTrackingId,
        productName,
        recipientName,
        price,
        status: "PAYMENT_REQUIRED",
        statusTimeline: appendStatusTimelineSql("PAYMENT_REQUIRED", now.toISOString()),
        modifiedBy: auth.session.userId,
        timestamp: now,
      })
      .where(
        and(eq(orders.id, order.id), eq(orders.status, "PENDING_INITIALIZATION"))
      )
      .returning({ id: orders.id });

    if (!updatedOrder) {
      return jsonError(
        "Order is no longer in PENDING_INITIALIZATION status",
        400,
        "OrderNotEditable"
      );
    }

    const response: CustomerUpdateOrderRes = {
      statusMessage: "Order updated successfully",
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to update order. Please try again.", 500);
  }
}
