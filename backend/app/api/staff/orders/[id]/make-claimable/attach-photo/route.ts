import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { OrderId, StaffAttachPhotoReq, StaffAttachPhotoRes, StaffId } from "@/app/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["STAFF"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const order = db.getOrder(id as OrderId);

  if (!order) {
    return jsonError("Order not found", 404, "Not Found");
  }

  try {
    const body = (await request.json()) as StaffAttachPhotoReq;
    if (!body.imageUrl) {
      return jsonError("imageUrl is required", 400);
    }

    const updated = db.attachProofPhoto(id as OrderId, body.imageUrl, auth.session.userId as StaffId);
    if (!updated) {
      return jsonError("Failed to update order with photo", 500);
    }

    const response: StaffAttachPhotoRes = {
      statusMessage: "Proof photo attached. Order is now claimable.",
      imageUrl: body.imageUrl,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
