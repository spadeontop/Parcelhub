import { NextRequest } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateCustomerRequest } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerGetOrderPhotoRes,
  OrderId,
  OrderPhotoType,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_PHOTO_TYPES: readonly OrderPhotoType[] = [
  "screenshot",
  "proof",
  "all",
] as const;

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
    //    Extract {id} and optional ?type query parameter
    // ---------------------------------------------------------
    const { id: rawId } = await params;
    const identifier = rawId?.trim();

    if (!identifier) {
      return jsonError("Order identifier is required", 400);
    }

    const { searchParams } = new URL(request.url);
    const rawType = searchParams.get("type");
    let photoType: OrderPhotoType = "all";

    if (rawType) {
      if (!VALID_PHOTO_TYPES.includes(rawType as OrderPhotoType)) {
        return jsonError(
          `Invalid photo type filter. Allowed values: ${VALID_PHOTO_TYPES.join(", ")}`,
          400
        );
      }
      photoType = rawType as OrderPhotoType;
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    Query order ownership (must belong to auth customer) and
    //    select ONLY the requested image column(s) from the database.
    // ---------------------------------------------------------
    const columnsConfig = {
      id: true,
      imageUrl: photoType === "screenshot" || photoType === "all",
      proofImageUrl: photoType === "proof" || photoType === "all",
    };

    const order = await db.query.orders.findFirst({
      where: and(
        or(eq(orders.id, identifier), eq(orders.ticketCode, identifier.toUpperCase())),
        eq(orders.customerId, auth.session.userId)
      ),
      columns: columnsConfig,
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    // ---------------------------------------------------------
    // 4. Response:
    //    Return photo payload conforming to CustomerGetOrderPhotoRes
    // ---------------------------------------------------------
    const response: CustomerGetOrderPhotoRes = {
      statusMessage: "Order photo(s) retrieved successfully",
      orderId: order.id as OrderId,
      imageUrl: "imageUrl" in order ? (order.imageUrl ?? null) : null,
      proofImageUrl: "proofImageUrl" in order ? (order.proofImageUrl ?? null) : null,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to retrieve order photos. Please try again.", 500);
  }
}
