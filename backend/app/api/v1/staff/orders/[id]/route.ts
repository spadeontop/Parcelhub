import { NextRequest } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, staff } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  OrderId,
  OrderStatus,
  StaffGetOrderRes,
  StaffId,
  StaffOrderDetail,
} from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getStatusMessage(status: OrderStatus): string {
  switch (status) {
    case "AWAITING_PARCEL":
      return "Awaiting parcel arrival";
    case "READY_TO_CLAIM":
      return "Ready for customer pickup";
    case "PAYMENT_REQUIRED":
      return "Ready for staff verification";
    case "PENDING_INITIALIZATION":
      return "Pending initialization";
    case "CLAIMED":
      return "Parcel claimed";
    case "CANCELLED":
      return "Order cancelled";
    default:
      return status;
  }
}

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
    //    Extract and validate route parameter {id}
    // ---------------------------------------------------------
    const { id } = await params;
    const lookupId = id?.trim();

    if (!lookupId) {
      return jsonError("Order ID or Ticket Code is required", 400);
    }

    // ---------------------------------------------------------
    // 3. Business Logic:
    //    a. Find order by primary ID or human-facing ticketCode
    //    b. If courierPaidBy exists, fetch the staff member's name
    //    c. Compute live isClaimActive and claimRemainingSeconds
    // ---------------------------------------------------------
    const order = await db.query.orders.findFirst({
      where: or(eq(orders.id, lookupId), eq(orders.ticketCode, lookupId)),
      columns: {
        imageUrl: false,
        proofImageUrl: false,
      },
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    let courierPaidByName: string | undefined = undefined;
    if (order.courierPaidBy) {
      const payingStaff = await db.query.staff.findFirst({
        where: eq(staff.id, order.courierPaidBy),
      });
      if (payingStaff) {
        courierPaidByName = `${payingStaff.firstName} ${payingStaff.lastName}`;
      }
    }

    const nowMs = Date.now();
    let isClaimActive = false;
    let claimRemainingSeconds = 0;

    if (order.claimRequested && order.claimExpiresAt) {
      const expiresMs = new Date(order.claimExpiresAt).getTime();
      const diffSec = Math.floor((expiresMs - nowMs) / 1000);
      if (diffSec > 0) {
        isClaimActive = true;
        claimRemainingSeconds = diffSec;
      }
    }

    const orderDetail: StaffOrderDetail = {
      orderId: order.id as OrderId,
      ticketCode: order.ticketCode,
      trackingId: order.trackingId,
      customer: order.recipientName,
      amountToPay: order.price,
      amountReceived: order.amountReceived ?? null,
      change: order.change ?? 0,
      timestamp: order.timestamp.toISOString(),
      status: order.status,
      statusMessage: getStatusMessage(order.status),
      isClaimActive,
      claimRemainingSeconds,
      courierPaid: order.courierPaid,
      courierPaidBy: (order.courierPaidBy as StaffId) || null,
      courierPaidByName,
      courierPaidAt: order.courierPaidAt ? order.courierPaidAt.toISOString() : null,
      createdAt: order.statusTimeline?.[0]?.timestamp || order.timestamp.toISOString(),
      statusTimeline: order.statusTimeline,
    };

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK conforming to StaffGetOrderRes
    // ---------------------------------------------------------
    const response: StaffGetOrderRes = orderDetail;
    return jsonSuccess(response);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal server error fetching order detail";
    return jsonError(errorMsg, 500);
  }
}
