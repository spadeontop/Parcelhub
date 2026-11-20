import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { fcmTokens } from "@/db/schema";
import { authenticateAnyV1User } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  NotificationDeleteTokenReq,
  NotificationDeleteTokenRes,
} from "@/app/types/v1/api";

export async function DELETE(request: NextRequest) {
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
    // 2. Optional Request Body:
    //    Allow optional specific fcmToken in JSON body
    // ---------------------------------------------------------
    let specificToken: string | undefined;
    try {
      const body = (await request.json()) as NotificationDeleteTokenReq;
      if (body?.fcmToken && typeof body.fcmToken === "string") {
        specificToken = body.fcmToken.trim();
      }
    } catch {
      // Body is optional on DELETE requests
    }

    // ---------------------------------------------------------
    // 3. Database Deregistration:
    //    If specific token provided, remove matching token for this user;
    //    otherwise, purge all tokens registered to this user.
    // ---------------------------------------------------------
    if (specificToken) {
      await db
        .delete(fcmTokens)
        .where(
          and(
            eq(fcmTokens.token, specificToken),
            eq(fcmTokens.userId, auth.session.userId)
          )
        );
    } else {
      await db.delete(fcmTokens).where(eq(fcmTokens.userId, auth.session.userId));
    }

    // ---------------------------------------------------------
    // 4. Response:
    //    Return 200 OK conforming to NotificationDeleteTokenRes
    // ---------------------------------------------------------
    const response: NotificationDeleteTokenRes = {
      statusMessage: "FCM token removed successfully",
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Notification Delete Token Error]:", err);
    return jsonError("Internal server error removing FCM token", 500, "Internal Server Error");
  }
}
