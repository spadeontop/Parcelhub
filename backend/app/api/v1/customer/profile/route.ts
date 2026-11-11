import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { authenticateV1Request } from "@/app/lib/v1/jwt";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { CustomerId, CustomerProfileRes } from "@/app/types/v1/api";

export async function GET(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation:
    //    Verify Authorization: Bearer <authToken> (HS256, 15m TTL)
    //    Ensure strictly 'CUSTOMER' role and no pre-auth token
    // ---------------------------------------------------------
    const auth = await authenticateV1Request(request, ["CUSTOMER"]);
    if (!auth.session) {
      if (auth.status === 403) {
        return jsonError("Access denied", 403, "Forbidden");
      }
      return jsonError("Please log in again", 401, "Unauthorized");
    }

    // ---------------------------------------------------------
    // 2. Request Validation:
    //    GET request takes no body or required params
    // ---------------------------------------------------------

    // ---------------------------------------------------------
    // 3. Logic:
    //    Fetch customer from DB by session.userId & verify status
    // ---------------------------------------------------------
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, auth.session.userId),
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

