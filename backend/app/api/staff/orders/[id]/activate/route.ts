import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { OrderId, StaffActivateOrderReq, StaffActivateOrderRes, StaffId } from "@/app/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["STAFF"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const order = await db.getOrder(id as OrderId);

  if (!order) {
    return jsonError("Order not found", 404, "Not Found");
  }

  if (order.status !== "PAYMENT_REQUIRED") {
    return jsonError(`Order cannot be activated in status ${order.status}`, 400);
  }

  try {
    const body = (await request.json()) as StaffActivateOrderReq;
    if (typeof body.amountReceived !== "number" || body.amountReceived < order.price) {
      return jsonError(`amountReceived must be at least the order price of ${order.price}`, 400);
    }

    const activated = await db.activateOrder(
      id as OrderId,
      body.amountReceived,
      auth.session.userId as StaffId
    );

    if (!activated) {
      return jsonError("Failed to activate order", 500);
    }

    const response: StaffActivateOrderRes = {
      statusMessage: "Order activated and awaiting parcel delivery",
      change: activated.change,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
