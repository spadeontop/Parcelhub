import { NextRequest } from "next/server";
import { and, eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { authenticateCustomerRequest, checkCustomerBlacklisted } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerInitOrderReq,
  CustomerInitOrderRes,
  OrderId,
  OrderStatus,
  StatusTimelineEntry,
} from "@/app/types/v1/api";

function generateTicketCode(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let firstPart = "";
  let secondPart = "";
  for (let i = 0; i < 3; i++) {
    firstPart += chars.charAt(Math.floor(Math.random() * chars.length));
    secondPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${firstPart}-${secondPart}`;
}

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation:
    //    Require valid 15-minute authToken, strictly CUSTOMER role & valid DB user
    // ---------------------------------------------------------
    const auth = await authenticateCustomerRequest(request);
    if (!auth.session) {
      if (auth.status === 403) {
        return jsonError("Access denied", 403, "Forbidden");
      }
      if (auth.status === 404) {
        return jsonError("Account not found", 404, "Not Found");
      }
      return jsonError("Please log in again", 401, "Unauthorized");
    }

    // 1b. Blacklist Check (strictly enforced when initializing new orders)
    const blacklistCheck = await checkCustomerBlacklisted(auth.session.userId);
    if (blacklistCheck.isBlacklisted) {
      return jsonError(
        `Account suspended: ${blacklistCheck.reason || "Please contact support"}`,
        403,
        "Forbidden"
      );
    }

    // ---------------------------------------------------------
    // 2. Request Validation:
    //    Parse JSON body, require both imageUrl and trackingId
    // ---------------------------------------------------------
    const body = (await request.json()) as CustomerInitOrderReq;

    const imageUrl = body.imageUrl?.trim();
    const trackingId = body.trackingId?.trim();

    if (!imageUrl || !trackingId) {
      return jsonError("Image and tracking number are required", 400);
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Check if trackingId is already registered to an active order
    //    b. Generate uppercase + digits ticketCode (e.g. 4B2-9X7)
    //    c. Insert new order record in PENDING_INITIALIZATION
    // ---------------------------------------------------------
    const activeDuplicate = await db.query.orders.findFirst({
      where: and(
        eq(orders.trackingId, trackingId),
        notInArray(orders.status, ["CLAIMED", "CANCELLED"] as OrderStatus[])
      ),
    });

    if (activeDuplicate) {
      return jsonError("Tracking number is already registered to an active parcel", 409, "Conflict");
    }

    const ticketCode = generateTicketCode();
    const now = new Date();
    const initialTimeline: StatusTimelineEntry[] = [
      {
        status: "PENDING_INITIALIZATION",
        timestamp: now.toISOString(),
      },
    ];

    const [newOrder] = await db
      .insert(orders)
      .values({
        ticketCode,
        trackingId,
        productName: "Initialized Order",
        recipientName: "Customer",
        price: 0,
        change: 0,
        status: "PENDING_INITIALIZATION",
        statusTimeline: initialTimeline,
        imageUrl,
        customerId: auth.session.userId,
        modifiedBy: auth.session.userId,
        timestamp: now,
      })
      .returning();

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 201 Created with orderId and ticketCode
    // ---------------------------------------------------------
    const response: CustomerInitOrderRes = {
      statusMessage: "Order created successfully",
      orderId: newOrder.id as OrderId,
      ticketCode: newOrder.ticketCode ?? ticketCode,
    };

    return jsonSuccess(response, 201);
  } catch {
    return jsonError("Unable to create order. Please try again.", 400);
  }
}

