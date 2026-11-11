/**
 * ParcelHub API v1 TypeScript Contracts & Types
 * Re-exports base contracts and incorporates Drizzle database schema definitions.
 */

// 1. Re-export legacy/base API types
export * from "@/app/types/api";

// 2. Re-export all database schema tables and infer types directly from db/schema
export {
  customers,
  staff,
  orders,
  fcmTokens,
  appConfig,
} from "@/db/schema";

export type {
  CustomerRow,
  NewCustomerRow,
  StaffRow,
  NewStaffRow,
  OrderRow,
  NewOrderRow,
} from "@/db/schema";

export type FcmTokenRow = typeof import("@/db/schema").fcmTokens.$inferSelect;
export type NewFcmTokenRow = typeof import("@/db/schema").fcmTokens.$inferInsert;
export type AppConfigRow = typeof import("@/db/schema").appConfig.$inferSelect;
export type NewAppConfigRow = typeof import("@/db/schema").appConfig.$inferInsert;

import type {
  ISO8601Timestamp,
  OrderId,
  OrderStatus,
  OrderStatusHistoryTuple,
  StaffId,
  StandardSuccessResponse,
  JWTToken,
} from "@/app/types/api";

// ==========================================
// Customer V1 API Definitions
// ==========================================

export type CustomerLoginV1Req = {
  readonly email: string;
  readonly password: string;
};

export type CustomerLoginV1Res = StandardSuccessResponse & {
  readonly preAuthToken: JWTToken;
};

// ==========================================
// Staff V1 API Definitions (Aligned strictly with schema.ts)
// ==========================================

// Staff in schema.ts uses `username`, passwordHash, firstName, lastName, middleInitial
export type StaffLoginV1Req = {
  readonly username: string;
  readonly password: string;
};

export type StaffLoginV1Res = StandardSuccessResponse & {
  readonly authToken: JWTToken;
  readonly refreshToken: JWTToken;
};

export type StaffProfileV1 = {
  readonly id: StaffId;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
  readonly createdAt?: ISO8601Timestamp;
  readonly updatedAt?: ISO8601Timestamp;
};

export type AdminCreateStaffV1Req = {
  readonly username: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial?: string;
};

export type AdminCreateStaffV1Res = StandardSuccessResponse & {
  readonly staffId: StaffId;
};

export type AdminUpdateStaffV1Req = {
  readonly staff: Partial<AdminCreateStaffV1Req>;
};

// ==========================================
// Order V1 API Definitions (Aligned with schema.ts)
// ==========================================

export type CustomerOrderDetailV1 = {
  readonly id: OrderId;
  readonly ticketCode?: string | null;
  readonly trackingId: string;
  readonly productName: string;
  readonly recipientName: string;
  readonly price: number;
  readonly change: number;
  readonly status: OrderStatus;
  readonly statusTimeline: OrderStatusHistoryTuple;
  readonly imageUrl?: string | null;
  readonly proofImageUrl?: string | null;
  readonly qrImageUrl?: string;
  readonly claimInitiatedAt?: ISO8601Timestamp | null;
  readonly claimExpiresAt?: ISO8601Timestamp | null;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
};

export type StaffOrderDetailV1 = {
  readonly orderId: OrderId;
  readonly ticketCode?: string | null;
  readonly trackingId: string;
  readonly customer: string;
  readonly amountToPay: number;
  readonly amountReceived?: number | null;
  readonly change?: number;
  readonly timestamp: ISO8601Timestamp;
  readonly status: OrderStatus;
  readonly statusMessage: string;
  readonly imageUrl?: string | null;
  readonly proofImageUrl?: string | null;
  readonly isClaimActive?: boolean;
  readonly claimRemainingSeconds?: number;
  readonly courierPaid?: boolean;
  readonly courierPaidBy?: StaffId | null;
  readonly courierPaidByName?: string;
  readonly courierPaidAt?: ISO8601Timestamp | null;
  readonly createdAt?: ISO8601Timestamp;
  readonly statusTimeline?: OrderStatusHistoryTuple;
};
