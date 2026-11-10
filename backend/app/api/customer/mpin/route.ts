import { NextRequest } from "next/server";
import { decodeToken, generateMockToken } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { CustomerId, CustomerVerifyMpinReq, CustomerVerifyMpinRes } from "@/app/types/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CustomerVerifyMpinReq;

    if (!body.preAuthToken || !body.mpin) {
      return jsonError("preAuthToken and 4-digit mpin are required", 400);
    }

    const session = decodeToken(body.preAuthToken);
    if (!session || !session.userId) {
      return jsonError("Invalid or expired preAuthToken", 401, "Unauthorized");
    }

    const customer = await db.getCustomerById(session.userId as CustomerId);
    if (!customer) {
      return jsonError("Customer not found", 404, "Not Found");
    }

    if (customer.mpin !== body.mpin) {
      return jsonError("Invalid MPIN", 401, "Unauthorized");
    }

    const authToken = generateMockToken({
      userId: session.userId,
      role: "CUSTOMER",
      email: session.email,
    });
    const refreshToken = `refresh_${authToken}`;

    const response: CustomerVerifyMpinRes = {
      statusMessage: "MPIN verified",
      authToken,
      refreshToken,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        middleInitial: customer.middleInitial,
        phoneNumber: customer.phoneNumber,
      },
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
