import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import type { OrderStatus, StatusTimelineEntry } from "@/app/types/api";

export type OrderScreenshotChecks = {
  trackingId_strict?: string;
  trackingId_similar?: string;
  isParcel?: boolean;
  hasRealMetadata?: boolean;
  [key: string]: unknown;
};

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
    imageUrl: text("image_url"),
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

export const fcmTokens = pgTable("fcm_tokens", {
  token: text("token").primaryKey(),
  userId: text("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(), // e.g. "ocrConfig"
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;

export type StaffRow = typeof staff.$inferSelect;
export type NewStaffRow = typeof staff.$inferInsert;

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;

export type OrderScreenshotRow = typeof orderScreenshots.$inferSelect;
export type NewOrderScreenshotRow = typeof orderScreenshots.$inferInsert;
