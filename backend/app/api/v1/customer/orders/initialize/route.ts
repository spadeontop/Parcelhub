import { randomInt } from "crypto";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderScreenshots } from "@/db/schema";
import { authenticateCustomerRequest, customerAuthErrorResponse } from "@/app/lib/v1/auth";
import {
  getAiTrackingIdMode,
  isAiVerificationEnabled,
  isCustomerAiRateLimited,
  logAiVerificationAttempt,
  verifyOrderScreenshot,
  type AiVerificationResult,
} from "@/app/lib/v1/ai-verification";
import { isValidImageDataUri, validateImageSize } from "@/app/lib/v1/image";
import { hasActivePaidTrackingId } from "@/app/lib/v1/orders";
import { parseJsonBody } from "@/app/lib/v1/request";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerInitOrderReq,
  CustomerInitOrderRes,
  OrderId,
  StatusTimelineEntry,
} from "@/app/types/v1/api";

export const maxDuration = 30;

function generateTicketCode(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let firstPart = "";
  let secondPart = "";
  for (let i = 0; i < 3; i++) {
    firstPart += chars.charAt(randomInt(0, chars.length));
    secondPart += chars.charAt(randomInt(0, chars.length));
  }
  return `${firstPart}-${secondPart}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateCustomerRequest(request);
    if (!auth.session || !auth.customer) {
      return customerAuthErrorResponse(auth);
    }

    if (auth.customer.blacklisted) {
      return jsonError(
        `Account suspended: ${auth.customer.blacklistReason || "Please contact support"}`,
        403,
        "Forbidden"
      );
    }

    const parsedBody = await parseJsonBody<CustomerInitOrderReq>(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const imageUrl =
      typeof parsedBody.data?.imageUrl === "string"
        ? parsedBody.data.imageUrl.trim()
        : "";

    if (!imageUrl) {
      return jsonError("imageUrl is required to initialize an order", 400);
    }

    const sizeCheck = validateImageSize(imageUrl, "CUSTOMER");
    if (!sizeCheck.valid) {
      return jsonError(sizeCheck.error || "Image exceeds size limit", 400, "ImagePayloadTooLarge");
    }

    const aiEnabled = isAiVerificationEnabled();
    const trackingIdMode = getAiTrackingIdMode();
    let aiResult: AiVerificationResult | null = null;

    if (aiEnabled) {
      if (!isValidImageDataUri(imageUrl)) {
        return jsonError(
          "A valid base64 image data URI (webp, jpeg, or png) is required for AI verification",
          400,
          "InvalidImageFormat"
        );
      }

      if (await isCustomerAiRateLimited(auth.session.userId)) {
        return jsonError(
          "Too many verification attempts. Please wait a minute and try again.",
          429,
          "Too Many Requests"
        );
      }

      const customerFullName = `${auth.customer.firstName} ${auth.customer.lastName}`.trim();
      aiResult = await verifyOrderScreenshot({
        imageUrl,
        customerFullName,
      });

      if (aiResult.status === "PROVIDER_ERROR") {
        await logAiVerificationAttempt({
          customerId: auth.session.userId,
          outcome: "PROVIDER_ERROR",
          trackingIdMode,
          result: aiResult,
        });
        return jsonError(
          "AI verification service is temporarily unavailable. Please try again shortly.",
          503,
          "Service Unavailable"
        );
      }

      if (aiResult.status === "INVALID_SCREENSHOT" || !aiResult.isVerified) {
        await logAiVerificationAttempt({
          customerId: auth.session.userId,
          outcome: "INVALID_SCREENSHOT",
          trackingIdMode,
          result: aiResult,
        });
        return jsonError(
          "Uploaded image does not appear to be a valid parcel order screenshot.",
          422,
          "InvalidScreenshot",
          { sourceApp: aiResult.sourceApp }
        );
      }

      const extractedTrackingId = aiResult.autofill?.trackingId ?? null;

      if (trackingIdMode !== "none" && !extractedTrackingId) {
        await logAiVerificationAttempt({
          customerId: auth.session.userId,
          outcome: "TRACKING_MISSING",
          trackingIdMode,
          result: aiResult,
          errorReason: "Tracking ID missing from screenshot",
        });
        return jsonError(
          "Could not find a visible tracking number on your screenshot. Please upload a screenshot showing the courier tracking number.",
          422,
          "TrackingIdMissing",
          { sourceApp: aiResult.sourceApp }
        );
      }

      if (
        (trackingIdMode === "unique" || trackingIdMode === "strict") &&
        extractedTrackingId &&
        (await hasActivePaidTrackingId(extractedTrackingId))
      ) {
        await logAiVerificationAttempt({
          customerId: auth.session.userId,
          outcome: "DUPLICATE_TRACKING",
          trackingIdMode,
          result: aiResult,
          errorReason: `Duplicate paid tracking ID: ${extractedTrackingId}`,
        });
        return jsonError(
          "Tracking number is already registered to a paid active parcel",
          409,
          "Conflict"
        );
      }
    }

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
          customerId: auth.session!.userId,
          modifiedBy: auth.session!.userId,
          timestamp: now,
        })
        .returning({
          id: orders.id,
          ticketCode: orders.ticketCode,
        });

      await tx.insert(orderScreenshots).values({
        orderId: createdOrder.id,
        imageUrl,
        isVerified: aiResult ? aiResult.isVerified : false,
        checks: aiResult ? aiResult.checks : null,
        model: aiResult ? aiResult.model : null,
        createdAt: now,
      });

      return createdOrder;
    });

    if (aiEnabled && aiResult) {
      await logAiVerificationAttempt({
        customerId: auth.session.userId,
        orderId: newOrder.id,
        outcome: "OK",
        trackingIdMode,
        result: aiResult,
      });
    }

    const response: CustomerInitOrderRes = {
      statusMessage: "Order initialized successfully",
      orderId: newOrder.id as OrderId,
      ticketCode: newOrder.ticketCode ?? ticketCode,
      ...(aiResult?.autofill ? { autofill: aiResult.autofill } : {}),
    };

    return jsonSuccess(response, 201);
  } catch (err: unknown) {
    console.error("[Customer Initialize Order Error]:", err);
    return jsonError("Unable to create order. Please try again.", 500, "Internal Server Error");
  }
}
