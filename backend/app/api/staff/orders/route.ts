import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import {
  OrderId,
  OrderStatus,
  StaffListOrdersRes,
  StaffOrderSummary,
} from "@/app/types/api";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request, ["STAFF", "ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") as OrderStatus | null;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  let allOrders = db.listOrders();

  if (statusFilter) {
    allOrders = allOrders.filter((o) => o.status === statusFilter);
  }

  if (limit && !isNaN(limit)) {
    allOrders = allOrders.slice(0, limit);
  }

  const orders: StaffOrderSummary[] = allOrders.map((o) => {
    const paidByStaff = o.courierPaidBy ? db.getStaffById(o.courierPaidBy) : null;
    const courierPaidByName = paidByStaff ? `${paidByStaff.firstName} ${paidByStaff.lastName}` : undefined;

    return {
      id: o.id,
      trackingId: o.trackingId,
      customer: o.recipientName,
      amountReceived: o.amountReceived || 0,
      change: o.change || 0,
      timestamp: o.timestamp,
      status: o.status,
      statusMessage:
        o.status === "AWAITING_PARCEL"
          ? "Awaiting parcel arrival"
          : o.status === "READY_TO_CLAIM"
          ? "Ready for customer pickup"
          : o.status === "PAYMENT_REQUIRED"
          ? "Awaiting customer cash deposit"
          : o.status,
      isClaimActive: db.isClaimActive(o),
      claimRemainingSeconds: db.getClaimRemainingSeconds(o),
      courierPaid: o.courierPaid,
      courierPaidBy: o.courierPaidBy,
      courierPaidByName,
      courierPaidAt: o.courierPaidAt,
    };
  });

  const response: StaffListOrdersRes = {
    orders,
  };

  return jsonSuccess(response);
}
