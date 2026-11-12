import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, CustomerRow } from "@/db/schema";
import { authenticateV1Request, V1TokenPayload } from "./jwt";

export interface AuthenticatedCustomerResult {
  session: V1TokenPayload | null;
  customer?: CustomerRow;
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

