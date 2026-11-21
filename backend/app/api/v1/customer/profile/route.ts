import { NextRequest } from "next/server";
import {
  authenticateCustomerRequest,
  customerAuthErrorResponse,
  serializeCustomerProfile,
} from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { CustomerProfileRes } from "@/app/types/v1/api";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateCustomerRequest(request);
    if (!auth.session || !auth.customer) {
      return customerAuthErrorResponse(auth);
    }

    const customer = auth.customer;

    if (customer.blacklisted) {
      return jsonError(
        `Account suspended: ${customer.blacklistReason || "Please contact support"}`,
        403,
        "Forbidden"
      );
    }

    const response: CustomerProfileRes = {
      statusMessage: "Profile retrieved successfully",
      customer: serializeCustomerProfile(customer),
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to retrieve profile. Please try again.", 500);
  }
}
