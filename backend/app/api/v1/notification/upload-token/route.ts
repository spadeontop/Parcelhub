import { NextRequest } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
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
    //    a. Acquire per-user transaction advisory lock to serialize concurrent uploads
    //    b. Remove any other device token registered to this user
    //    c. Insert or update the new token mapped to auth.session.userId
    // ---------------------------------------------------------
    const now = new Date();
    await db.transaction(async (tx: typeof db) => {
      // Bound lock wait time so bursts for the same user cannot hog the connection pool
      await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);

      // Serialize concurrent token uploads for the same user under READ COMMITTED
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`fcm:${auth.session!.userId}`}))`
      );

      await tx
        .delete(fcmTokens)
        .where(
          and(
            eq(fcmTokens.userId, auth.session!.userId),
            ne(fcmTokens.token, fcmToken)
          )
        );

      await tx
        .insert(fcmTokens)
        .values({
          token: fcmToken,
          userId: auth.session!.userId,
          createdAt: now,
        })
        .onConflictDoUpdate({
          target: fcmTokens.token,
          set: {
            userId: auth.session!.userId,
            createdAt: now,
          },
        });
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
