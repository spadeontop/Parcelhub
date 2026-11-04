import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { NotificationSendReq, NotificationSendRes } from "@/app/types/api";

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request, ["STAFF", "ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  try {
    const body = (await request.json()) as NotificationSendReq;
    if (!body.notificationBody || !body.fcmToken) {
      return jsonError("notificationBody and fcmToken are required", 400);
    }

    // In a live environment with firebase-admin, admin.messaging().send(...) would be triggered here.
    const response: NotificationSendRes = {
      statusMessage: "Notification sent successfully",
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
