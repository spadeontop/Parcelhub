import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { CustomerId, CustomerInitOrderReq, CustomerInitOrderRes } from "@/app/types/api";

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request, ["CUSTOMER"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  try {
    const body = (await request.json()) as CustomerInitOrderReq;
    if (!body.imageUrl) {
      return jsonError("imageUrl is required to initialize an order", 400);
    }

    if (body.trackingId) {
      const activeDuplicate = db.getActiveOrderByTrackingId(body.trackingId);
      if (activeDuplicate) {
        return jsonError(
          `Tracking ID "${body.trackingId}" is already registered to an active order (${activeDuplicate.id}). Tracking IDs must be unique across active orders.`,
          409,
          "DuplicateTrackingId"
        );
      }
    }

    const order = db.initializeOrder(auth.session.userId as CustomerId, body.imageUrl, body.trackingId);

    const response: CustomerInitOrderRes = {
      orderId: order.id,
      statusMessage: "Order initialized successfully",
    };

    return jsonSuccess(response, 201);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
