import { NextRequest } from "next/server";
import { generateMockToken } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { CustomerRegisterReq, CustomerRegisterRes } from "@/app/types/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CustomerRegisterReq;

    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.phoneNumber) {
      return jsonError("Missing required registration fields", 400);
    }

    const existing = await db.getCustomerByEmail(body.email);
    if (existing) {
      return jsonError("Customer with this email already exists", 409, "Conflict");
    }

    const customer = await db.registerCustomer({
      email: body.email,
      passwordHash: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      middleInitial: body.middleInitial,
      phoneNumber: body.phoneNumber,
    });

    const preAuthToken = generateMockToken({
      userId: customer.id,
      role: "CUSTOMER",
      email: customer.email,
      isPreAuth: true,
    });

    const response: CustomerRegisterRes = {
      statusMessage: "Registration successful",
      preAuthToken,
    };

    return jsonSuccess(response, 201);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
