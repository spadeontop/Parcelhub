import crypto from "node:crypto";
import { and, desc, eq, gte, gt, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { emailVerificationCodes, EmailVerificationCodeRow } from "@/db/schema";
import type { EmailVerificationPurpose } from "@/app/types/v1/api";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getOtpConfig() {
  const ttlMinutes = Math.max(1, Number(process.env.EMAIL_OTP_TTL_MINUTES || "10") || 10);
  const cooldownSeconds = Math.max(
    1,
    Number(process.env.EMAIL_OTP_RESEND_COOLDOWN_SEC || "60") || 60
  );
  const maxAttempts = Math.max(1, Number(process.env.EMAIL_OTP_MAX_ATTEMPTS || "5") || 5);
  const maxSendsPer15m = Math.max(
    1,
    Number(process.env.EMAIL_OTP_MAX_SENDS_PER_15M || "5") || 5
  );

  return {
    ttlMinutes,
    ttlSeconds: ttlMinutes * 60,
    cooldownSeconds,
    maxAttempts,
    maxSendsPer15m,
  };
}

function getOtpSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is required for OTP hashing.");
  }
  return secret;
}

export function hashOtpCode(
  email: string,
  purpose: EmailVerificationPurpose,
  code: string
): string {
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(`otp-v1:${email}:${purpose}:${code}`)
    .digest("hex");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export type IssueOtpResult =
  | {
      ok: true;
      otpId: string;
      code: string;
      expiresAt: Date;
      expiresInSeconds: number;
      retryAfterSeconds: number;
      ttlMinutes: number;
    }
  | {
      ok: false;
      reason: "COOLDOWN" | "RATE_LIMIT";
      retryAfterSeconds: number;
    };

export async function issueEmailOtp(params: {
  customerId?: string | null;
  email: string;
  purpose: EmailVerificationPurpose;
  bypassRateLimit?: boolean;
}): Promise<IssueOtpResult> {
  const email = normalizeEmail(params.email);
  const config = getOtpConfig();
  const now = new Date();

  if (!params.bypassRateLimit) {
    const latest = await db.query.emailVerificationCodes.findFirst({
      where: and(
        eq(emailVerificationCodes.email, email),
        eq(emailVerificationCodes.purpose, params.purpose)
      ),
      orderBy: [desc(emailVerificationCodes.createdAt)],
      columns: { createdAt: true },
    });

    if (latest) {
      const elapsedSec = Math.floor((now.getTime() - latest.createdAt.getTime()) / 1000);
      if (elapsedSec < config.cooldownSeconds) {
        return {
          ok: false,
          reason: "COOLDOWN",
          retryAfterSeconds: Math.max(1, config.cooldownSeconds - elapsedSec),
        };
      }
    }

    const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          eq(emailVerificationCodes.purpose, params.purpose),
          gte(emailVerificationCodes.createdAt, windowStart)
        )
      );

    if ((countRow?.count ?? 0) >= config.maxSendsPer15m) {
      return {
        ok: false,
        reason: "RATE_LIMIT",
        retryAfterSeconds: 15 * 60,
      };
    }
  }

  const code = String(crypto.randomInt(100000, 1000000));
  const codeHash = hashOtpCode(email, params.purpose, code);
  const expiresAt = new Date(now.getTime() + config.ttlSeconds * 1000);

  const inserted = await db.transaction(async (tx: typeof db) => {
    await tx
      .update(emailVerificationCodes)
      .set({ consumedAt: now })
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          eq(emailVerificationCodes.purpose, params.purpose),
          isNull(emailVerificationCodes.consumedAt)
        )
      );

    const [row] = await tx
      .insert(emailVerificationCodes)
      .values({
        customerId: params.customerId ?? null,
        email,
        purpose: params.purpose,
        codeHash,
        attempts: 0,
        maxAttempts: config.maxAttempts,
        expiresAt,
      })
      .returning({ id: emailVerificationCodes.id });

    return row;
  });

  return {
    ok: true,
    otpId: inserted.id,
    code,
    expiresAt,
    expiresInSeconds: config.ttlSeconds,
    retryAfterSeconds: config.cooldownSeconds,
    ttlMinutes: config.ttlMinutes,
  };
}

export async function revokeUnsentOtp(otpId: string): Promise<void> {
  await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.id, otpId));
}

export type VerifyOtpResult =
  | { ok: true; row: EmailVerificationCodeRow }
  | { ok: false };

export async function verifyAndConsumeEmailOtp(params: {
  email: string;
  purpose: EmailVerificationPurpose;
  code: string;
}): Promise<VerifyOtpResult> {
  const email = normalizeEmail(params.email);
  const trimmedCode = params.code.trim();

  if (!/^\d{6}$/.test(trimmedCode)) {
    return { ok: false };
  }

  const now = new Date();
  const activeOtp = await db.query.emailVerificationCodes.findFirst({
    where: and(
      eq(emailVerificationCodes.email, email),
      eq(emailVerificationCodes.purpose, params.purpose),
      isNull(emailVerificationCodes.consumedAt)
    ),
    orderBy: [desc(emailVerificationCodes.createdAt)],
  });

  if (
    !activeOtp ||
    activeOtp.expiresAt.getTime() <= now.getTime() ||
    activeOtp.attempts >= activeOtp.maxAttempts
  ) {
    return { ok: false };
  }

  const candidateHash = hashOtpCode(email, params.purpose, trimmedCode);
  const matches = timingSafeEqualHex(candidateHash, activeOtp.codeHash);

  if (!matches) {
    await db
      .update(emailVerificationCodes)
      .set({
        attempts: sql`${emailVerificationCodes.attempts} + 1`,
      })
      .where(
        and(
          eq(emailVerificationCodes.id, activeOtp.id),
          isNull(emailVerificationCodes.consumedAt)
        )
      );
    return { ok: false };
  }

  const [consumed] = await db
    .update(emailVerificationCodes)
    .set({ consumedAt: now })
    .where(
      and(
        eq(emailVerificationCodes.id, activeOtp.id),
        isNull(emailVerificationCodes.consumedAt),
        gt(emailVerificationCodes.expiresAt, now),
        lt(emailVerificationCodes.attempts, emailVerificationCodes.maxAttempts)
      )
    )
    .returning();

  if (!consumed) {
    return { ok: false };
  }

  return { ok: true, row: consumed };
}
