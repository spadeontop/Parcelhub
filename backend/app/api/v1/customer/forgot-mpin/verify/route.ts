import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { signMpinResetToken } from "@/app/lib/v1/jwt";
import {
  isValidEmailFormat,
  normalizeEmail,
  verifyAndConsumeEmailOtp,
} from "@/app/lib/v1/otp";
import { parseJsonBody } from "@/app/lib/v1/request";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import type {
  CustomerVerifyMpinResetOtpReq,
  CustomerVerifyMpinResetOtpRes,
} from "@/app/types/v1/api";

const INVALID_OTP_MESSAGE =
  "Invalid or expired verification code. Please try again or request a new code.";

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody<CustomerVerifyMpinResetOtpReq>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  try {
    const email = parsedBody.data?.email ? normalizeEmail(parsedBody.data.email) : "";
    const code = typeof parsedBody.data?.code === "string" ? parsedBody.data.code.trim() : "";

    if (!email || !isValidEmailFormat(email) || !/^\d{6}$/.test(code)) {
      return jsonError(INVALID_OTP_MESSAGE, 400, "InvalidOrExpiredOtp");
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, email),
      columns: {
        id: true,
        email: true,
        tokenVersion: true,
        blacklisted: true,
      },
    });

    if (!customer || customer.blacklisted) {
      return jsonError(INVALID_OTP_MESSAGE, 400, "InvalidOrExpiredOtp");
    }

    const verified = await verifyAndConsumeEmailOtp({
      email,
      purpose: "FORGOT_MPIN",
      code,
    });

    if (!verified.ok) {
      return jsonError(INVALID_OTP_MESSAGE, 400, "InvalidOrExpiredOtp");
    }

    const resetToken = await signMpinResetToken({
      userId: customer.id,
      email: customer.email,
      tokenVersion: customer.tokenVersion,
    });

    const response: CustomerVerifyMpinResetOtpRes = {
      statusMessage: "Verification code confirmed",
      resetToken,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Customer Forgot MPIN Verify Error]:", err);
    return jsonError("Unable to verify reset code. Please try again.", 500);
  }
}
