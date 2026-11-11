import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { decodeToken, generateMockToken } from "@/app/lib/auth";
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
      return jsonError("preAuthToken and 4-digit mpin are required", 400);
    }

    if (!/^\d{4}$/.test(body.mpin)) {
      return jsonError("MPIN must be exactly 4 digits", 400);
    }

    // ---------------------------------------------------------
    // 1. Auth Validation: Verify preAuthToken & ensure isPreAuth is true
    // ---------------------------------------------------------
    const session = decodeToken(body.preAuthToken);
    if (!session || !session.userId || session.isPreAuth !== true || session.role !== "CUSTOMER") {
      return jsonError("Invalid or expired preAuthToken", 401, "Unauthorized");
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Fetch customer by ID & check existence/blacklist status
    //    b. Hash the 4-digit MPIN using bcrypt
    //    c. Update customer record with hashed MPIN and updatedAt
    // ---------------------------------------------------------
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, session.userId),
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

    const hashedMpin = await bcrypt.hash(body.mpin, 10);

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        mpin: hashedMpin,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, session.userId))
      .returning();

    // ---------------------------------------------------------
    // 4. Response:
    //    Generate full session auth token, refresh token, and customer profile
    // ---------------------------------------------------------
    const authToken = generateMockToken({
      userId: updatedCustomer.id,
      role: "CUSTOMER",
      email: updatedCustomer.email,
    });
    const refreshToken = `refresh_${authToken}`;

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

