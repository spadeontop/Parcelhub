import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { CustomerListOrdersRes, CustomerOrderSummary, OrderStatus } from "@/app/types/api";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request, ["CUSTOMER", "ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get("type") as OrderStatus | null;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  let allOrders = db.listOrders();

  // Filter by customer if customer role
  if (auth.session.role === "CUSTOMER") {
    allOrders = allOrders.filter((o) => o.customerId === auth.session!.userId);
  }

  if (typeFilter) {
    allOrders = allOrders.filter((o) => o.status === typeFilter);
  }

  if (limit && !isNaN(limit)) {
    allOrders = allOrders.slice(0, limit);
  }

  const orders: CustomerOrderSummary[] = allOrders.map((o) => ({
    id: o.id,
    trackingId: o.trackingId,
    productName: o.productName,
    status: o.status,
    timestamp: o.timestamp,
  }));

  const response: CustomerListOrdersRes = {
    statusMessage: "Orders retrieved",
    orders,
  };

  return jsonSuccess(response);
}
