/**
 * ParcelHub API v1 TypeScript Contracts & Types
 * Standalone contract definition for v1 API and database schema integration.
 * Uses strict type aliases, union literals, and tuples. No interfaces.
 */

// ==========================================
// 1. Drizzle Schema Type Exports
// ==========================================

export type {
  CustomerRow,
  NewCustomerRow,
  EmailVerificationCodeRow,
  NewEmailVerificationCodeRow,
  StaffRow,
  NewStaffRow,
  OrderRow,
  NewOrderRow,
  OrderScreenshotRow,
  NewOrderScreenshotRow,
  OrderScreenshotChecks,
  FcmTokenRow,
  NewFcmTokenRow,
  AiVerificationOutcome,
  AiVerificationLogRow,
  NewAiVerificationLogRow,
} from "@/db/schema";

export type AppConfigRow = typeof import("@/db/schema").appConfig.$inferSelect;
export type NewAppConfigRow = typeof import("@/db/schema").appConfig.$inferInsert;

// ==========================================
// 2. Shared API Contracts (@parcelhub/contracts)
// ==========================================

export * from "@parcelhub/contracts";
