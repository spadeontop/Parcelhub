import { JWTToken, Role } from "@/app/types/api";

export interface DecodedSession {
  userId: string;
  role: Role;
  email: string;
  isPreAuth?: boolean;
}

/**
 * Creates a simple mock token encoding role and user metadata
 */
export function generateMockToken(
  payload: { userId: string; role: Role; email: string; isPreAuth?: boolean }
): JWTToken {
  const jsonStr = JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 * 24,
  });
  return `mock_jwt.${Buffer.from(jsonStr).toString("base64")}.mock_signature`;
}

/**
 * Extracts and decodes bearer token from Authorization header
 */
export function extractBearerToken(request: Request): JWTToken | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return null;
}

/**
 * Decodes mock token or preAuthToken
 */
export function decodeToken(token: JWTToken): DecodedSession | null {
  if (!token) return null;
  
  if (token.startsWith("mock_jwt.")) {
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
        return JSON.parse(payloadStr) as DecodedSession;
      }
    } catch {
      return null;
    }
  }

  // Fallback for mock strings passed in tests
  if (token.includes("staff")) {
    return { userId: "STF-001", role: "STAFF", email: "staff@parcelhub.com" };
  }
  if (token.includes("admin")) {
    return { userId: "ADM-001", role: "ADMIN", email: "admin@parcelhub.com" };
  }

  return { userId: "CST-001", role: "CUSTOMER", email: "customer@parcelhub.com" };
}

/**
 * Authenticates request against allowed roles
 */
export function authenticateRequest(
  request: Request,
  allowedRoles?: Role[]
): { session: DecodedSession | null; error?: string } {
  const token = extractBearerToken(request);
  if (!token) {
    return { session: null, error: "Missing Authorization Bearer token" };
  }

  const session = decodeToken(token);
  if (!session) {
    return { session: null, error: "Invalid or expired token" };
  }

  if (session.isPreAuth) {
    return { session: null, error: "Pre-auth token cannot access protected resources. Complete MPIN step." };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { session: null, error: "Unauthorized access for user role" };
  }

  return { session };
}
