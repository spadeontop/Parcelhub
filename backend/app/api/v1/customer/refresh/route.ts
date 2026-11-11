import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { verifyV1Token, signAuthToken } from "@/app/lib/v1/jwt";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerRefreshTokenReq,
  CustomerRefreshTokenRes,
} from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 2. Request Validation: Parse body & check required fields
    // ---------------------------------------------------------
    const body = (await request.json()) as CustomerRefreshTokenReq;

    const refreshToken = body.refreshToken?.trim();
    const mpin = body.mpin?.trim();

    if (!refreshToken || !mpin) {
      return jsonError("Please enter your 4-digit MPIN", 400);
    }

    if (!/^\d{4}$/.test(mpin)) {
      return jsonError("MPIN must be 4 numbers", 400);
    }

    // ---------------------------------------------------------
    // 1. Auth Validation: Cryptographic verify (HS256, type: REFRESH, 30d TTL)
    // ---------------------------------------------------------
    const { payload, error } = await verifyV1Token(refreshToken, "REFRESH");
    if (error || !payload || !payload.userId || payload.role !== "CUSTOMER") {
      return jsonError("Session expired. Please log in again", 401, "Unauthorized");
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Fetch customer from DB
    //    b. Verify existence & check if suspended/blacklisted
    //    c. Guard against unset MPIN
    //    d. Verify 4-digit MPIN against bcrypt hash
    //    e. Issue fresh 15-minute authToken
    // ---------------------------------------------------------
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, payload.userId),
    });

    if (!customer) {
      return jsonError("Account not found", 404, "Not Found");
    }

    if (customer.blacklisted) {
      return jsonError(
        `Account suspended: ${customer.blacklistReason || "Please contact support"}`,
        403,
        "Forbidden"
      );
    }

    if (!customer.mpin) {
      return jsonError("Please set up your MPIN first", 400);
    }

    const isMpinValid = await bcrypt.compare(mpin, customer.mpin);
    if (!isMpinValid) {
      return jsonError("Incorrect MPIN", 401, "Unauthorized");
    }

    const authToken = await signAuthToken({
      userId: customer.id,
      role: "CUSTOMER",
      email: customer.email,
    });

    // ---------------------------------------------------------
    // 4. Response:
    //    Return fresh 15-minute authToken
    // ---------------------------------------------------------
    const response: CustomerRefreshTokenRes = {
      statusMessage: "Unlocked successfully",
      authToken,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Please log in again", 400);
  }
}
