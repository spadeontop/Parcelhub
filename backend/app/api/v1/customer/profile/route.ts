import { NextRequest } from "next/server";
import { authenticateCustomerRequest } from "@/app/lib/v1/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { CustomerId, CustomerProfileRes } from "@/app/types/v1/api";

export async function GET(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation:
    //    Verify Authorization: Bearer <authToken> (HS256, 15m TTL)
    //    Ensure strictly 'CUSTOMER' role and check DB user existence
    // ---------------------------------------------------------
    const auth = await authenticateCustomerRequest(request);
    if (!auth.session || !auth.customer) {
      if (auth.status === 403) {
        return jsonError("Access denied", 403, "Forbidden");
      }
      if (auth.status === 404) {
        return jsonError("Account not found", 404, "Not Found");
      }
      return jsonError("Please log in again", 401, "Unauthorized");
    }

    const customer = auth.customer;

    if (customer.blacklisted) {
      return jsonError(
        `Account suspended: ${customer.blacklistReason || "Please contact support"}`,
        403,
        "Forbidden"
      );
    }

    // ---------------------------------------------------------
    // 4. Response:
    //    Return sanitized profile without passwordHash or MPIN
    // ---------------------------------------------------------
    const response: CustomerProfileRes = {
      statusMessage: "Profile retrieved successfully",
      customer: {
        id: customer.id as CustomerId,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        middleInitial: customer.middleInitial ?? undefined,
        phoneNumber: customer.phoneNumber,
        blacklisted: customer.blacklisted,
        blacklistReason: customer.blacklistReason,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      },
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Unable to retrieve profile. Please try again.", 500);
  }
}

