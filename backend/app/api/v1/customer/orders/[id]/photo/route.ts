import { NextRequest } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderScreenshots } from "@/db/schema";
import { authenticateCustomerRequest, customerAuthErrorResponse } from "@/app/lib/v1/auth";
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
      return customerAuthErrorResponse(auth);
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
    //    Screenshots live exclusively in order_screenshots.image_url.
    // ---------------------------------------------------------
    const whereClause = and(
      or(eq(orders.id, identifier), eq(orders.ticketCode, identifier.toUpperCase())),
      eq(orders.customerId, auth.session.userId)
    );

    let orderId: string;
    let imageUrl: string | null = null;
    let proofImageUrl: string | null = null;

    if (photoType === "proof") {
      const order = await db.query.orders.findFirst({
        where: whereClause,
        columns: {
          id: true,
          proofImageUrl: true,
        },
      });
      if (!order) {
        return jsonError("Order not found", 404, "Not Found");
      }
      orderId = order.id;
      proofImageUrl = order.proofImageUrl ?? null;
    } else if (photoType === "screenshot") {
      const [order] = await db
        .select({
          id: orders.id,
          imageUrl: orderScreenshots.imageUrl,
        })
        .from(orders)
        .leftJoin(orderScreenshots, eq(orderScreenshots.orderId, orders.id))
        .where(whereClause)
        .limit(1);

      if (!order) {
        return jsonError("Order not found", 404, "Not Found");
      }
      orderId = order.id;
      imageUrl = order.imageUrl ?? null;
    } else {
      const [order] = await db
        .select({
          id: orders.id,
          imageUrl: orderScreenshots.imageUrl,
          proofImageUrl: orders.proofImageUrl,
        })
        .from(orders)
        .leftJoin(orderScreenshots, eq(orderScreenshots.orderId, orders.id))
        .where(whereClause)
        .limit(1);

      if (!order) {
        return jsonError("Order not found", 404, "Not Found");
      }
      orderId = order.id;
      imageUrl = order.imageUrl ?? null;
      proofImageUrl = order.proofImageUrl ?? null;
    }

    // ---------------------------------------------------------
    // 4. Response:
    //    Return photo payload conforming to CustomerGetOrderPhotoRes
    // ---------------------------------------------------------
    const response: CustomerGetOrderPhotoRes = {
      statusMessage: "Order photo(s) retrieved successfully",
      orderId: orderId as OrderId,
      imageUrl,
      proofImageUrl,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to retrieve order photos. Please try again.", 500);
  }
}

