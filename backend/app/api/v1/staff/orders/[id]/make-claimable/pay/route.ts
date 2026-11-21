import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, staff } from "@/db/schema";
import { authenticateStaffRequest } from "@/app/lib/v1/auth";
import { formatStaffFullName, matchOrderByIdOrTicket } from "@/app/lib/v1/orders";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { StaffPayCourierRes } from "@/app/types/v1/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateStaffRequest(request, ["STAFF"]);
    if (!auth.session) {
      return jsonError(auth.error || "Unauthorized", auth.status, "Unauthorized");
    }

    const { id } = await params;
    const lookupId = id?.trim();

    if (!lookupId) {
      return jsonError("Order ID or Ticket Code is required", 400);
    }

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
      .where(matchOrderByIdOrTicket(lookupId))
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
      const staffName =
        formatStaffFullName(order.courierPaidByFirstName, order.courierPaidByLastName) ||
        order.courierPaidBy ||
        "staff";

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

    const response: StaffPayCourierRes = {
      statusMessage: "Courier payment recorded",
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Staff Pay Courier Error]:", err);
    return jsonError("Internal server error recording courier payment", 500, "Internal Server Error");
  }
}
