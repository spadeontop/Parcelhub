import { NextRequest } from "next/server";
import { and, eq, gte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { sendFcmNotification } from "@/app/lib/v1/fcm";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { StaffClaimOrderRes, StatusTimelineEntry } from "@/app/types/v1/api";

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
    //    Extract route parameter {id}
    // ---------------------------------------------------------
    const { id } = await params;
    const lookupId = id?.trim();

    if (!lookupId) {
      return jsonError("Order ID or Ticket Code is required", 400);
    }

    // ---------------------------------------------------------
    // 3. Business Logic:
    //    a. Fetch order from DB by ID or ticketCode
    //    b. Ensure order status is READY_TO_CLAIM
    //    c. Guard: Customer must have initiated claim pass
    //    d. Guard: Claim pass must not be expired
    //    e. Update order to CLAIMED and append to statusTimeline
    // ---------------------------------------------------------
    const order = await db.query.orders.findFirst({
      where: or(eq(orders.id, lookupId), eq(orders.ticketCode, lookupId)),
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

    // Guard: User must initiate claim first on their device
    if (!order.claimRequested || !order.claimInitiatedAt) {
      return jsonError(
        "Cannot release order: Customer has not initiated the claim pass on their device.",
        403,
        "ClaimNotInitiated"
      );
    }

    // Guard: Must be within active claim window
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

    const nowIso = now.toISOString();
    const timelineEntry: StatusTimelineEntry = {
      status: "CLAIMED",
      timestamp: nowIso,
    };

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "CLAIMED",
        claimRequested: false,
        statusTimeline: sql<StatusTimelineEntry[]>`coalesce(${orders.statusTimeline}, '[]'::jsonb) || ${JSON.stringify([timelineEntry])}::jsonb`,
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

    // Non-fatal FCM push to customer
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

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK conforming to StaffClaimOrderRes
    // ---------------------------------------------------------
    const response: StaffClaimOrderRes = {
      statusMessage: "Order successfully claimed",
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal server error claiming order";
    return jsonError(errorMsg, 500);
  }
}
