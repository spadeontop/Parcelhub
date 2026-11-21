import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { authenticateCustomerRequest, customerAuthErrorResponse } from "@/app/lib/v1/auth";
import {
  fetchOrderPhotos,
  matchOrderByIdOrTicket,
  parsePhotoType,
} from "@/app/lib/v1/orders";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { CustomerGetOrderPhotoRes, OrderId } from "@/app/types/v1/api";

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

    const { searchParams } = new URL(request.url);
    const parsedPhotoType = parsePhotoType(searchParams);
    if (!parsedPhotoType.ok) {
      return jsonError(parsedPhotoType.error, 400);
    }

    const whereClause = and(
      matchOrderByIdOrTicket(identifier),
      eq(orders.customerId, auth.session.userId)
    );

    const photos = await fetchOrderPhotos(whereClause, parsedPhotoType.photoType);
    if (!photos) {
      return jsonError("Order not found", 404, "Not Found");
    }

    const response: CustomerGetOrderPhotoRes = {
      statusMessage: "Order photo(s) retrieved successfully",
      orderId: photos.orderId as OrderId,
      imageUrl: photos.imageUrl,
      proofImageUrl: photos.proofImageUrl,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to retrieve order photos. Please try again.", 500);
  }
}
