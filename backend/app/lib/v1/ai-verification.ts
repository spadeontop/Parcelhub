import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderScreenshots, type OrderScreenshotChecks } from "@/db/schema";
import type {
  AiTrackingIdMode,
  CustomerOrderAutofill,
  ScreenshotSourceApp,
} from "@/app/types/v1/api";
import { buildParcelVerificationContext } from "./ai-context";
import {
  callOpenRouterWithImage,
  type OpenRouterJsonSchemaFormat,
} from "./openrouter";

export type AiVerificationInput = {
  readonly imageUrl: string;
  readonly customerFullName: string;
};

export type AiVerificationResult = {
  readonly isVerified: boolean;
  readonly checks: OrderScreenshotChecks | null;
  readonly model: string | null;
  readonly autofill: CustomerOrderAutofill | null;
  readonly sourceApp: ScreenshotSourceApp;
  readonly reason?: string;
};

type RawVerificationPayload = {
  isParcel: boolean;
  hasRealMetadata: boolean;
  sourceApp: ScreenshotSourceApp;
  trackingId_strict: string | null;
  trackingId_similar: string | null;
  productName: string | null;
  recipientName: string | null;
  price: number | null;
};

const VALID_TRACKING_ID_MODES: readonly AiTrackingIdMode[] = [
  "none",
  "present",
  "unique",
  "strict",
] as const;

const SCREENSHOT_CHECKS_FORMAT: OpenRouterJsonSchemaFormat = {
  type: "json_schema",
  name: "order_screenshot_verification",
  strict: true,
  schema: {
    type: "object",
    properties: {
      isParcel: { type: "boolean" },
      hasRealMetadata: { type: "boolean" },
      sourceApp: {
        type: "string",
        enum: ["shopee", "lazada", "tiktok", "unknown"],
      },
      trackingId_strict: { type: ["string", "null"] },
      trackingId_similar: { type: ["string", "null"] },
      productName: { type: ["string", "null"] },
      recipientName: { type: ["string", "null"] },
      price: { type: ["number", "null"] },
    },
    required: [
      "isParcel",
      "hasRealMetadata",
      "sourceApp",
      "trackingId_strict",
      "trackingId_similar",
      "productName",
      "recipientName",
      "price",
    ],
    additionalProperties: false,
  },
};

/**
 * Checks whether AI screenshot verification is enabled via environment configuration.
 */
export function isAiVerificationEnabled(): boolean {
  return process.env.AI_VERIFICATION === "true";
}

/**
 * Returns the configured tracking ID verification mode (`none` | `present` | `unique` | `strict`).
 */
export function getAiTrackingIdMode(): AiTrackingIdMode {
  const raw = process.env.AI_TRACKING_ID_MODE?.trim().toLowerCase();
  if (raw && VALID_TRACKING_ID_MODES.includes(raw as AiTrackingIdMode)) {
    return raw as AiTrackingIdMode;
  }
  return "present";
}

/**
 * Runs internal AI verification and autofill extraction against a customer order screenshot via OpenRouter.
 */
export async function verifyOrderScreenshot(
  input: AiVerificationInput
): Promise<AiVerificationResult> {
  if (!isAiVerificationEnabled()) {
    return {
      isVerified: false,
      checks: null,
      model: null,
      autofill: null,
      sourceApp: "unknown",
      reason: "AI_VERIFICATION is disabled",
    };
  }

  const model = process.env.OPENROUTER_MODEL?.trim();
  if (!model) {
    return {
      isVerified: false,
      checks: null,
      model: null,
      autofill: null,
      sourceApp: "unknown",
      reason: "OPENROUTER_MODEL is not configured",
    };
  }

  const response = await callOpenRouterWithImage({
    model,
    prompt: buildParcelVerificationContext(),
    imageUrl: input.imageUrl,
    format: SCREENSHOT_CHECKS_FORMAT,
  });

  if (!response.ok) {
    return {
      isVerified: false,
      checks: null,
      model,
      autofill: null,
      sourceApp: "unknown",
      reason: response.error,
    };
  }

  let parsed: RawVerificationPayload;
  try {
    parsed = JSON.parse(response.text) as RawVerificationPayload;
  } catch {
    return {
      isVerified: false,
      checks: null,
      model: response.model,
      autofill: null,
      sourceApp: "unknown",
      reason: "Failed to parse structured JSON from OpenRouter",
    };
  }

  const trackingId = parsed.trackingId_strict?.trim() || null;
  const productName = parsed.productName?.trim() || null;
  const recipientName = parsed.recipientName?.trim() || input.customerFullName;
  const price =
    typeof parsed.price === "number" && Number.isFinite(parsed.price) && parsed.price >= 0
      ? parsed.price
      : null;
  const mode = getAiTrackingIdMode();

  const checks: OrderScreenshotChecks = {
    isParcel: parsed.isParcel,
    hasRealMetadata: parsed.hasRealMetadata,
    sourceApp: parsed.sourceApp,
    trackingId_strict: trackingId ?? undefined,
    trackingId_similar: parsed.trackingId_similar?.trim() || undefined,
  };

  const autofill: CustomerOrderAutofill = {
    trackingId,
    productName,
    recipientName,
    price,
    trackingIdLocked: mode === "strict",
    sourceApp: parsed.sourceApp,
  };

  const isVerified = Boolean(parsed.isParcel && parsed.hasRealMetadata);

  return {
    isVerified,
    checks,
    model: response.model,
    autofill,
    sourceApp: parsed.sourceApp,
    reason: isVerified ? undefined : "Screenshot did not pass parcel verification",
  };
}

/**
 * Persists an AI verification result onto the order's `order_screenshots` row.
 */
export async function saveScreenshotVerificationResult(
  orderId: string,
  result: AiVerificationResult
): Promise<void> {
  await db
    .update(orderScreenshots)
    .set({
      isVerified: result.isVerified,
      checks: result.checks,
      model: result.model,
    })
    .where(eq(orderScreenshots.orderId, orderId));
}
