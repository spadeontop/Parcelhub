import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, CustomerRow, staff, StaffRow } from "@/db/schema";
import { jsonError } from "@/app/lib/response";
import type { CustomerId, CustomerProfile } from "@/app/types/v1/api";
import {
  authenticateV1Request,
  extractBearerToken,
  V1TokenPayload,
  verifyStaffToken,
  V1StaffTokenPayload,
  verifyV1Token,
} from "./jwt";

export type SafeCustomerRow = Omit<CustomerRow, "passwordHash" | "mpin">;
export type SafeStaffRow = Omit<StaffRow, "passwordHash">;

/**
 * Serializes a sanitized DB customer row into the public v1 `CustomerProfile` contract.
 */
export function serializeCustomerProfile(customer: SafeCustomerRow): CustomerProfile {
  return {
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
  };
}

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
  const extracted = extractBearerToken(request);
  if (!extracted.token) {
    return { session: null, error: extracted.error, status: 401 };
  }

  const { payload, error } = await verifyStaffToken(extracted.token, "AUTH");

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
  const extracted = extractBearerToken(request);
  if (!extracted.token) {
    return { session: null, error: extracted.error, status: 401 };
  }

  // 1. Verify HS256 AUTH token and enforce DB existence per role
  const authResult = await verifyV1Token(extracted.token, "AUTH");
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
