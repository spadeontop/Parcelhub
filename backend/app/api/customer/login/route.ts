import { NextRequest } from "next/server";
import { generateMockToken } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { CustomerLoginReq, CustomerLoginRes } from "@/app/types/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CustomerLoginReq;

    if (!body.email || !body.password) {
      return jsonError("Email and password are required", 400);
    }

    const customer = db.getCustomerByEmail(body.email);
    if (!customer || customer.passwordHash !== body.password) {
      return jsonError("Invalid email or password", 401, "Unauthorized");
    }

    if (customer.blacklisted) {
      return jsonError(`Account is blacklisted: ${customer.blacklistReason || "Contact support"}`, 403, "Forbidden");
    }

    const preAuthToken = generateMockToken({
      userId: customer.id,
      role: "CUSTOMER",
      email: customer.email,
      isPreAuth: true,
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
