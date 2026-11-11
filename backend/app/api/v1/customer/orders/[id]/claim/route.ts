import { NextRequest } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateV1Request } from "@/app/lib/v1/jwt";
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
    //    Require valid 15-minute authToken, strictly CUSTOMER role
    // ---------------------------------------------------------
    const auth = await authenticateV1Request(request, ["CUSTOMER"]);
    if (!auth.session) {
      if (auth.status === 403) {
        return jsonError("Access denied", 403, "Forbidden");
      }
      return jsonError("Please log in again", 401, "Unauthorized");
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
        or(eq(orders.id, identifier), eq(orders.ticketCode, identifier.toUpperCase())),
        eq(orders.customerId, auth.session.userId)
      ),
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
      .where(eq(orders.id, order.id))
      .returning();

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

