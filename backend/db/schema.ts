import {
  boolean,
  doublePrecision,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import type { OrderStatus, StatusTimelineEntry } from "@/app/types/api";

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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  ticketCode: text("ticket_code"), // Human-facing code e.g. "492-817"
  trackingId: text("tracking_id").notNull().unique(),
  productName: text("product_name").notNull(),
  recipientName: text("recipient_name").notNull(),
  price: doublePrecision("price").notNull(),
  change: doublePrecision("change").default(0).notNull(),
  amountReceived: doublePrecision("amount_received"),
  status: text("status").$type<OrderStatus>().notNull(),
  statusTimeline: jsonb("status_timeline").$type<StatusTimelineEntry[]>().notNull(),
  qrImageUrl: text("qr_image_url").notNull(),
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
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export const fcmTokens = pgTable("fcm_tokens", {
  token: text("token").primaryKey(),
  userId: text("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(), // e.g. "ocrConfig"
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;

export type StaffRow = typeof staff.$inferSelect;
export type NewStaffRow = typeof staff.$inferInsert;

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;

