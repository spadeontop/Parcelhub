import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { CustomerId, CustomerProfileRes } from "@/app/types/api";

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request, ["CUSTOMER", "ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const customer = db.getCustomerById(auth.session.userId as CustomerId);
  if (!customer) {
    return jsonError("Customer not found", 404, "Not Found");
  }

  const response: CustomerProfileRes = {
    statusMessage: "Profile retrieved successfully",
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
}
