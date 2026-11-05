import { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { AdminCreateStaffReq, AdminCreateStaffRes } from "@/app/types/api";

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request, ["ADMIN"]);
  if (!auth.session) {
    return jsonError(auth.error || "Unauthorized", 401, "Unauthorized");
  }

  try {
    const body = (await request.json()) as AdminCreateStaffReq;

    if (!body.email || !body.password || !body.firstName || !body.lastName || !body.phoneNumber) {
      return jsonError("Missing required staff fields", 400);
    }

    const existing = db.getStaffByEmail(body.email);
    if (existing) {
      return jsonError("Staff account with this email already exists", 409, "Conflict");
    }

    const newStaff = db.createStaff({
      email: body.email,
      passwordHash: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      middleInitial: body.middleInitial,
      phoneNumber: body.phoneNumber,
    });

    const response: AdminCreateStaffRes = {
      statusMessage: "Staff account created",
      staffId: newStaff.id,
    };

    return jsonSuccess(response, 201);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
