import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { OrderStatus, StaffListOrdersRes, StaffOrderSummary } from "@/app/types/api";

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

  const orders: StaffOrderSummary[] = allOrders.map((o) => ({
    id: o.id,
    trackingId: o.trackingId,
    customer: o.recipientName,
    amountReceived: o.amountReceived ?? o.price,
    change: o.change,
    timestamp: o.timestamp,
    status: o.status,
    statusMessage: o.status === "AWAITING_PARCEL" ? "Awaiting parcel arrival" : o.status,
  }));

  const response: StaffListOrdersRes = {
    orders,
  };

  return jsonSuccess(response);
}
