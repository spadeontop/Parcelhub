import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import {
  verifyV1Token,
  signAuthToken,
  signRefreshToken,
} from "@/app/lib/v1/jwt";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerVerifyMpinReq,
  CustomerVerifyMpinRes,
  CustomerId,
} from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 2. Request Validation: Parse body & validate format
    // ---------------------------------------------------------
    const body = (await request.json()) as CustomerVerifyMpinReq;

    if (!body.preAuthToken || !body.mpin) {
      return jsonError("preAuthToken and 4-digit mpin are required", 400);
    }

    if (!/^\d{4}$/.test(body.mpin)) {
      return jsonError("MPIN must be exactly 4 digits", 400);
    }

    // ---------------------------------------------------------
    // 1. Auth Validation: Verify cryptographic signature, 5m TTL, & type
    // ---------------------------------------------------------
    const { payload, error } = await verifyV1Token(body.preAuthToken, "PRE_AUTH");
    if (error || !payload || !payload.userId || payload.role !== "CUSTOMER") {
      return jsonError(error || "Invalid or expired preAuthToken", 401, "Unauthorized");
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Fetch customer from DB
    //    b. Check existence & blacklist status
    //    c. Guard against unset MPIN
    //    d. Strict bcrypt comparison
    // ---------------------------------------------------------
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, payload.userId),
    });

    if (!customer) {
      return jsonError("Customer not found", 404, "Not Found");
    }

    if (customer.blacklisted) {
      return jsonError(
        `Account is blacklisted: ${customer.blacklistReason || "Contact support"}`,
        403,
        "Forbidden"
      );
    }

    if (!customer.mpin) {
      return jsonError("MPIN has not been set up. Please call create-mpin first.", 400);
    }

    const isMpinValid = await bcrypt.compare(body.mpin, customer.mpin);
    if (!isMpinValid) {
      return jsonError("Invalid MPIN", 401, "Unauthorized");
    }

    // ---------------------------------------------------------
    // 4. Response:
    //    Issue real signed authToken (15m), refreshToken (30d), and sanitized profile
    // ---------------------------------------------------------
    const authToken = await signAuthToken({
      userId: customer.id,
      role: "CUSTOMER",
      email: customer.email,
    });

    const refreshToken = await signRefreshToken({
      userId: customer.id,
      role: "CUSTOMER",
      email: customer.email,
    });

    const response: CustomerVerifyMpinRes = {
      statusMessage: "MPIN verified",
      authToken,
      refreshToken,
      customer: {
        id: customer.id as CustomerId,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        middleInitial: customer.middleInitial ?? undefined,
        phoneNumber: customer.phoneNumber,
        blacklisted: customer.blacklisted,
        blacklistReason: customer.blacklistReason,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      },
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}

