import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import {
  aiVerificationLogs,
  orderScreenshots,
  type AiVerificationOutcome,
  type OrderScreenshotChecks,
} from "@/db/schema";
import type {
  AiTrackingIdMode,
  CustomerOrderAutofill,
  ScreenshotSourceApp,
} from "@/app/types/v1/api";
import { normalizeTrackingId } from "./orders";
import { buildParcelVerificationContext } from "./ai-context";
import {
  callOpenRouterWithImage,
  type OpenRouterJsonSchemaFormat,
  type OpenRouterProviderConfig,
  type OpenRouterReasoningConfig,
  type OpenRouterReasoningEffort,
  type OpenRouterUsage,
} from "./openrouter";

export type AiVerificationStatus =
  | "OK"
  | "INVALID_SCREENSHOT"
  | "PROVIDER_ERROR"
  | "DISABLED";

export type AiVerificationInput = {
  readonly imageUrl: string;
  readonly customerFullName: string;
};

export type AiVerificationResult = {
  readonly status: AiVerificationStatus;
  readonly isVerified: boolean;
  readonly checks: OrderScreenshotChecks | null;
  readonly model: string | null;
  readonly provider?: string;
  readonly usage?: OpenRouterUsage;
  readonly autofill: CustomerOrderAutofill | null;
  readonly sourceApp: ScreenshotSourceApp;
  readonly latencyMs: number;
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

const VALID_REASONING_EFFORTS: readonly OpenRouterReasoningEffort[] = [
  "max",
  "xhigh",
  "high",
  "medium",
  "low",
  "minimal",
  "none",
] as const;

function getOpenRouterProviderConfig(): OpenRouterProviderConfig | undefined {
  const onlyRaw = process.env.OPENROUTER_PROVIDER_ONLY?.trim();
  const only = onlyRaw
    ? onlyRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
  const allowFallbacksRaw = process.env.OPENROUTER_ALLOW_FALLBACKS?.trim().toLowerCase();
  const allow_fallbacks =
    allowFallbacksRaw === "false"
      ? false
      : allowFallbacksRaw === "true"
        ? true
        : undefined;

  if (!only?.length && allow_fallbacks === undefined) {
    return undefined;
  }

  return {
    ...(only?.length ? { only } : {}),
    ...(allow_fallbacks !== undefined ? { allow_fallbacks } : {}),
    require_parameters: true,
  };
}

function getOpenRouterReasoningConfig(): OpenRouterReasoningConfig | undefined {
  const enabledRaw = process.env.OPENROUTER_REASONING_ENABLED?.trim().toLowerCase();
  const effortRaw = process.env.OPENROUTER_REASONING_EFFORT?.trim().toLowerCase();

  const enabled =
    enabledRaw === "true" ? true : enabledRaw === "false" ? false : undefined;
  const effort =
    effortRaw && VALID_REASONING_EFFORTS.includes(effortRaw as OpenRouterReasoningEffort)
      ? (effortRaw as OpenRouterReasoningEffort)
      : undefined;

  if (enabled === undefined && !effort) {
    return undefined;
  }

  return {
    ...(enabled !== undefined ? { enabled } : {}),
    ...(effort ? { effort } : {}),
  };
}

/**
 * Runs internal AI verification and autofill extraction against a customer order screenshot via OpenRouter.
 */
export async function verifyOrderScreenshot(
  input: AiVerificationInput
): Promise<AiVerificationResult> {
  const startedAt = Date.now();

  if (!isAiVerificationEnabled()) {
    return {
      status: "DISABLED",
      isVerified: false,
      checks: null,
      model: null,
      autofill: null,
      sourceApp: "unknown",
      latencyMs: Date.now() - startedAt,
      reason: "AI_VERIFICATION is disabled",
    };
  }

  const model = process.env.OPENROUTER_MODEL?.trim();
  if (!model) {
    return {
      status: "PROVIDER_ERROR",
      isVerified: false,
      checks: null,
      model: null,
      autofill: null,
      sourceApp: "unknown",
      latencyMs: Date.now() - startedAt,
      reason: "OPENROUTER_MODEL is not configured",
    };
  }

  const response = await callOpenRouterWithImage({
    model,
    prompt: buildParcelVerificationContext(),
    imageUrl: input.imageUrl,
    format: SCREENSHOT_CHECKS_FORMAT,
    provider: getOpenRouterProviderConfig(),
    reasoning: getOpenRouterReasoningConfig(),
    temperature: 0,
  });

  if (!response.ok) {
    return {
      status: "PROVIDER_ERROR",
      isVerified: false,
      checks: null,
      model,
      autofill: null,
      sourceApp: "unknown",
      latencyMs: Date.now() - startedAt,
      reason: response.error,
    };
  }

  let parsed: RawVerificationPayload;
  try {
    parsed = JSON.parse(response.text) as RawVerificationPayload;
  } catch {
    return {
      status: "PROVIDER_ERROR",
      isVerified: false,
      checks: null,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
      autofill: null,
      sourceApp: "unknown",
      latencyMs: Date.now() - startedAt,
      reason: "Failed to parse structured JSON from OpenRouter",
    };
  }

  const rawTrackingId = parsed.trackingId_strict?.trim();
  const trackingId = rawTrackingId ? normalizeTrackingId(rawTrackingId) : null;
  const productName = parsed.productName?.trim() || null;
  const recipientName = parsed.recipientName?.trim() || input.customerFullName;
  const price =
    typeof parsed.price === "number" && Number.isFinite(parsed.price) && parsed.price >= 0
      ? parsed.price
      : null;
  const mode = getAiTrackingIdMode();
  const trackingIdLocked = mode === "strict" && Boolean(trackingId);

  const checks: OrderScreenshotChecks = {
    isParcel: parsed.isParcel,
    hasRealMetadata: parsed.hasRealMetadata,
    sourceApp: parsed.sourceApp,
    trackingId_strict: trackingId ?? undefined,
    trackingId_similar: parsed.trackingId_similar?.trim() || undefined,
    trackingIdLocked,
  };

  const autofill: CustomerOrderAutofill = {
    trackingId,
    productName,
    recipientName,
    price,
    trackingIdLocked,
    sourceApp: parsed.sourceApp,
  };

  const isVerified = Boolean(parsed.isParcel && parsed.hasRealMetadata);

  return {
    status: isVerified ? "OK" : "INVALID_SCREENSHOT",
    isVerified,
    checks,
    model: response.model,
    provider: response.provider,
    usage: response.usage,
    autofill,
    sourceApp: parsed.sourceApp,
    latencyMs: Date.now() - startedAt,
    reason: isVerified ? undefined : "Screenshot did not pass parcel verification",
  };
}

const DEFAULT_AI_RATE_LIMIT_MAX_PER_MINUTE = 5;

function resolveAiRateLimitMaxPerMinute(explicitLimit?: number): number {
  if (typeof explicitLimit === "number" && explicitLimit > 0) {
    return explicitLimit;
  }
  const envVal = process.env.AI_RATE_LIMIT_MAX_PER_MINUTE?.trim();
  const parsed = envVal ? parseInt(envVal, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_AI_RATE_LIMIT_MAX_PER_MINUTE;
}

/**
 * Checks whether a customer has reached the per-minute AI verification attempt limit
 * using `ai_verification_logs` (throttles both accepted and rejected screenshot spam).
 */
export async function isCustomerAiRateLimited(
  customerId: string,
  maxPerMinute?: number
): Promise<boolean> {
  const limit = resolveAiRateLimitMaxPerMinute(maxPerMinute);
  const windowStart = new Date(Date.now() - 60_000);
  const [row] = await db
    .select({ total: count() })
    .from(aiVerificationLogs)
    .where(
      and(
        eq(aiVerificationLogs.customerId, customerId),
        gt(aiVerificationLogs.createdAt, windowStart)
      )
    );
  return Number(row?.total ?? 0) >= limit;
}

/**
 * Non-fatal telemetry writer for `ai_verification_logs`.
 * Never throws so logging issues cannot block a valid customer order.
 */
export async function logAiVerificationAttempt(params: {
  customerId: string;
  orderId?: string | null;
  outcome: AiVerificationOutcome;
  trackingIdMode: AiTrackingIdMode;
  result: AiVerificationResult;
  errorReason?: string;
}): Promise<void> {
  try {
    await db.insert(aiVerificationLogs).values({
      customerId: params.customerId,
      orderId: params.orderId ?? null,
      outcome: params.outcome,
      trackingIdMode: params.trackingIdMode,
      sourceApp: params.result.sourceApp,
      model: params.result.model,
      provider: params.result.provider ?? null,
      inputTokens: params.result.usage?.inputTokens ?? null,
      outputTokens: params.result.usage?.outputTokens ?? null,
      totalTokens: params.result.usage?.totalTokens ?? null,
      costUsd: params.result.usage?.cost ?? null,
      latencyMs: params.result.latencyMs,
      errorReason: params.errorReason ?? params.result.reason ?? null,
    });
  } catch (err: unknown) {
    console.warn(
      "[AI Verification Log Error]:",
      err instanceof Error ? err.message : err
    );
  }
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
