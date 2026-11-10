import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { AdminGetOrderAuditRes, AdminOrderDetailAudit, OrderId } from "@/app/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const order = await db.getOrder(id as OrderId);

  if (!order) {
    return jsonError("Order not found", 404, "Not Found");
  }

  const orderVersions: AdminOrderDetailAudit = {
    id: order.id,
    trackingId: order.trackingId,
    productName: order.productName,
    recipientName: order.recipientName,
    price: order.price,
    change: order.change,
    statusTimeline: order.statusTimeline,
    modifiedBy: order.modifiedBy,
    timestamp: order.timestamp,
  };

  const response: AdminGetOrderAuditRes = {
    statusMessage: "Order audit retrieved",
    orderVersions,
  };

  return jsonSuccess(response);
}
