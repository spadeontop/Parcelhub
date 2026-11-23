-- 1. Customer email verification & session revocation (tokenVersion)
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint

-- Grandfather pre-migration customer rows so existing testers/users are not locked out
UPDATE "customers"
SET "email_verified" = true,
    "email_verified_at" = COALESCE("email_verified_at", "created_at")
WHERE "email_verified" = false;--> statement-breakpoint

-- 2. Unified 6-digit email OTP verification table
CREATE TABLE IF NOT EXISTS "email_verification_codes" (
  "id" text PRIMARY KEY NOT NULL,
  "customer_id" text REFERENCES "public"."customers"("id") ON DELETE cascade,
  "email" text NOT NULL,
  "purpose" text NOT NULL,
  "code_hash" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 5 NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_verif_email_purpose_created_idx"
  ON "email_verification_codes" USING btree ("email", "purpose", "created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_verif_expires_idx"
  ON "email_verification_codes" USING btree ("expires_at");--> statement-breakpoint

-- 3. Order activation attribution, cancellation metadata, and refund pass/ledger columns
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "activated_by" text;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "activated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "cancelled_by" text;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "cancelled_by_role" text;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "cancel_reason_code" text;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "refund_requested" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "refund_initiated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "refund_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "refund_reason_code" text;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "refund_reason" text;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "refund_amount" double precision;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "refunded_by" text;--> statement-breakpoint
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "refunded_at" timestamp with time zone;--> statement-breakpoint

-- Backfill activated_at for already-paid orders in existing databases
UPDATE "orders"
SET "activated_at" = COALESCE("activated_at", "timestamp")
WHERE "status" IN ('AWAITING_PARCEL', 'READY_TO_CLAIM', 'CLAIMED')
  AND "activated_at" IS NULL;--> statement-breakpoint

-- Fast O(log N) lookup for staff activation auto-cancelling competing unpaid orders
CREATE INDEX IF NOT EXISTS "orders_unpaid_tracking_id_idx"
  ON "orders" USING btree ("tracking_id")
  WHERE "tracking_id" IS NOT NULL
    AND "status" IN ('PENDING_INITIALIZATION', 'PAYMENT_REQUIRED');--> statement-breakpoint

-- Fast lookup for staff "Pending Refunds" queue
CREATE INDEX IF NOT EXISTS "orders_cancelled_unrefunded_idx"
  ON "orders" USING btree ("timestamp" DESC NULLS LAST)
  WHERE "status" = 'CANCELLED'
    AND "is_refunded" = false
    AND "activated_at" IS NOT NULL
    AND "price" > 0
    AND "courier_paid" = false;
