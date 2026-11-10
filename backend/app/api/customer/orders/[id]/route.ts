import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import {
  CustomerId,
  CustomerCancelOrderRes,
  CustomerGetOrderRes,
  CustomerOrderDetail,
  CustomerUpdateOrderReq,
  CustomerUpdateOrderRes,
  OrderId,
} from "@/app/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["CUSTOMER", "STAFF", "ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const order = await db.getOrder(id as OrderId);

  if (!order) {
    return jsonError("Order not found", 404, "Not Found");
  }

  if (auth.session.role === "CUSTOMER" && order.customerId !== auth.session.userId) {
    return jsonError("Unauthorized access to this order", 403, "Forbidden");
  }

  const orderDetail: CustomerOrderDetail = {
    id: order.id,
    trackingId: order.trackingId,
    productName: order.productName,
    recipientName: order.recipientName,
    price: order.price,
    change: order.change,
    status: order.status,
    statusTimeline: order.statusTimeline,
    qrImageUrl: order.qrImageUrl,
    claimInitiatedAt: order.claimInitiatedAt,
    claimExpiresAt: order.claimExpiresAt,
    isClaimActive: db.isClaimActive(order),
    claimRemainingSeconds: db.getClaimRemainingSeconds(order),
  };

  const response: CustomerGetOrderRes = {
    statusMessage: "Order details retrieved",
    order: orderDetail,
  };

  return jsonSuccess(response);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["CUSTOMER"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const order = await db.getOrder(id as OrderId);
  if (!order) {
    return jsonError("Order not found", 404, "Not Found");
  }

  if (order.customerId !== auth.session.userId) {
    return jsonError("Unauthorized access to modify this order", 403, "Forbidden");
  }

  // Customer can ONLY edit orders when unpaid/inactive (PENDING_INITIALIZATION or PAYMENT_REQUIRED)
  if (order.status !== "PENDING_INITIALIZATION" && order.status !== "PAYMENT_REQUIRED") {
    return jsonError(
      `Order cannot be edited in its current status (${order.status}). Edits are only permitted while unpaid/inactive.`,
      400,
      "OrderNotEditable"
    );
  }

  try {
    const body = (await request.json()) as CustomerUpdateOrderReq;
    if (!body.order) {
      return jsonError("Order payload is required", 400);
    }

    if (body.order.trackingId) {
      const activeDuplicate = await db.getActiveOrderByTrackingId(body.order.trackingId, id as OrderId);
      if (activeDuplicate) {
        return jsonError(
          `Tracking ID "${body.order.trackingId}" is already registered to an active order (${activeDuplicate.id}). Tracking IDs must be unique across active orders.`,
          409,
          "DuplicateTrackingId"
        );
      }
    }

    await db.updateOrder(id as OrderId, body.order, auth.session.userId as CustomerId);

    const response: CustomerUpdateOrderRes = {
      statusMessage: "Order updated successfully",
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["CUSTOMER"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const order = await db.getOrder(id as OrderId);
  if (!order) {
    return jsonError("Order not found", 404, "Not Found");
  }

  if (order.customerId !== auth.session.userId) {
    return jsonError("Unauthorized access to cancel this order", 403, "Forbidden");
  }

  if (order.status === "CLAIMED") {
    return jsonError("Cannot cancel an already claimed order", 400);
  }

  await db.cancelOrder(id as OrderId, auth.session.userId as CustomerId);

  const response: CustomerCancelOrderRes = {
    statusMessage: "Order cancelled successfully",
  };

  return jsonSuccess(response);
}
