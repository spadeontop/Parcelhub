import { NextRequest } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  StaffAttachPhotoReq,
  StaffAttachPhotoRes,
  StatusTimelineEntry,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    //    Extract route parameter {id} and body {imageUrl}
    // ---------------------------------------------------------
    const { id } = await params;
    const lookupId = id?.trim();

    if (!lookupId) {
      return jsonError("Order ID or Ticket Code is required", 400);
    }

    let body: StaffAttachPhotoReq;
    try {
      body = (await request.json()) as StaffAttachPhotoReq;
    } catch {
      return jsonError("Invalid JSON request body", 400);
    }

    const imageUrl = body.imageUrl?.trim();
    if (!imageUrl) {
      return jsonError("imageUrl is required", 400);
    }

    // ---------------------------------------------------------
    // 3. Business Logic:
    //    a. Fetch order from DB by ID or ticketCode
    //    b. Ensure order status is AWAITING_PARCEL
    //    c. Ensure courier payment is already completed (courierPaid === true)
    //    d. Update proofImageUrl, set status to READY_TO_CLAIM, and append timeline
    // ---------------------------------------------------------
    const order = await db.query.orders.findFirst({
      where: or(eq(orders.id, lookupId), eq(orders.ticketCode, lookupId)),
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    if (order.status !== "AWAITING_PARCEL") {
      return jsonError(
        `Cannot attach parcel photo for order in ${order.status} status. Order must be AWAITING_PARCEL.`,
        400
      );
    }

    if (!order.courierPaid) {
      return jsonError(
        "Cannot attach photo or release order before courier payment is completed",
        400,
        "CourierPaymentRequired"
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const currentTimeline = (order.statusTimeline || []) as StatusTimelineEntry[];
    const updatedTimeline: StatusTimelineEntry[] = [
      ...currentTimeline,
      {
        status: "READY_TO_CLAIM",
        timestamp: nowIso,
      },
    ];

    await db
      .update(orders)
      .set({
        proofImageUrl: imageUrl,
        status: "READY_TO_CLAIM",
        statusTimeline: updatedTimeline,
        modifiedBy: auth.session.userId,
        timestamp: now,
      })
      .where(eq(orders.id, order.id));

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK conforming to StaffAttachPhotoRes
    // ---------------------------------------------------------
    const response: StaffAttachPhotoRes = {
      statusMessage: "Proof photo attached. Order is now claimable.",
      imageUrl,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal server error attaching proof photo";
    return jsonError(errorMsg, 500);
  }
}
