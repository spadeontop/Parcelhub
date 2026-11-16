import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fcmTokens } from "@/db/schema";
import { authenticateAnyV1User } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  NotificationUploadTokenReq,
  NotificationUploadTokenRes,
} from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation:
    //    Require valid JWT Bearer token (CUSTOMER, STAFF, or ADMIN)
    // ---------------------------------------------------------
    const auth = await authenticateAnyV1User(request);
    if (!auth.session) {
      return jsonError(auth.error || "Unauthorized", auth.status, "Unauthorized");
    }

    // ---------------------------------------------------------
    // 2. Request Validation:
    //    Parse JSON body and validate fcmToken string
    // ---------------------------------------------------------
    let body: NotificationUploadTokenReq;
    try {
      body = (await request.json()) as NotificationUploadTokenReq;
    } catch {
      return jsonError("Invalid JSON request body", 400);
    }

    const fcmToken = body.fcmToken?.trim();
    if (!fcmToken) {
      return jsonError("fcmToken is required", 400);
    }

    // ---------------------------------------------------------
    // 3. Database Persistence (Single Active Device Policy):
    //    a. Remove any previous device token registered to this user
    //    b. Insert or update the new token mapped to auth.session.userId
    // ---------------------------------------------------------
    await db.delete(fcmTokens).where(eq(fcmTokens.userId, auth.session.userId));

    await db
      .insert(fcmTokens)
      .values({
        token: fcmToken,
        userId: auth.session.userId,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: fcmTokens.token,
        set: {
          userId: auth.session.userId,
          createdAt: new Date(),
        },
      });

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK conforming to NotificationUploadTokenRes
    // ---------------------------------------------------------
    const response: NotificationUploadTokenRes = {
      statusMessage: "FCM token saved successfully",
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal server error saving FCM token";
    return jsonError(errorMsg, 500);
  }
}
