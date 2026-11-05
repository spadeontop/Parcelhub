import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { OrderId, StaffGetOrderRes } from "@/app/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["STAFF", "ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const order = db.getOrder(id as OrderId);

  if (!order) {
    return jsonError("Order not found", 404, "Not Found");
  }

  const response: StaffGetOrderRes = {
    orderId: order.id,
    trackingId: order.trackingId,
    customer: order.recipientName,
    amountToPay: order.price,
    timestamp: order.timestamp,
    status: order.status,
    statusMessage:
      order.status === "PAYMENT_REQUIRED"
        ? "Ready for staff verification"
        : order.status,
  };

  return jsonSuccess(response);
}
