import { NextRequest } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  OrderId,
  OrderPhotoType,
  StaffGetOrderPhotoRes,
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
    //    Ensure Bearer token is present, valid HS256 JWT, and role is strictly STAFF
    // ---------------------------------------------------------
    const auth = await authenticateStaffRequest(request, ["STAFF"]);
    if (!auth.session) {
      return jsonError(auth.error || "Unauthorized", auth.status, "Unauthorized");
    }

    // ---------------------------------------------------------
    // 2. Request Validation:
    //    Extract {id} and optional ?type query parameter
    // ---------------------------------------------------------
    const { id } = await params;
    const lookupId = id?.trim();

    if (!lookupId) {
      return jsonError("Order ID or Ticket Code is required", 400);
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
    //    Lookup order by UUID or ticketCode and select ONLY
    //    the requested photo column(s) from the database.
    // ---------------------------------------------------------
    const columnsConfig = {
      id: true,
      imageUrl: photoType === "screenshot" || photoType === "all",
      proofImageUrl: photoType === "proof" || photoType === "all",
    };

    const order = await db.query.orders.findFirst({
      where: or(eq(orders.id, lookupId), eq(orders.ticketCode, lookupId)),
      columns: columnsConfig,
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK conforming to StaffGetOrderPhotoRes
    // ---------------------------------------------------------
    const response: StaffGetOrderPhotoRes = {
      statusMessage: "Order photo(s) retrieved successfully",
      orderId: order.id as OrderId,
      imageUrl: "imageUrl" in order ? (order.imageUrl ?? null) : null,
      proofImageUrl: "proofImageUrl" in order ? (order.proofImageUrl ?? null) : null,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal server error fetching order photo(s)";
    return jsonError(errorMsg, 500);
  }
}
