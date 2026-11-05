import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { NotificationUploadTokenReq, NotificationUploadTokenRes } from "@/app/types/api";

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request, ["CUSTOMER", "STAFF", "ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  try {
    const body = (await request.json()) as NotificationUploadTokenReq;
    if (!body.fcmToken) {
      return jsonError("fcmToken is required", 400);
    }

    db.addFcmToken(body.fcmToken);

    const response: NotificationUploadTokenRes = {
      statusMessage: "FCM token saved successfully",
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
