import { NextRequest } from "next/server";
import { decodeToken, generateMockToken } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { CustomerCreateMpinReq, CustomerCreateMpinRes, CustomerId, MPIN } from "@/app/types/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CustomerCreateMpinReq;

    if (!body.preAuthToken || !body.mpin) {
      return jsonError("preAuthToken and 4-digit mpin are required", 400);
    }

    if (!/^\d{4}$/.test(body.mpin)) {
      return jsonError("MPIN must be exactly 4 digits", 400);
    }

    const session = decodeToken(body.preAuthToken);
    if (!session || !session.userId) {
      return jsonError("Invalid or expired preAuthToken", 401, "Unauthorized");
    }

    const success = db.setCustomerMpin(session.userId as CustomerId, body.mpin as MPIN);
    if (!success) {
      return jsonError("Customer not found", 404, "Not Found");
    }

    const customer = db.getCustomerById(session.userId as CustomerId);

    const authToken = generateMockToken({
      userId: session.userId,
      role: "CUSTOMER",
      email: session.email,
    });
    const refreshToken = `refresh_${authToken}`;

    const response: CustomerCreateMpinRes = {
      statusMessage: "MPIN created successfully",
      authToken,
      refreshToken,
      ...(customer && {
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          middleInitial: customer.middleInitial,
          phoneNumber: customer.phoneNumber,
        },
      }),
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
