import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { signStaffAuthToken, signStaffRefreshToken } from "@/app/lib/v1/jwt";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { StaffLoginReq, StaffLoginRes } from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation:
    //    Public endpoint (No Bearer token required for login)
    // ---------------------------------------------------------

    // ---------------------------------------------------------
    // 2. Request Validation:
    //    Parse JSON body & validate required credentials
    // ---------------------------------------------------------
    const body = (await request.json()) as StaffLoginReq;

    const username = body.username?.trim().toLowerCase();
    const password = body.password;

    if (!username || !password) {
      return jsonError("Username and password are required", 400);
    }

    // ---------------------------------------------------------
    // 3. Business Logic:
    //    a. Look up staff record by username
    //    b. Verify password with bcrypt
    //    c. Mint independent HS256 authToken (15m) & refreshToken (30d)
    // ---------------------------------------------------------
    const staffMember = await db.query.staff.findFirst({
      where: eq(staff.username, username),
    });

    if (!staffMember) {
      // Prevents username enumeration while providing clear unauthorized status
      return jsonError("Invalid username or password", 401, "Unauthorized");
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, staffMember.passwordHash);
    } catch {
      // If passwordHash in DB is not a valid bcrypt hash, treat as invalid credentials
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      return jsonError("Invalid username or password", 401, "Unauthorized");
    }

    const [authToken, refreshToken] = await Promise.all([
      signStaffAuthToken({
        userId: staffMember.id,
        role: "STAFF",
        username: staffMember.username,
      }),
      signStaffRefreshToken({
        userId: staffMember.id,
        role: "STAFF",
        username: staffMember.username,
      }),
    ]);

    // ---------------------------------------------------------
    // 4. Response:
    //    Return status 200 with standard StaffLoginRes contract
    // ---------------------------------------------------------
    const response: StaffLoginRes = {
      statusMessage: "Staff login successful",
      authToken,
      refreshToken,
    };

    return jsonSuccess(response);
  } catch (err: unknown) {
    console.error("[Staff Login Error]:", err);
    if (err instanceof SyntaxError) {
      return jsonError("Invalid JSON request body", 400);
    }
    return jsonError(
      "Internal server error during staff authentication",
      500,
      "Internal Server Error"
    );
  }
}
