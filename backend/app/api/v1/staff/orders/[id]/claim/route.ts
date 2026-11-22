import { NextRequest } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { sendFcmNotification } from "@/app/lib/v1/fcm";
import { publishOrderSignal } from "@/app/lib/v1/realtime";
import {
  appendStatusTimelineSql,
  matchOrderByIdOrTicket,
  ORDER_NON_IMAGE_COLUMNS,
} from "@/app/lib/v1/orders";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { StaffClaimOrderRes } from "@/app/types/v1/api";

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

    const order = await db.query.orders.findFirst({
      where: matchOrderByIdOrTicket(lookupId),
      columns: ORDER_NON_IMAGE_COLUMNS,
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    if (order.status !== "READY_TO_CLAIM") {
      return jsonError(
        `Cannot claim order in current status (${order.status}). Order must be READY_TO_CLAIM.`,
        400
      );
    }

    if (!order.claimRequested || !order.claimInitiatedAt) {
      return jsonError(
        "Cannot release order: Customer has not initiated the claim pass on their device.",
        403,
        "ClaimNotInitiated"
      );
    }

    const now = new Date();
    const isExpired =
      !order.claimExpiresAt || new Date(order.claimExpiresAt).getTime() < now.getTime();

    if (isExpired) {
      return jsonError(
        "Cannot release order: The customer claim window has expired. Customer must re-initiate the claim pass.",
        403,
        "ClaimWindowExpired"
      );
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "CLAIMED",
        claimRequested: false,
        statusTimeline: appendStatusTimelineSql("CLAIMED", now.toISOString()),
        modifiedBy: auth.session.userId,
        timestamp: now,
      })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.status, "READY_TO_CLAIM"),
          eq(orders.claimRequested, true),
          gte(orders.claimExpiresAt, now)
        )
      )
      .returning({ id: orders.id });

    if (!updatedOrder) {
      return jsonError(
        "Order has already been claimed or its claim window changed concurrently",
        409,
        "Conflict"
      );
    }

    sendFcmNotification({
      userId: order.customerId,
      title: "Parcel Claimed",
      body: `Parcel (${order.trackingId || order.productName || "order"}) was successfully claimed. Thank you for using ParcelHub!`,
      notifId: order.id,
      data: {
        orderId: order.id,
        ticketCode: order.ticketCode,
        status: "CLAIMED",
      },
    }).catch(() => {});

    publishOrderSignal(["staff:orders", `customer:${order.customerId}`], {
      event: "ORDER_CLAIMED",
      orderId: order.id,
      ticketCode: order.ticketCode ?? null,
      status: "CLAIMED",
      updatedAt: now.toISOString(),
    });

    const response: StaffClaimOrderRes = {
      statusMessage: "Order successfully claimed",
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Staff Claim Order Error]:", err);
    return jsonError("Internal server error claiming order", 500, "Internal Server Error");
  }
}
