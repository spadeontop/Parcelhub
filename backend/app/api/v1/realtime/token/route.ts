import { NextRequest } from "next/server";
import { authenticateAnyV1User } from "@/app/lib/v1/auth";
import {
  isRealtimeEnabled,
  signRealtimeToken,
  type RealtimeRole,
} from "@/app/lib/v1/realtime";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import type { RealtimeTokenRes } from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAnyV1User(request);
    if (!auth.session) {
      return jsonError(auth.error || "Unauthorized", auth.status);
    }

    const { userId, role } = auth.session;
    if (role !== "CUSTOMER" && role !== "STAFF") {
      return jsonError(
        "Forbidden: Realtime channel access is only available for customers and staff",
        403
      );
    }

    if (!isRealtimeEnabled()) {
      return jsonError("Realtime service is not configured", 503);
    }

    const { token, channel, expiresAt } = await signRealtimeToken(
      userId,
      role as RealtimeRole
    );

    const response: RealtimeTokenRes = {
      statusMessage: "Realtime token issued",
      token,
      channel,
      expiresAt,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Realtime Token Error]:", err);
    return jsonError("Internal server error issuing realtime token", 500);
  }
}
