import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { serializeCustomerProfile } from "@/app/lib/v1/auth";
import {
  verifyV1Token,
  signAuthToken,
  signRefreshToken,
} from "@/app/lib/v1/jwt";
import { parseJsonBody } from "@/app/lib/v1/request";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import {
  CustomerCreateMpinReq,
  CustomerCreateMpinRes,
} from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody<CustomerCreateMpinReq>(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  try {
    if (!body?.preAuthToken || !body?.mpin) {
      return jsonError("Please enter your 4-digit MPIN", 400);
    }

    if (!/^\d{4}$/.test(body.mpin)) {
      return jsonError("MPIN must be 4 numbers", 400);
    }

    // ---------------------------------------------------------
    // 1. Auth Validation: Verify cryptographic signature, 5m TTL, & type
    // ---------------------------------------------------------
    const { payload, error } = await verifyV1Token(body.preAuthToken, "PRE_AUTH");
    if (error || !payload || !payload.userId || payload.role !== "CUSTOMER") {
      return jsonError("Please log in again", 401, "Unauthorized");
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Fetch customer by ID & check existence/blacklist status
    //    b. Hash the 4-digit MPIN using bcrypt
    //    c. Update customer record with hashed MPIN and updatedAt
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

    if (customer.mpin) {
      return jsonError(
        "MPIN is already set. Please log in or use MPIN verification.",
        409,
        "Conflict"
      );
    }

    const hashedMpin = await bcrypt.hash(body.mpin, 10);

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        mpin: hashedMpin,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customers.id, payload.userId),
          isNull(customers.mpin),
          eq(customers.blacklisted, false)
        )
      )
      .returning();

    if (!updatedCustomer) {
      return jsonError(
        "MPIN is already set. Please log in or use MPIN verification.",
        409,
        "Conflict"
      );
    }

    // ---------------------------------------------------------
    // 4. Response:
    //    Generate real signed authToken (15m TTL), refreshToken (30d TTL), and profile
    // ---------------------------------------------------------
    const authToken = await signAuthToken({
      userId: updatedCustomer.id,
      role: "CUSTOMER",
      email: updatedCustomer.email,
    });

    const refreshToken = await signRefreshToken({
      userId: updatedCustomer.id,
      role: "CUSTOMER",
      email: updatedCustomer.email,
    });

    const response: CustomerCreateMpinRes = {
      statusMessage: "MPIN created successfully",
      authToken,
      refreshToken,
      customer: serializeCustomerProfile(updatedCustomer),
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Customer Create MPIN Error]:", err);
    return jsonError("Unable to create MPIN. Please try again.", 500);
  }
}
