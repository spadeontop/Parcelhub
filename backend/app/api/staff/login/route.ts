import { NextRequest } from "next/server";
import { generateMockToken } from "@/app/lib/auth";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { db } from "@/app/lib/store";
import { StaffLoginReq, StaffLoginRes } from "@/app/types/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StaffLoginReq;

    if (!body.email || !body.password) {
      return jsonError("Email and password are required", 400);
    }

    const staffMember = await db.getStaffByEmail(body.email);
    if (!staffMember || staffMember.passwordHash !== body.password) {
      return jsonError("Invalid staff credentials", 401, "Unauthorized");
    }

    const authToken = generateMockToken({
      userId: staffMember.id,
      role: "STAFF",
      email: staffMember.email,
    });
    const refreshToken = `refresh_${authToken}`;

    const response: StaffLoginRes = {
      statusMessage: "Staff login successful",
      authToken,
      refreshToken,
    };

    return jsonSuccess(response);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
