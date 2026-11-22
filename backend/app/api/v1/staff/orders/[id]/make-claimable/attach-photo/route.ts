import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { sendFcmNotification } from "@/app/lib/v1/fcm";
import { publishOrderSignal } from "@/app/lib/v1/realtime";
import { validateImageSize } from "@/app/lib/v1/image";
import {
  appendStatusTimelineSql,
  matchOrderByIdOrTicket,
  ORDER_NON_IMAGE_COLUMNS,
} from "@/app/lib/v1/orders";
import { parseJsonBody } from "@/app/lib/v1/request";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  StaffAttachPhotoReq,
  StaffAttachPhotoRes,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const parsedBody = await parseJsonBody<StaffAttachPhotoReq>(
      request,
      "Invalid JSON request body"
    );
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const imageUrl = parsedBody.data.imageUrl?.trim();
    if (!imageUrl) {
      return jsonError("imageUrl is required", 400);
    }

    const sizeCheck = validateImageSize(imageUrl, "STAFF");
    if (!sizeCheck.valid) {
      return jsonError(sizeCheck.error || "Image exceeds size limit", 400, "ImagePayloadTooLarge");
    }

    const order = await db.query.orders.findFirst({
      where: matchOrderByIdOrTicket(lookupId),
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
    const [updatedOrder] = await db
      .update(orders)
      .set({
        proofImageUrl: imageUrl,
        status: "READY_TO_CLAIM",
        statusTimeline: appendStatusTimelineSql("READY_TO_CLAIM", now.toISOString()),
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

    publishOrderSignal(["staff:orders", `customer:${order.customerId}`], {
      event: "ORDER_READY",
      orderId: order.id,
      ticketCode: order.ticketCode ?? null,
      status: "READY_TO_CLAIM",
      updatedAt: now.toISOString(),
    });

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
