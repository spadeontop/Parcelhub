import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { AdminBlacklistCustomerReq, AdminBlacklistCustomerRes, CustomerId } from "@/app/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = authenticateRequest(request, ["ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  const { id } = await params;
  const customer = await db.getCustomerById(id as CustomerId);
  if (!customer) {
    return jsonError("Customer not found", 404, "Not Found");
  }

  try {
    const body = (await request.json()) as AdminBlacklistCustomerReq;
    if (!body.reason) {
      return jsonError("Reason for blacklisting is required", 400);
    }

    await db.blacklistCustomer(id as CustomerId, body.reason);

    const response: AdminBlacklistCustomerRes = {
      statusMessage: "Customer successfully blacklisted",
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
