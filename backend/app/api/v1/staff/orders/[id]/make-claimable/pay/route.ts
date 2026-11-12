import { NextRequest } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, staff } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { StaffPayCourierRes } from "@/app/types/v1/api";

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
    //    b. Ensure order status is AWAITING_PARCEL
    //    c. Ensure courier payment has not already been recorded
    //    d. Update courierPaid = true, courierPaidBy, and courierPaidAt
    // ---------------------------------------------------------
    const order = await db.query.orders.findFirst({
      where: or(eq(orders.id, lookupId), eq(orders.ticketCode, lookupId)),
    });

    if (!order) {
      return jsonError("Order not found", 404, "Not Found");
    }

    if (order.status !== "AWAITING_PARCEL") {
      return jsonError(
        `Cannot pay courier for order in ${order.status} status. Order must be AWAITING_PARCEL.`,
        400
      );
    }

    if (order.courierPaid) {
      let staffName = order.courierPaidBy || "staff";
      if (order.courierPaidBy) {
        const payingStaff = await db.query.staff.findFirst({
          where: eq(staff.id, order.courierPaidBy),
        });
        if (payingStaff) {
          staffName = `${payingStaff.firstName} ${payingStaff.lastName}`;
        }
      }

      return jsonError(
        `Courier payment is already recorded for this order (Paid by ${staffName})`,
        400,
        "CourierAlreadyPaid"
      );
    }

    const now = new Date();

    await db
      .update(orders)
      .set({
        courierPaid: true,
        courierPaidBy: auth.session.userId,
        courierPaidAt: now,
        modifiedBy: auth.session.userId,
        timestamp: now,
      })
      .where(eq(orders.id, order.id));

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK conforming to StaffPayCourierRes
    // ---------------------------------------------------------
    const response: StaffPayCourierRes = {
      statusMessage: "Courier payment recorded",
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal server error recording courier payment";
    return jsonError(errorMsg, 500);
  }
}
