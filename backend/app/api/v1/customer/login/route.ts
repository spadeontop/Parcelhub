import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { signPreAuthToken } from "@/app/lib/v1/jwt";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { CustomerLoginReq, CustomerLoginRes } from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CustomerLoginReq;

    if (!body.email || !body.password) {
      return jsonError("Email and password are required", 400);
    }

    const emailTrimmed = body.email.trim().toLowerCase();

    // Query real DB using drizzle
    const customer = await db.query.customers.findFirst({
      where: eq(customers.email, emailTrimmed),
    });

    if (!customer) {
      return jsonError("Email is not registered", 404, "Not Found");
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(body.password, customer.passwordHash);
    if (!isPasswordValid) {
      return jsonError("Incorrect password", 401, "Unauthorized");
    }

    if (customer.blacklisted) {
      return jsonError(
        `Account is blacklisted: ${customer.blacklistReason || "Contact support"}`,
        403,
        "Forbidden"
      );
    }

    // Cryptographic preAuthToken with strict 5-minute TTL
    const preAuthToken = await signPreAuthToken({
      userId: customer.id,
      role: "CUSTOMER",
      email: customer.email,
    });

    const response: CustomerLoginRes = {
      statusMessage: "Credentials verified",
      preAuthToken,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
