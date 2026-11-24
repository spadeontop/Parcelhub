import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { serializeCustomerProfile } from "@/app/lib/v1/auth";
import { isEmailEnabled, sendSecurityAlertEmail } from "@/app/lib/v1/email";
import {
  signAuthToken,
  signPreAuthToken,
  signRefreshToken,
  verifyV1Token,
} from "@/app/lib/v1/jwt";
import { parseJsonBody } from "@/app/lib/v1/request";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import type {
  CustomerResetPasswordReq,
  CustomerResetPasswordRes,
} from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody<CustomerResetPasswordReq>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  try {
    const resetToken = parsedBody.data?.resetToken?.trim();
    const newPassword = parsedBody.data?.newPassword;

    if (!resetToken || !newPassword) {
      return jsonError("Reset token and new password are required", 400);
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return jsonError("Password must be at least 6 characters", 400);
    }

    if (Buffer.byteLength(newPassword, "utf-8") > 72) {
      return jsonError("Password must not exceed 72 bytes", 400);
    }

    const { payload, error } = await verifyV1Token(resetToken, "PASSWORD_RESET");
    if (error || !payload || !payload.userId || payload.role !== "CUSTOMER") {
      return jsonError("Invalid or expired reset session. Please request a new code.", 401, "Unauthorized");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date();
    const expectedTv = payload.tv ?? 0;

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        passwordHash,
        tokenVersion: sql`${customers.tokenVersion} + 1`,
        emailVerified: true,
        emailVerifiedAt: sql`COALESCE(${customers.emailVerifiedAt}, ${now.toISOString()})`,
        updatedAt: now,
      })
      .where(
        and(
          eq(customers.id, payload.userId),
          eq(customers.tokenVersion, expectedTv),
          eq(customers.blacklisted, false)
        )
      )
      .returning();

    if (!updatedCustomer) {
      return jsonError(
        "Reset session already used or account unavailable. Please request a new code.",
        401,
        "Unauthorized"
      );
    }

    if (isEmailEnabled()) {
      void sendSecurityAlertEmail({
        to: updatedCustomer.email,
        firstName: updatedCustomer.firstName,
        credentialChanged: "password",
      }).catch((err) => {
        console.error("[Password Reset Security Alert Email Error]:", err);
      });
    }

    const profile = serializeCustomerProfile(updatedCustomer);

    if (!updatedCustomer.mpin) {
      const preAuthToken = await signPreAuthToken({
        userId: updatedCustomer.id,
        role: "CUSTOMER",
        email: updatedCustomer.email,
        tokenVersion: updatedCustomer.tokenVersion,
      });

      const response: CustomerResetPasswordRes = {
        statusMessage: "Password reset successfully",
        preAuthToken,
        requiresMpinCreation: true,
        customer: profile,
      };
      return jsonSuccess(response);
    }

    const authToken = await signAuthToken({
      userId: updatedCustomer.id,
      role: "CUSTOMER",
      email: updatedCustomer.email,
      tokenVersion: updatedCustomer.tokenVersion,
    });

    const refreshToken = await signRefreshToken({
      userId: updatedCustomer.id,
      role: "CUSTOMER",
      email: updatedCustomer.email,
      tokenVersion: updatedCustomer.tokenVersion,
    });

    const response: CustomerResetPasswordRes = {
      statusMessage: "Password reset successfully",
      authToken,
      refreshToken,
      requiresMpinCreation: false,
      customer: profile,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Customer Reset Password Error]:", err);
    return jsonError("Unable to reset password. Please try again.", 500);
  }
}
