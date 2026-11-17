import { App, initializeApp, getApps, getApp, cert, applicationDefault } from "firebase-admin/app";
import { getMessaging, Message } from "firebase-admin/messaging";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fcmTokens } from "@/db/schema";

export interface SendFcmNotificationParams {
  userId: string;
  title: string;
  body: string;
  notifId?: string; // Identifier for in-place notification replacement (e.g. orderId)
  data?: Record<string, string>;
}

export interface SendFcmNotificationResult {
  success: boolean;
  messageId?: string;
  reason?: string;
  error?: string;
}

/**
 * Check whether FCM is enabled and credentials are configured.
 */
export function isFcmConfigured(): boolean {
  if (process.env.FCM_ENABLED !== "true") {
    return false;
  }

  // Google Application Credentials or explicit project credentials
  const hasAppCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const hasExplicitCreds = !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );

  return hasAppCreds || hasExplicitCreds;
}

/**
 * Returns the initialized Firebase Admin App singleton, or null if unconfigured.
 */
export function getFirebaseAdminApp(): App | null {
  if (!isFcmConfigured()) {
    return null;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    return getApp();
  }

  try {
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      return initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle multiline newlines in environment variable
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }

    // Fall back to default application credentials if set
    return initializeApp({
      credential: applicationDefault(),
    });
  } catch (err: unknown) {
    console.warn(
      "[FCM v1] Failed to initialize Firebase Admin SDK:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Removes a specific FCM token from the database.
 */
export async function removeFcmToken(token: string): Promise<boolean> {
  try {
    await db.delete(fcmTokens).where(eq(fcmTokens.token, token));
    return true;
  } catch (err: unknown) {
    console.warn(
      `[FCM v1] Error removing token "${token}":`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/**
 * Removes any active device token registered to a specific userId.
 */
export async function removeUserFcmToken(userId: string): Promise<boolean> {
  try {
    await db.delete(fcmTokens).where(eq(fcmTokens.userId, userId));
    return true;
  } catch (err: unknown) {
    console.warn(
      `[FCM v1] Error removing token for user "${userId}":`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/**
 * Pure internal function to send a push notification to a user.
 * 
 * INVARIANTS:
 * 1. Strictly non-fatal: NEVER throws, ensuring primary business logic never fails on push failure.
 * 2. Notification Replacement: If `notifId` is provided, sets Android `tag` and APNs `apns-collapse-id`
 *    so newer updates replace existing notifications in-place rather than stacking duplicates.
 * 3. Single Device Targeting: Looks up the user's active device token from `fcm_tokens`.
 * 4. Stale Token Auto-Pruning: Purges dead or invalid tokens from DB if Firebase reports them as unregistered.
 */
export async function sendFcmNotification(
  params: SendFcmNotificationParams
): Promise<SendFcmNotificationResult> {
  const { userId, title, body, notifId, data } = params;

  try {
    // 1. Look up user's active device token in DB
    const record = await db.query.fcmTokens.findFirst({
      where: eq(fcmTokens.userId, userId),
    });

    if (!record || !record.token) {
      return {
        success: false,
        reason: "NO_ACTIVE_DEVICE_TOKEN",
      };
    }

    // 2. If FCM is disabled or unconfigured, log dry-run info and return cleanly
    if (!isFcmConfigured()) {
      return {
        success: true,
        reason: "FCM_DISABLED_DRY_RUN",
      };
    }

    // 3. Obtain Firebase Admin instance
    const app = getFirebaseAdminApp();
    if (!app) {
      return {
        success: false,
        reason: "FIREBASE_ADMIN_INIT_FAILED",
      };
    }

    // 4. Construct payload with high priority, default sound, channelId, and in-place replacement support
    const stringifiedData: Record<string, string> = {
      title,
      body,
      ...(data || {}),
      ...(notifId ? { notifId } : {}),
    };

    const message: Message = {
      token: record.token,
      notification: {
        title,
        body,
      },
      data: stringifiedData,
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: "default",
          defaultSound: true,
          defaultVibrateTimings: true,
          priority: "high",
          visibility: "public",
          // Android: "tag" replaces any existing notification with the same tag in the notification tray
          ...(notifId ? { tag: notifId } : {}),
        },
        // Android: "collapseKey" collapses pending undelivered messages if the device is offline
        ...(notifId ? { collapseKey: notifId } : {}),
      },
      apns: {
        headers: {
          "apns-priority": "10",
          "apns-push-type": "alert",
          // iOS: "apns-collapse-id" replaces any existing banner with the same ID in Notification Center
          ...(notifId ? { "apns-collapse-id": notifId } : {}),
        },
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    };

    // 5. Dispatch message via Firebase Admin SDK
    const messageId = await getMessaging(app).send(message);

    return {
      success: true,
      messageId,
    };
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    const errorCode = errorObj?.code;
    const errorMsg = errorObj?.message || (err instanceof Error ? err.message : String(err));

    console.warn(`[FCM v1] Push dispatch error for user "${userId}":`, errorMsg);

    // Auto-prune stale / dead tokens
    if (
      errorCode === "messaging/registration-token-not-registered" ||
      errorCode === "messaging/invalid-registration-token"
    ) {
      console.info(`[FCM v1] Pruning unregistered device token for user "${userId}".`);
      await removeUserFcmToken(userId);
    }

    // Invariant: NEVER throw — always return non-fatal result
    return {
      success: false,
      error: errorMsg,
    };
  }
}
