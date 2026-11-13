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
  CustomerCreateMpinReq,
  CustomerCreateMpinRes,
  CustomerId,
} from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 2. Request Validation: Parse body & validate format
    // ---------------------------------------------------------
    const body = (await request.json()) as CustomerCreateMpinReq;

    if (!body.preAuthToken || !body.mpin) {
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
      .where(eq(customers.id, payload.userId))
      .returning();

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
      customer: {
        id: updatedCustomer.id as CustomerId,
        email: updatedCustomer.email,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        middleInitial: updatedCustomer.middleInitial ?? undefined,
        phoneNumber: updatedCustomer.phoneNumber,
        blacklisted: updatedCustomer.blacklisted,
        blacklistReason: updatedCustomer.blacklistReason,
        createdAt: updatedCustomer.createdAt.toISOString(),
        updatedAt: updatedCustomer.updatedAt.toISOString(),
      },
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
