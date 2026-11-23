import { SignJWT } from "jose";
import { after } from "next/server";
import type { RealtimeOrderSignal } from "@/app/types/v1/api";

export type RealtimeRole = "CUSTOMER" | "STAFF";

const CUSTOMER_REALTIME_TTL_SECONDS = 15 * 60; // 15 minutes (aligned with authToken)
const STAFF_REALTIME_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const BROADCAST_TIMEOUT_MS = 4000;

export function isRealtimeEnabled(): boolean {
  return (
    process.env.REALTIME_ENABLED === "true" &&
    Boolean(process.env.SUPABASE_URL?.trim()) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) &&
    Boolean(process.env.SUPABASE_JWT_SECRET?.trim())
  );
}

export function getRealtimeChannelForUser(
  userId: string,
  role: RealtimeRole
): string {
  return role === "STAFF" ? "staff:orders" : `customer:${userId}`;
}

export async function signRealtimeToken(
  userId: string,
  role: RealtimeRole
): Promise<{ token: string; channel: string; expiresAt: string }> {
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("SUPABASE_JWT_SECRET is not configured");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const ttlSeconds =
    role === "STAFF" ? STAFF_REALTIME_TTL_SECONDS : CUSTOMER_REALTIME_TTL_SECONDS;
  const expSeconds = nowSeconds + ttlSeconds;

  const token = await new SignJWT({
    sub: userId,
    role: "authenticated",
    user_role: role,
    aud: "authenticated",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(expSeconds)
    .sign(new TextEncoder().encode(secret));

  return {
    token,
    channel: getRealtimeChannelForUser(userId, role),
    expiresAt: new Date(expSeconds * 1000).toISOString(),
  };
}

async function getBroadcastBearerToken(
  supabaseUrl: string,
  serviceKey: string
): Promise<string> {
  // Legacy service_role JWTs can be passed directly; new sb_secret_ keys require
  // a short-lived service_role JWT signed with SUPABASE_JWT_SECRET for Realtime HTTP Broadcast.
  if (serviceKey.startsWith("eyJ")) {
    return serviceKey;
  }

  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (!secret) {
    return serviceKey;
  }

  let ref: string | undefined;
  try {
    ref = new URL(supabaseUrl).hostname.split(".")[0];
  } catch {
    ref = undefined;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return new SignJWT({
    role: "service_role",
    iss: "supabase",
    ...(ref ? { ref } : {}),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + 60)
    .sign(new TextEncoder().encode(secret));
}

/**
 * Publishes a thin (~120 byte) refetch signal to Supabase Realtime Broadcast.
 * Strictly non-fatal: never throws and never fails a committed order mutation.
 */
export async function broadcastOrderSignal(
  topics: readonly string[],
  payload: RealtimeOrderSignal
): Promise<boolean> {
  if (!isRealtimeEnabled() || topics.length === 0) {
    return false;
  }

  const supabaseUrl = process.env.SUPABASE_URL!.trim().replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();

  try {
    const bearerToken = await getBroadcastBearerToken(supabaseUrl, serviceKey);
    const res = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({
        messages: topics.map((topic) => ({
          topic,
          event: "order_signal",
          payload,
          private: true,
        })),
      }),
      signal: AbortSignal.timeout(BROADCAST_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(
        `[Realtime Broadcast] Non-OK response (${res.status}) for event ${payload.event} on order ${payload.orderId}`
      );
      return false;
    }

    return true;
  } catch (err) {
    console.warn(
      `[Realtime Broadcast] Failed to publish ${payload.event} for order ${payload.orderId}:`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/**
 * Schedules a non-fatal Realtime broadcast after the HTTP response finishes
 * (via Next.js `after()`), with a safe fallback when invoked outside a Next.js
 * request context (e.g., standalone `tsx` test scripts).
 */
export function publishOrderSignal(
  topics: readonly string[],
  payload: RealtimeOrderSignal
): void {
  if (!isRealtimeEnabled() || topics.length === 0) {
    return;
  }

  try {
    after(async () => {
      await broadcastOrderSignal(topics, payload);
    });
  } catch {
    void broadcastOrderSignal(topics, payload);
  }
}
