ALTER TABLE "staff" RENAME COLUMN "email" TO "username";--> statement-breakpoint
ALTER TABLE "staff" DROP CONSTRAINT "staff_email_unique";--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "staff" DROP COLUMN IF EXISTS "phone_number";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN IF EXISTS "qr_image_url";

