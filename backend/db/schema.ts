import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import type {
  CancelReasonCode,
  EmailVerificationPurpose,
  OrderActorRole,
  OrderStatus,
  ScreenshotSourceApp,
  StatusTimelineEntry,
} from "@/app/types/v1/api";

export type OrderScreenshotChecks = {
  trackingId_strict?: string;
  trackingId_similar?: string;
  trackingIdLocked?: boolean;
  sourceApp?: ScreenshotSourceApp;
  isParcel?: boolean;
  hasRealMetadata?: boolean;
  [key: string]: unknown;
};

export type AiVerificationOutcome =
  | "OK"
  | "INVALID_SCREENSHOT"
  | "TRACKING_MISSING"
  | "DUPLICATE_TRACKING"
  | "PROVIDER_ERROR";

export const customers = pgTable("customers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleInitial: text("middle_initial"),
  phoneNumber: text("phone_number").notNull(),
  mpin: text("mpin"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  tokenVersion: integer("token_version").default(0).notNull(),
  blacklisted: boolean("blacklisted").default(false).notNull(),
  blacklistReason: text("blacklist_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const staff = pgTable("staff", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleInitial: text("middle_initial"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    ticketCode: text("ticket_code"), // Human-facing code e.g. "492-817"
    trackingId: text("tracking_id"),
    productName: text("product_name").default("").notNull(),
    recipientName: text("recipient_name").default("").notNull(),
    price: doublePrecision("price").default(0).notNull(),
    change: doublePrecision("change").default(0).notNull(),
    amountReceived: doublePrecision("amount_received"),
    status: text("status").$type<OrderStatus>().notNull(),
    statusTimeline: jsonb("status_timeline")
      .$type<StatusTimelineEntry[]>()
      .notNull(),
    proofImageUrl: text("proof_image_url"),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    modifiedBy: text("modified_by").notNull(),
    claimRequested: boolean("claim_requested").default(false).notNull(),
    claimInitiatedAt: timestamp("claim_initiated_at", { withTimezone: true }),
    claimExpiresAt: timestamp("claim_expires_at", { withTimezone: true }),
    courierPaid: boolean("courier_paid").default(false).notNull(),
    courierPaidBy: text("courier_paid_by"),
    courierPaidAt: timestamp("courier_paid_at", { withTimezone: true }),
    isRefunded: boolean("is_refunded").default(false).notNull(),
    activatedBy: text("activated_by"),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    cancelledBy: text("cancelled_by"),
    cancelledByRole: text("cancelled_by_role").$type<OrderActorRole>(),
    cancelReasonCode: text("cancel_reason_code").$type<CancelReasonCode>(),
    cancelReason: text("cancel_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    refundRequested: boolean("refund_requested").default(false).notNull(),
    refundInitiatedAt: timestamp("refund_initiated_at", { withTimezone: true }),
    refundExpiresAt: timestamp("refund_expires_at", { withTimezone: true }),
    refundReasonCode: text("refund_reason_code").$type<CancelReasonCode>(),
    refundReason: text("refund_reason"),
    refundAmount: doublePrecision("refund_amount"),
    refundedBy: text("refunded_by"),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("orders_paid_tracking_id_unique")
      .on(table.trackingId)
      .where(
        sql`${table.trackingId} IS NOT NULL AND ${table.status} IN ('AWAITING_PARCEL', 'READY_TO_CLAIM', 'CLAIMED')`
      ),
    index("orders_unpaid_tracking_id_idx")
      .on(table.trackingId)
      .where(
        sql`${table.trackingId} IS NOT NULL AND ${table.status} IN ('PENDING_INITIALIZATION', 'PAYMENT_REQUIRED')`
      ),
    index("orders_cancelled_unrefunded_idx")
      .on(table.timestamp.desc())
      .where(
        sql`${table.status} = 'CANCELLED' AND ${table.isRefunded} = false AND ${table.activatedAt} IS NOT NULL AND ${table.amountReceived} > 0 AND ${table.courierPaid} = false`
      ),
    index("orders_customer_id_timestamp_idx").on(
      table.customerId,
      table.timestamp.desc()
    ),
    index("orders_status_timestamp_idx").on(
      table.status,
      table.timestamp.desc()
    ),
    index("orders_non_draft_timestamp_idx")
      .on(table.timestamp.desc())
      .where(sql`${table.status} <> 'PENDING_INITIALIZATION'`),
    index("orders_ticket_code_idx").on(table.ticketCode),
  ]
);

export const orderScreenshots = pgTable("order_screenshots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  orderId: text("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  checks: jsonb("checks").$type<OrderScreenshotChecks>(),
  model: text("model"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const fcmTokens = pgTable(
  "fcm_tokens",
  {
    token: text("token").primaryKey(),
    userId: text("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("fcm_tokens_user_id_idx").on(table.userId),
  ]
);

export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(), // e.g. "ocrConfig"
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const aiVerificationLogs = pgTable(
  "ai_verification_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    outcome: text("outcome").$type<AiVerificationOutcome>().notNull(),
    trackingIdMode: text("tracking_id_mode").notNull(),
    sourceApp: text("source_app").default("unknown").notNull(),
    model: text("model"),
    provider: text("provider"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    totalTokens: integer("total_tokens"),
    costUsd: doublePrecision("cost_usd"),
    latencyMs: integer("latency_ms").notNull(),
    errorReason: text("error_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ai_logs_customer_created_idx").on(
      table.customerId,
      table.createdAt.desc()
    ),
    index("ai_logs_created_at_idx").on(table.createdAt.desc()),
  ]
);

export const emailVerificationCodes = pgTable(
  "email_verification_codes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    customerId: text("customer_id").references(() => customers.id, {
      onDelete: "cascade",
    }),
    email: text("email").notNull(),
    purpose: text("purpose").$type<EmailVerificationPurpose>().notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("email_verif_email_purpose_created_idx").on(
      table.email,
      table.purpose,
      table.createdAt.desc()
    ),
    index("email_verif_expires_idx").on(table.expiresAt),
  ]
);

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;

export type EmailVerificationCodeRow = typeof emailVerificationCodes.$inferSelect;
export type NewEmailVerificationCodeRow = typeof emailVerificationCodes.$inferInsert;

export type StaffRow = typeof staff.$inferSelect;
export type NewStaffRow = typeof staff.$inferInsert;

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;

export type OrderScreenshotRow = typeof orderScreenshots.$inferSelect;
export type NewOrderScreenshotRow = typeof orderScreenshots.$inferInsert;

export type FcmTokenRow = typeof fcmTokens.$inferSelect;
export type NewFcmTokenRow = typeof fcmTokens.$inferInsert;

export type AiVerificationLogRow = typeof aiVerificationLogs.$inferSelect;
export type NewAiVerificationLogRow = typeof aiVerificationLogs.$inferInsert;
