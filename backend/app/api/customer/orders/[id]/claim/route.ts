import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { CustomerClaimOrderRes, OrderId } from "@/app/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["CUSTOMER"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const order = db.getOrder(id as OrderId);

  if (!order) {
    return jsonError("Order not found", 404, "Not Found");
  }

  if (order.customerId !== auth.session.userId) {
    return jsonError("Unauthorized access to claim this order", 403, "Forbidden");
  }

  if (order.status !== "READY_TO_CLAIM") {
    return jsonError(`Order cannot be claimed in its current status (${order.status})`, 400);
  }

  db.claimByCustomer(id as OrderId);

  const response: CustomerClaimOrderRes = {
    statusMessage: "Order claim initiated",
  };

  return jsonSuccess(response);
}
