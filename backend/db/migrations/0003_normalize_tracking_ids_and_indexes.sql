UPDATE "orders"
SET "tracking_id" = upper(regexp_replace("tracking_id", '[[:space:]]+', '', 'g'))
WHERE "tracking_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_non_draft_timestamp_idx"
  ON "orders" USING btree ("timestamp" DESC NULLS LAST)
  WHERE "status" <> 'PENDING_INITIALIZATION';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_verification_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "customer_id" text NOT NULL REFERENCES "public"."customers"("id") ON DELETE cascade,
  "order_id" text REFERENCES "public"."orders"("id") ON DELETE set null,
  "outcome" text NOT NULL,
  "tracking_id_mode" text NOT NULL,
  "source_app" text DEFAULT 'unknown' NOT NULL,
  "model" text,
  "provider" text,
  "input_tokens" integer,
  "output_tokens" integer,
  "total_tokens" integer,
  "cost_usd" double precision,
  "latency_ms" integer NOT NULL,
  "error_reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_logs_customer_created_idx"
  ON "ai_verification_logs" USING btree ("customer_id", "created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_logs_created_at_idx"
  ON "ai_verification_logs" USING btree ("created_at" DESC NULLS LAST);
