import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { isUniqueViolation } from "@/app/lib/v1/db-errors";
import { sendOtpEmail } from "@/app/lib/v1/email";
import {
  getOtpConfig,
  isValidEmailFormat,
  issueEmailOtp,
  normalizeEmail,
  revokeUnsentOtp,
} from "@/app/lib/v1/otp";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { CustomerRegisterReq, CustomerRegisterRes } from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  let body: CustomerRegisterReq;
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation: None (Public registration route)
    // ---------------------------------------------------------

    // ---------------------------------------------------------
    // 2. Request Validation: Parse and validate required fields
    // ---------------------------------------------------------
    body = (await request.json()) as CustomerRegisterReq;
  } catch {
    return jsonError("Invalid request body", 400);
  }

  try {
    const email = body?.email ? normalizeEmail(body.email) : "";
    const password = body?.password;
    const firstName = body?.firstName?.trim();
    const lastName = body?.lastName?.trim();
    const phoneNumber = body?.phoneNumber?.trim();
    const middleInitial = body?.middleInitial?.trim() || null;

    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return jsonError("Missing required registration fields", 400);
    }

    if (!isValidEmailFormat(email)) {
      return jsonError("Invalid email format", 400);
    }

    if (typeof password !== "string" || password.length < 6) {
      return jsonError("Password must be at least 6 characters", 400);
    }

    if (Buffer.byteLength(password, "utf-8") > 72) {
      return jsonError("Password must not exceed 72 bytes", 400);
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Fast-path check if email already registered in DB (avoids wasted bcrypt work)
    //    b. Hash password using bcrypt (cost 10)
    //    c. Insert new record into customers table, handling concurrent unique violations
    // ---------------------------------------------------------
    const existing = await db.query.customers.findFirst({
      where: eq(customers.email, email),
      columns: { id: true, emailVerified: true },
    });

    if (existing) {
      if (!existing.emailVerified) {
        return jsonError(
          "An account with this email is pending verification. Please check your email or request a new verification code.",
          409,
          "EmailPendingVerification"
        );
      }
      return jsonError("Customer with this email already exists", 409, "Conflict");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let newCustomer: typeof customers.$inferSelect;
    try {
      [newCustomer] = await db
        .insert(customers)
        .values({
          email,
          passwordHash,
          firstName,
          lastName,
          middleInitial,
          phoneNumber,
        })
        .returning();
    } catch (insertErr: unknown) {
      if (isUniqueViolation(insertErr)) {
        return jsonError("Customer with this email already exists", 409, "Conflict");
      }
      throw insertErr;
    }

    // ---------------------------------------------------------
    // 4. Issue VERIFY_EMAIL OTP & dispatch verification email
    //    (Hard-locked: NO preAuthToken returned until email is verified)
    // ---------------------------------------------------------
    const otpConfig = getOtpConfig();
    const otpResult = await issueEmailOtp({
      customerId: newCustomer.id,
      email: newCustomer.email,
      purpose: "VERIFY_EMAIL",
      bypassRateLimit: true,
    });

    let verificationEmailSent = false;
    if (otpResult.ok) {
      try {
        await sendOtpEmail({
          to: newCustomer.email,
          purpose: "VERIFY_EMAIL",
          code: otpResult.code,
          firstName: newCustomer.firstName,
          ttlMinutes: otpResult.ttlMinutes,
        });
        verificationEmailSent = true;
      } catch (mailErr: unknown) {
        console.error("[Customer Register Email Send Error]:", mailErr);
        await revokeUnsentOtp(otpResult.otpId).catch(() => undefined);
      }
    }

    const response: CustomerRegisterRes = {
      statusMessage: verificationEmailSent
        ? "Registration successful. Please verify your email address."
        : "Account created, but we could not send the verification email. Please request a new code.",
      emailVerificationRequired: true,
      email: newCustomer.email,
      verificationEmailSent,
      expiresInSeconds: otpConfig.ttlSeconds,
      retryAfterSeconds: otpConfig.cooldownSeconds,
    };

    return jsonSuccess(response, 201);
  } catch (err: unknown) {
    console.error("[Customer Register Error]:", err);
    return jsonError("Unable to complete registration. Please try again.", 500);
  }
}
