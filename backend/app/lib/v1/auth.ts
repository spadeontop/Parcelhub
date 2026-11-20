import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, CustomerRow, staff, StaffRow } from "@/db/schema";
import { jsonError } from "@/app/lib/response";
import {
  authenticateV1Request,
  V1TokenPayload,
  verifyStaffToken,
  V1StaffTokenPayload,
  verifyV1Token,
} from "./jwt";

export type SafeCustomerRow = Omit<CustomerRow, "passwordHash" | "mpin">;
export type SafeStaffRow = Omit<StaffRow, "passwordHash">;

export interface AuthenticatedCustomerResult {
  session: V1TokenPayload | null;
  customer?: SafeCustomerRow;
  error?: string;
  status: number;
}

export interface AuthenticatedStaffResult {
  session: V1StaffTokenPayload | null;
  staff?: SafeStaffRow;
  error?: string;
  status: number;
}

export interface BlacklistCheckResult {
  isBlacklisted: boolean;
  reason?: string | null;
}

/**
 * Validates the JWT Bearer token and checks against the DB to ensure
 * the customer account exists and is valid.
 * (Note: Does not reject blacklisted users here so that existing orders can still be claimed/viewed
 * even if staff blacklisted them; blacklist checks should be applied selectively e.g. on new order initialization).
 */
export async function authenticateCustomerRequest(
  request: Request
): Promise<AuthenticatedCustomerResult> {
  const auth = await authenticateV1Request(request, ["CUSTOMER"]);
  if (!auth.session) {
    return { session: null, error: auth.error, status: auth.status };
  }

  try {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, auth.session.userId),
      columns: {
        passwordHash: false,
        mpin: false,
      },
    });

    if (!customer) {
      return {
        session: null,
        error: "Account not found or has been removed",
        status: 404,
      };
    }

    return {
      session: auth.session,
      customer,
      status: 200,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Database error verifying customer";
    return {
      session: null,
      error: errorMsg,
      status: 500,
    };
  }
}

/**
 * Maps an unsuccessful `authenticateCustomerRequest` result to the standardized HTTP error response,
 * preserving 500 DB errors instead of misreporting them as 401 session expirations.
 */
export function customerAuthErrorResponse(auth: AuthenticatedCustomerResult) {
  if (auth.status === 403) {
    return jsonError("Access denied", 403, "Forbidden");
  }
  if (auth.status === 404) {
    return jsonError("Account not found", 404, "Not Found");
  }
  if (auth.status >= 500) {
    return jsonError(
      "Service temporarily unavailable. Please try again.",
      500,
      "Internal Server Error"
    );
  }
  return jsonError("Please log in again", 401, "Unauthorized");
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
      columns: {
        passwordHash: false,
      },
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

/**
 * Checks whether the customer is marked as blacklisted in the DB.
 */
export async function checkCustomerBlacklisted(
  customerId: string
): Promise<BlacklistCheckResult> {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
    columns: {
      blacklisted: true,
      blacklistReason: true,
    },
  });

  if (!customer) {
    return { isBlacklisted: false };
  }

  return {
    isBlacklisted: !!customer.blacklisted,
    reason: customer.blacklistReason,
  };
}

export interface AnyV1Session {
  userId: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
}

/**
 * Authenticates either a Customer, Staff, or Admin JWT Bearer token.
 */
export async function authenticateAnyV1User(
  request: Request
): Promise<{ session: AnyV1Session | null; error?: string; status: number }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return { session: null, error: "Missing Authorization Bearer token", status: 401 };
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return { session: null, error: "Invalid Authorization header format", status: 401 };
  }

  const token = parts[1];

  // 1. Verify HS256 AUTH token and enforce DB existence per role
  const authResult = await verifyV1Token(token, "AUTH");
  if (authResult.payload && !authResult.payload.isPreAuth) {
    if (authResult.payload.role === "CUSTOMER") {
      try {
        const existingCustomer = await db.query.customers.findFirst({
          where: eq(customers.id, authResult.payload.userId),
          columns: { id: true },
        });
        if (!existingCustomer) {
          return {
            session: null,
            error: "Unauthorized: Account no longer exists in database",
            status: 401,
          };
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Database error verifying customer account";
        return { session: null, error: errorMsg, status: 500 };
      }
    } else if (authResult.payload.role === "STAFF") {
      try {
        const existingStaff = await db.query.staff.findFirst({
          where: eq(staff.id, authResult.payload.userId),
          columns: { id: true },
        });
        if (!existingStaff) {
          return {
            session: null,
            error: "Unauthorized: Staff account no longer exists in database",
            status: 401,
          };
        }
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Database error verifying staff account";
        return { session: null, error: errorMsg, status: 500 };
      }
    }

    return {
      session: {
        userId: authResult.payload.userId,
        role: authResult.payload.role,
      },
      status: 200,
    };
  }

  return {
    session: null,
    error: authResult.error || "Invalid or expired token",
    status: 401,
  };
}
