import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { sendOtpEmail } from "@/app/lib/v1/email";
import {
  getOtpConfig,
  isValidEmailFormat,
  issueEmailOtp,
  normalizeEmail,
  revokeUnsentOtp,
} from "@/app/lib/v1/otp";
import { parseJsonBody } from "@/app/lib/v1/request";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import type {
  CustomerSendEmailVerificationReq,
  CustomerSendEmailVerificationRes,
} from "@/app/types/v1/api";

const ANTI_ENUM_MESSAGE =
  "If an unverified account with that email exists, a verification code has been sent.";

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody<CustomerSendEmailVerificationReq>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  try {
    const email = parsedBody.data?.email ? normalizeEmail(parsedBody.data.email) : "";
    if (!email || !isValidEmailFormat(email)) {
      return jsonError("Please enter a valid email address", 400);
    }

    const config = getOtpConfig();
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, email),
      columns: {
        id: true,
        email: true,
        firstName: true,
        emailVerified: true,
        blacklisted: true,
      },
    });

    // Anti-enumeration: identical 200 OK if unregistered, blacklisted, or already verified
    if (!customer || customer.blacklisted || customer.emailVerified) {
      const response: CustomerSendEmailVerificationRes = {
        statusMessage: ANTI_ENUM_MESSAGE,
        expiresInSeconds: config.ttlSeconds,
        retryAfterSeconds: config.cooldownSeconds,
      };
      return jsonSuccess(response);
    }

    const otpResult = await issueEmailOtp({
      customerId: customer.id,
      email: customer.email,
      purpose: "VERIFY_EMAIL",
    });

    if (!otpResult.ok) {
      const message =
        otpResult.reason === "COOLDOWN"
          ? `Please wait ${otpResult.retryAfterSeconds} seconds before requesting another code.`
          : "Too many verification requests. Please try again later.";
      const code =
        otpResult.reason === "COOLDOWN" ? "OtpCooldownActive" : "TooManyOtpRequests";
      return jsonError(message, 429, code);
    }

    try {
      await sendOtpEmail({
        to: customer.email,
        purpose: "VERIFY_EMAIL",
        code: otpResult.code,
        firstName: customer.firstName,
        ttlMinutes: otpResult.ttlMinutes,
      });
    } catch (mailErr: unknown) {
      console.error("[Send Verification Email Error]:", mailErr);
      await revokeUnsentOtp(otpResult.otpId).catch(() => undefined);
      return jsonError(
        "Email service is temporarily unavailable. Please try again shortly.",
        503,
        "EmailServiceUnavailable"
      );
    }

    const response: CustomerSendEmailVerificationRes = {
      statusMessage: ANTI_ENUM_MESSAGE,
      expiresInSeconds: otpResult.expiresInSeconds,
      retryAfterSeconds: otpResult.retryAfterSeconds,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Customer Send Verification Error]:", err);
    return jsonError("Unable to process verification request. Please try again.", 500);
  }
}
