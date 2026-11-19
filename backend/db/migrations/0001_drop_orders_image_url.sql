CREATE INDEX IF NOT EXISTS "fcm_tokens_user_id_idx" ON "fcm_tokens" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "image_url";