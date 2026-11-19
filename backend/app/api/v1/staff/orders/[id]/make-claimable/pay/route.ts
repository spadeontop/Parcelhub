import { NextRequest } from "next/server";
import { and, eq, or } from "drizzle-orm";
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
    //    a. Fetch order metadata + paying staff name in a single LEFT JOIN query
    //    b. Ensure order status is AWAITING_PARCEL
    //    c. Ensure courier payment has not already been recorded
    //    d. Update courierPaid = true, courierPaidBy, and courierPaidAt
    // ---------------------------------------------------------
    const [order] = await db
      .select({
        id: orders.id,
        status: orders.status,
        courierPaid: orders.courierPaid,
        courierPaidBy: orders.courierPaidBy,
        courierPaidByFirstName: staff.firstName,
        courierPaidByLastName: staff.lastName,
      })
      .from(orders)
      .leftJoin(staff, eq(orders.courierPaidBy, staff.id))
      .where(or(eq(orders.id, lookupId), eq(orders.ticketCode, lookupId)))
      .limit(1);

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
      const joinedName =
        order.courierPaidByFirstName || order.courierPaidByLastName
          ? `${order.courierPaidByFirstName ?? ""} ${order.courierPaidByLastName ?? ""}`.trim()
          : null;
      const staffName = joinedName || order.courierPaidBy || "staff";

      return jsonError(
        `Courier payment is already recorded for this order (Paid by ${staffName})`,
        400,
        "CourierAlreadyPaid"
      );
    }

    const now = new Date();

    const [updatedOrder] = await db
      .update(orders)
      .set({
        courierPaid: true,
        courierPaidBy: auth.session.userId,
        courierPaidAt: now,
        modifiedBy: auth.session.userId,
        timestamp: now,
      })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.status, "AWAITING_PARCEL"),
          eq(orders.courierPaid, false)
        )
      )
      .returning({ id: orders.id });

    if (!updatedOrder) {
      return jsonError(
        "Courier payment was already recorded or order status changed concurrently",
        409,
        "Conflict"
      );
    }

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
