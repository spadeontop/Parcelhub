import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { signPreAuthToken } from "@/app/lib/v1/jwt";
import { normalizeEmail } from "@/app/lib/v1/otp";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { CustomerLoginReq, CustomerLoginRes } from "@/app/types/v1/api";

// Constant valid bcrypt cost-10 hash used to equalize login timing when email is not found
const DUMMY_BCRYPT_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8h7Z4M8E9vQ8h2mL1P0z7n4q8uR2yW";

export async function POST(request: NextRequest) {
  let body: CustomerLoginReq;
  try {
    body = (await request.json()) as CustomerLoginReq;
  } catch {
    return jsonError("Invalid request body", 400);
  }

  try {
    if (!body?.email || !body?.password) {
      return jsonError("Email and password are required", 400);
    }

    const emailTrimmed = normalizeEmail(body.email);

    // Query real DB using drizzle
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, emailTrimmed),
    });

    // Always run bcrypt.compare to neutralize user-enumeration timing attacks
    const hashToCompare = customer?.passwordHash ?? DUMMY_BCRYPT_HASH;
    const isPasswordValid = await bcrypt.compare(body.password, hashToCompare);
    if (!customer || !isPasswordValid) {
      return jsonError("Invalid email or password", 401, "Unauthorized");
    }

    if (customer.blacklisted) {
      return jsonError(
        `Account is blacklisted: ${customer.blacklistReason || "Contact support"}`,
        403,
        "Forbidden"
      );
    }

    if (!customer.emailVerified) {
      return jsonError(
        "Please verify your email address to continue.",
        403,
        "EmailNotVerified"
      );
    }

    // Cryptographic preAuthToken with strict 5-minute TTL
    const preAuthToken = await signPreAuthToken({
      userId: customer.id,
      role: "CUSTOMER",
      email: customer.email,
      tokenVersion: customer.tokenVersion,
    });

    const response: CustomerLoginRes = {
      statusMessage: "Credentials verified",
      preAuthToken,
      hasMpin: Boolean(customer.mpin),
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Customer Login Error]:", err);
    return jsonError("Unable to log in. Please try again.", 500, "Internal Server Error");
  }
}
