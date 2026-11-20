import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderScreenshots, type OrderScreenshotChecks } from "@/db/schema";

export type AiVerificationInput = {
  readonly orderId: string;
  readonly imageUrl: string;
  readonly trackingId?: string | null;
  readonly productName?: string;
  readonly recipientName?: string;
  readonly price?: number;
};

export type AiVerificationResult = {
  readonly isVerified: boolean;
  readonly checks: OrderScreenshotChecks | null;
  readonly model: string | null;
  readonly reason?: string;
};

/**
 * Checks whether AI screenshot verification is enabled via environment configuration.
 */
export function isAiVerificationEnabled(): boolean {
  return process.env.AI_VERIFICATION === "true";
}

/**
 * Runs internal AI verification against a customer order screenshot.
 * Scaffold only — actual model/OCR provider logic will be wired here later.
 */
export async function verifyOrderScreenshot(
  input: AiVerificationInput
): Promise<AiVerificationResult> {
  if (!isAiVerificationEnabled()) {
    return {
      isVerified: false,
      checks: null,
      model: null,
      reason: "AI_VERIFICATION is disabled",
    };
  }

  // TODO: Implement AI/OCR verification approach using `input.imageUrl` and optional order fields.
  void input;

  return {
    isVerified: false,
    checks: null,
    model: null,
    reason: "AI verification approach not yet implemented",
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
