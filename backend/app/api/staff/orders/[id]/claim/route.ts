import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db, getClientRetrieveTimerMinutes } from "@/app/lib/store";
import { OrderId, StaffClaimOrderRes, StaffId } from "@/app/types/api";

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

  if (order.status !== "READY_TO_CLAIM") {
    return jsonError(`Cannot claim order in current status (${order.status})`, 400);
  }

  // Guard: User must initiate claim first
  if (!order.claimRequested || !order.claimInitiatedAt) {
    return jsonError(
      "Cannot release order: Customer has not initiated the claim pass on their device.",
      403,
      "ClaimNotInitiated"
    );
  }

  // Guard: Must be within CLIENT_RETRIEVE_TIMER minutes window
  if (!db.isClaimActive(order)) {
    const timerMins = getClientRetrieveTimerMinutes();
    return jsonError(
      `Cannot release order: The ${timerMins}-minute customer claim window has expired. Customer must re-initiate the claim pass.`,
      403,
      "ClaimWindowExpired"
    );
  }

  db.claimByStaff(id as OrderId, auth.session.userId as StaffId);

  const response: StaffClaimOrderRes = {
    statusMessage: "Order successfully claimed",
  };

  return jsonSuccess(response);
}
