import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { Role } from "@/app/types/api";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is strictly required but not defined.");
  }
  return new TextEncoder().encode(secret);
}

export type TokenTokenType = "PRE_AUTH" | "AUTH" | "REFRESH";

export interface V1TokenPayload extends JWTPayload {
  userId: string;
  role: Role;
  email: string;
  type: TokenTokenType;
  isPreAuth?: boolean;
}

/**
 * Mint a pre-auth token (strictly valid for 5 minutes)
 */
export async function signPreAuthToken(payload: {
  userId: string;
  role: Role;
  email: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
    type: "PRE_AUTH",
    isPreAuth: true,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getJwtSecret());
}

/**
 * Mint a full session auth token (valid for 15 minutes)
 */
export async function signAuthToken(payload: {
  userId: string;
  role: Role;
  email: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
    type: "AUTH",
    isPreAuth: false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getJwtSecret());
}

/**
 * Mint a long-lived refresh token (valid for 30 days)
 */
export async function signRefreshToken(payload: {
  userId: string;
  role: Role;
  email: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
    type: "REFRESH",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

/**
 * Verifies any v1 JWT token using HS256 and validates signature & expiration TTL.
 */
export async function verifyV1Token(
  token: string,
  expectedType?: TokenTokenType
): Promise<{ payload: V1TokenPayload | null; error?: string }> {
  if (!token) {
    return { payload: null, error: "Missing token" };
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    const v1Payload = payload as V1TokenPayload;

    if (expectedType && v1Payload.type !== expectedType) {
      return {
        payload: null,
        error: `Invalid token type: expected ${expectedType}, received ${v1Payload.type}`,
      };
    }

    return { payload: v1Payload };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Token verification failed";
    return { payload: null, error: errorMsg };
  }
}

/**
 * Extracts and verifies Bearer token from Request Authorization header.
 */
export async function authenticateV1Request(
  request: Request,
  allowedRoles?: Role[]
): Promise<{ session: V1TokenPayload | null; error?: string; status: number }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return { session: null, error: "Missing Authorization Bearer token", status: 401 };
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return { session: null, error: "Invalid Authorization header format", status: 401 };
  }

  const token = parts[1];
  const { payload, error } = await verifyV1Token(token, "AUTH");

  if (error || !payload) {
    return { session: null, error: error || "Invalid or expired token", status: 401 };
  }

  if (payload.isPreAuth) {
    return {
      session: null,
      error: "Pre-auth token cannot access protected resources. Complete MPIN verification.",
      status: 403,
    };
  }

  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    return {
      session: null,
      error: "Forbidden: insufficient permissions for this resource",
      status: 403,
    };
  }

  return { session: payload, status: 200 };
}

// ==========================================
// Staff-Specific Independent Token Helpers
// ==========================================

export interface V1StaffTokenPayload extends JWTPayload {
  userId: string;
  role: "STAFF" | "ADMIN";
  username: string;
  type: "AUTH" | "REFRESH";
}

/**
 * Mint an independent Staff session auth token (indefinite / non-expiring for uninterrupted POS/terminal monitoring).
 * Only invalidates when the client logs out.
 */
export async function signStaffAuthToken(payload: {
  userId: string;
  role: "STAFF" | "ADMIN";
  username: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    username: payload.username,
    type: "AUTH",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(getJwtSecret());
}

/**
 * Mint an independent Staff refresh token (indefinite / non-expiring).
 */
export async function signStaffRefreshToken(payload: {
  userId: string;
  role: "STAFF" | "ADMIN";
  username: string;
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    username: payload.username,
    type: "REFRESH",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(getJwtSecret());
}

/**
 * Verifies any v1 Staff JWT token using HS256
 */
export async function verifyStaffToken(
  token: string,
  expectedType?: "AUTH" | "REFRESH"
): Promise<{ payload: V1StaffTokenPayload | null; error?: string }> {
  if (!token) {
    return { payload: null, error: "Missing token" };
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    const staffPayload = payload as unknown as V1StaffTokenPayload;

    if (expectedType && staffPayload.type !== expectedType) {
      return {
        payload: null,
        error: `Invalid token type: expected ${expectedType}, received ${staffPayload.type}`,
      };
    }

    if (staffPayload.role !== "STAFF" && staffPayload.role !== "ADMIN") {
      return {
        payload: null,
        error: "Forbidden: Not a staff or admin token",
      };
    }

    return { payload: staffPayload };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Token verification failed";
    return { payload: null, error: errorMsg };
  }
}

/**
 * Extracts and verifies Bearer token from Request Authorization header specifically for Staff.
 * Independent from customer authentication.
 */
export async function authenticateStaffRequest(
  request: Request,
  allowedRoles: ("STAFF" | "ADMIN")[] = ["STAFF", "ADMIN"]
): Promise<{ session: V1StaffTokenPayload | null; error?: string; status: number }> {
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

  return { session: payload, status: 200 };
}



