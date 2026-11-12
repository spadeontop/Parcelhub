import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderScreenshots } from "@/db/schema";
import { authenticateCustomerRequest, checkCustomerBlacklisted } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerInitOrderReq,
  CustomerInitOrderRes,
  OrderId,
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
    //    Parse JSON body, strictly require only imageUrl
    // ---------------------------------------------------------
    const body = (await request.json()) as CustomerInitOrderReq;
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

    if (!imageUrl) {
      return jsonError("imageUrl is required to initialize an order", 400);
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Generate uppercase + digits ticketCode (e.g. 4B2-9X7)
    //    b. Atomically insert draft order (PENDING_INITIALIZATION, trackingId = null)
    //       and linked order_screenshots verification row (isVerified = false)
    // ---------------------------------------------------------
    const ticketCode = generateTicketCode();
    const now = new Date();
    const initialTimeline: StatusTimelineEntry[] = [
      {
        status: "PENDING_INITIALIZATION",
        timestamp: now.toISOString(),
      },
    ];

    const newOrder = await db.transaction(async (tx: typeof db) => {
      const [createdOrder] = await tx
        .insert(orders)
        .values({
          ticketCode,
          trackingId: null,
          productName: "",
          recipientName: "",
          price: 0,
          change: 0,
          status: "PENDING_INITIALIZATION",
          statusTimeline: initialTimeline,
          imageUrl,
          customerId: auth.session!.userId,
          modifiedBy: auth.session!.userId,
          timestamp: now,
        })
        .returning();

      await tx.insert(orderScreenshots).values({
        orderId: createdOrder.id,
        imageUrl,
        isVerified: false,
        checks: null,
        model: null,
        createdAt: now,
      });

      return createdOrder;
    });

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 201 Created with orderId and ticketCode
    // ---------------------------------------------------------
    const response: CustomerInitOrderRes = {
      statusMessage: "Order initialized successfully",
      orderId: newOrder.id as OrderId,
      ticketCode: newOrder.ticketCode ?? ticketCode,
    };

    return jsonSuccess(response, 201);
  } catch {
    return jsonError("Unable to create order. Please try again.", 400);
  }
}

