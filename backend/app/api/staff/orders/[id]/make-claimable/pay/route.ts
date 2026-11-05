import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { OrderId, StaffId, StaffPayCourierRes } from "@/app/types/api";

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

  if (order.status !== "AWAITING_PARCEL") {
    return jsonError(`Cannot pay courier for order in ${order.status} status`, 400);
  }

  if (order.courierPaid) {
    const paidByStaff = order.courierPaidBy ? db.getStaffById(order.courierPaidBy) : null;
    const staffName = paidByStaff ? `${paidByStaff.firstName} ${paidByStaff.lastName}` : (order.courierPaidBy || "staff");
    return jsonError(
      `Courier payment is already recorded for this order (Paid by ${staffName})`,
      400,
      "CourierAlreadyPaid"
    );
  }

  db.recordCourierPayment(id as OrderId, auth.session.userId as StaffId);

  const response: StaffPayCourierRes = {
    statusMessage: "Courier payment recorded",
  };

  return jsonSuccess(response);
}
