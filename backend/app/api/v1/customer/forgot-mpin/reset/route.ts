import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { serializeCustomerProfile } from "@/app/lib/v1/auth";
import { isEmailEnabled, sendSecurityAlertEmail } from "@/app/lib/v1/email";
import {
  signAuthToken,
  signRefreshToken,
  verifyV1Token,
} from "@/app/lib/v1/jwt";
import { parseJsonBody } from "@/app/lib/v1/request";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import type {
  CustomerResetMpinReq,
  CustomerResetMpinRes,
} from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody<CustomerResetMpinReq>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  try {
    const resetToken = parsedBody.data?.resetToken?.trim();
    const newMpin = parsedBody.data?.newMpin;

    if (!resetToken || !newMpin) {
      return jsonError("Reset token and new 4-digit MPIN are required", 400);
    }

    if (!/^\d{4}$/.test(newMpin)) {
      return jsonError("MPIN must be 4 numbers", 400);
    }

    const { payload, error } = await verifyV1Token(resetToken, "MPIN_RESET");
    if (error || !payload || !payload.userId || payload.role !== "CUSTOMER") {
      return jsonError("Invalid or expired reset session. Please request a new code.", 401, "Unauthorized");
    }

    const hashedMpin = await bcrypt.hash(newMpin, 10);
    const now = new Date();
    const expectedTv = payload.tv ?? 0;

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        mpin: hashedMpin,
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
        credentialChanged: "MPIN",
      }).catch((err) => {
        console.error("[MPIN Reset Security Alert Email Error]:", err);
      });
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

    const response: CustomerResetMpinRes = {
      statusMessage: "MPIN reset successfully",
      authToken,
      refreshToken,
      customer: serializeCustomerProfile(updatedCustomer),
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Customer Reset MPIN Error]:", err);
    return jsonError("Unable to reset MPIN. Please try again.", 500);
  }
}
