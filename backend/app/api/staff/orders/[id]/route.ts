import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { OrderId, StaffGetOrderRes, StaffOrderDetail } from "@/app/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["STAFF", "ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const order = await db.getOrder(id as OrderId);

  if (!order) {
    return jsonError("Order not found", 404, "Not Found");
  }

  const paidByStaff = order.courierPaidBy ? await db.getStaffById(order.courierPaidBy) : null;
  const courierPaidByName = paidByStaff ? `${paidByStaff.firstName} ${paidByStaff.lastName}` : undefined;

  const orderDetail: StaffOrderDetail = {
    orderId: order.id,
    trackingId: order.trackingId,
    customer: order.recipientName,
    amountToPay: order.price,
    timestamp: order.timestamp,
    status: order.status,
    statusMessage:
      order.status === "AWAITING_PARCEL"
        ? "Awaiting parcel arrival"
        : order.status === "READY_TO_CLAIM"
        ? "Ready for customer pickup"
        : order.status === "PAYMENT_REQUIRED"
        ? "Ready for staff verification"
        : order.status,
    isClaimActive: db.isClaimActive(order),
    claimRemainingSeconds: db.getClaimRemainingSeconds(order),
    courierPaid: order.courierPaid,
    courierPaidBy: order.courierPaidBy,
    courierPaidByName,
    courierPaidAt: order.courierPaidAt,
  };

  const response: StaffGetOrderRes = orderDetail;

  return jsonSuccess(response);
}
