CREATE INDEX IF NOT EXISTS "orders_customer_id_timestamp_idx" ON "orders" USING btree ("customer_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_timestamp_idx" ON "orders" USING btree ("status","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_ticket_code_idx" ON "orders" USING btree ("ticket_code");