import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateCustomerRequest, customerAuthErrorResponse } from "@/app/lib/v1/auth";
import { matchOrderByIdOrTicket } from "@/app/lib/v1/orders";
import { publishOrderSignal } from "@/app/lib/v1/realtime";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { CustomerClaimOrderRes } from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getClaimTimerMinutes(): number {
  const envVal = process.env.CLIENT_RETRIEVE_TIMER;
  if (!envVal) return 5;
  const parsed = parseInt(envVal, 10);
  return isNaN(parsed) || parsed <= 0 ? 5 : parsed;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation:
    //    Require valid 15-minute authToken, strictly CUSTOMER role & valid DB user
    // ---------------------------------------------------------
    const auth = await authenticateCustomerRequest(request);
    if (!auth.session) {
      return customerAuthErrorResponse(auth);
    }

    // ---------------------------------------------------------
    // 2. Request Validation:
    //    Resolve and validate id param
    // ---------------------------------------------------------
    const { id: rawId } = await params;
    const identifier = rawId?.trim();

    if (!identifier) {
      return jsonError("Order identifier is required", 400);
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Fetch order by UUID or ticketCode matching customerId
    //    b. Ensure order status is READY_TO_CLAIM
    //    c. Calculate expiration time (initiatedAt + durationMinutes)
    //    d. Update database record with claim timestamps
    // ---------------------------------------------------------
    const order = await db.query.orders.findFirst({
      where: and(
        matchOrderByIdOrTicket(identifier),
        eq(orders.customerId, auth.session.userId)
      ),
      columns: {
        id: true,
        ticketCode: true,
        status: true,
      },
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    if (order.status !== "READY_TO_CLAIM") {
      return jsonError("Parcel is not ready for pickup", 400);
    }

    const durationMinutes = getClaimTimerMinutes();
    const initiatedAt = new Date();
    const expiresAt = new Date(initiatedAt.getTime() + durationMinutes * 60 * 1000);

    const [updatedOrder] = await db
      .update(orders)
      .set({
        claimRequested: true,
        claimInitiatedAt: initiatedAt,
        claimExpiresAt: expiresAt,
        timestamp: initiatedAt,
      })
      .where(and(eq(orders.id, order.id), eq(orders.status, "READY_TO_CLAIM")))
      .returning({
        claimInitiatedAt: orders.claimInitiatedAt,
        claimExpiresAt: orders.claimExpiresAt,
      });

    if (!updatedOrder) {
      return jsonError("Parcel is no longer ready for pickup", 409, "Conflict");
    }

    publishOrderSignal(["staff:orders", `customer:${auth.session.userId}`], {
      event: "CLAIM_INITIATED",
      orderId: order.id,
      ticketCode: order.ticketCode ?? null,
      status: "READY_TO_CLAIM",
      updatedAt: initiatedAt.toISOString(),
    });

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK with claim duration & timestamps
    // ---------------------------------------------------------
    const response: CustomerClaimOrderRes = {
      statusMessage: "Order claim initiated",
      claimInitiatedAt: (updatedOrder.claimInitiatedAt ?? initiatedAt).toISOString(),
      claimExpiresAt: (updatedOrder.claimExpiresAt ?? expiresAt).toISOString(),
      durationMinutes,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to initiate claim. Please try again.", 500);
  }
}

