import { NextRequest } from "next/server";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { sendFcmNotification } from "@/app/lib/v1/fcm";
import { validateImageSize } from "@/app/lib/v1/image";
import { ORDER_NON_IMAGE_COLUMNS } from "@/app/lib/v1/orders";
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

    // 2b. Image Attachment Size Validation (<= STAFF_IMAGE_MAX_KB, default 200KB)
    const sizeCheck = validateImageSize(imageUrl, "STAFF");
    if (!sizeCheck.valid) {
      return jsonError(sizeCheck.error || "Image exceeds size limit", 400, "ImagePayloadTooLarge");
    }

    // ---------------------------------------------------------
    // 3. Business Logic:
    //    a. Fetch order from DB by ID or ticketCode
    //    b. Ensure order status is AWAITING_PARCEL
    //    c. Ensure courier payment is already completed (courierPaid === true)
    //    d. Update proofImageUrl, set status to READY_TO_CLAIM, and append timeline
    // ---------------------------------------------------------
    const order = await db.query.orders.findFirst({
      where: or(eq(orders.id, lookupId), eq(orders.ticketCode, lookupId.toUpperCase())),
      columns: ORDER_NON_IMAGE_COLUMNS,
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
    const timelineEntry: StatusTimelineEntry = {
      status: "READY_TO_CLAIM",
      timestamp: nowIso,
    };

    const [updatedOrder] = await db
      .update(orders)
      .set({
        proofImageUrl: imageUrl,
        status: "READY_TO_CLAIM",
        statusTimeline: sql<StatusTimelineEntry[]>`coalesce(${orders.statusTimeline}, '[]'::jsonb) || ${JSON.stringify([timelineEntry])}::jsonb`,
        modifiedBy: auth.session.userId,
        timestamp: now,
      })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.status, "AWAITING_PARCEL"),
          eq(orders.courierPaid, true)
        )
      )
      .returning({ id: orders.id });

    if (!updatedOrder) {
      return jsonError(
        "Order status changed concurrently or courier payment is missing",
        409,
        "Conflict"
      );
    }

    // Non-fatal FCM push to customer
    sendFcmNotification({
      userId: order.customerId,
      title: "Parcel Ready for Claim",
      body: `Your parcel (${order.trackingId || order.productName || "parcel"}) has arrived at Lily’s Catering Hub and is ready for pickup!`,
      notifId: order.id,
      data: {
        orderId: order.id,
        ticketCode: order.ticketCode,
        status: "READY_TO_CLAIM",
      },
    }).catch(() => {});

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
    console.error("[Staff Attach Photo Error]:", err);
    return jsonError("Internal server error attaching proof photo", 500, "Internal Server Error");
  }
}
