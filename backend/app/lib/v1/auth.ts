import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff, StaffRow } from "@/db/schema";
import { verifyStaffToken, V1StaffTokenPayload } from "./jwt";

export interface AuthenticatedStaffResult {
  session: V1StaffTokenPayload | null;
  staff?: StaffRow;
  error?: string;
  status: number;
}

/**
 * Validates the Staff JWT Bearer token and checks against the DB
 * to ensure the staff account exists, is valid, and returns the Staff record.
 * Completely independent from customer authentication.
 */
export async function authenticateStaffRequest(
  request: Request,
  allowedRoles: ("STAFF")[] = ["STAFF"]
): Promise<AuthenticatedStaffResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return { session: null, error: "Missing Authorization Bearer token", status: 401 };
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return { session: null, error: "Invalid Authorization header format", status: 401 };
  }

  const token = parts[1];
  const { payload, error } = await verifyStaffToken(token, "AUTH");

  if (error || !payload) {
    return { session: null, error: error || "Invalid or expired token", status: 401 };
  }

  if (!allowedRoles.includes(payload.role)) {
    return {
      session: null,
      error: "Forbidden: insufficient permissions for this resource",
      status: 403,
    };
  }

  try {
    const staffMember = await db.query.staff.findFirst({
      where: eq(staff.id, payload.userId),
    });

    if (!staffMember) {
      return {
        session: null,
        error: "Unauthorized: Staff account no longer exists in database",
        status: 401,
      };
    }

    return {
      session: payload,
      staff: staffMember,
      status: 200,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Database error verifying staff account";
    return {
      session: null,
      error: errorMsg,
      status: 500,
    };
  }
}
