import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { signPreAuthToken } from "@/app/lib/v1/jwt";
import {
  isValidEmailFormat,
  normalizeEmail,
  verifyAndConsumeEmailOtp,
} from "@/app/lib/v1/otp";
import { parseJsonBody } from "@/app/lib/v1/request";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import type {
  CustomerVerifyEmailReq,
  CustomerVerifyEmailRes,
} from "@/app/types/v1/api";

const INVALID_OTP_MESSAGE =
  "Invalid or expired verification code. Please try again or request a new code.";

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody<CustomerVerifyEmailReq>(request);
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
    });

    if (!customer || customer.blacklisted) {
      return jsonError(INVALID_OTP_MESSAGE, 400, "InvalidOrExpiredOtp");
    }

    const verified = await verifyAndConsumeEmailOtp({
      email,
      purpose: "VERIFY_EMAIL",
      code,
    });

    if (!verified.ok) {
      return jsonError(INVALID_OTP_MESSAGE, 400, "InvalidOrExpiredOtp");
    }

    const now = new Date();
    const [updatedCustomer] = await db
      .update(customers)
      .set({
        emailVerified: true,
        emailVerifiedAt: customer.emailVerifiedAt ?? now,
        updatedAt: now,
      })
      .where(and(eq(customers.id, customer.id), eq(customers.blacklisted, false)))
      .returning();

    if (!updatedCustomer) {
      return jsonError(INVALID_OTP_MESSAGE, 400, "InvalidOrExpiredOtp");
    }

    const preAuthToken = await signPreAuthToken({
      userId: updatedCustomer.id,
      role: "CUSTOMER",
      email: updatedCustomer.email,
      tokenVersion: updatedCustomer.tokenVersion,
    });

    const response: CustomerVerifyEmailRes = {
      statusMessage: "Email verified successfully",
      emailVerified: true,
      hasMpin: Boolean(updatedCustomer.mpin),
      preAuthToken,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Customer Verify Email Error]:", err);
    return jsonError("Unable to verify email. Please try again.", 500);
  }
}
