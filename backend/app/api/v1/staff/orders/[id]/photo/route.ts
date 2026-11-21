import { NextRequest } from "next/server";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import {
  fetchOrderPhotos,
  matchOrderByIdOrTicket,
  parsePhotoType,
} from "@/app/lib/v1/orders";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { OrderId, StaffGetOrderPhotoRes } from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateStaffRequest(request, ["STAFF"]);
    if (!auth.session) {
      return jsonError(auth.error || "Unauthorized", auth.status, "Unauthorized");
    }

    const { id } = await params;
    const lookupId = id?.trim();

    if (!lookupId) {
      return jsonError("Order ID or Ticket Code is required", 400);
    }

    const { searchParams } = new URL(request.url);
    const parsedPhotoType = parsePhotoType(searchParams);
    if (!parsedPhotoType.ok) {
      return jsonError(parsedPhotoType.error, 400);
    }

    const photos = await fetchOrderPhotos(
      matchOrderByIdOrTicket(lookupId),
      parsedPhotoType.photoType
    );
    if (!photos) {
      return jsonError("Order not found", 404, "Not Found");
    }

    const response: StaffGetOrderPhotoRes = {
      statusMessage: "Order photo(s) retrieved successfully",
      orderId: photos.orderId as OrderId,
      imageUrl: photos.imageUrl,
      proofImageUrl: photos.proofImageUrl,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Staff Get Order Photo Error]:", err);
    return jsonError("Internal server error fetching order photo(s)", 500, "Internal Server Error");
  }
}
