CREATE TABLE "order_screenshots" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"image_url" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"checks" jsonb,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_screenshots_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_tracking_id_unique";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "tracking_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "product_name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "recipient_name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "price" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_refunded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_screenshots" ADD CONSTRAINT "order_screenshots_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_paid_tracking_id_unique" ON "orders" USING btree ("tracking_id") WHERE "orders"."tracking_id" IS NOT NULL AND "orders"."status" IN ('AWAITING_PARCEL', 'READY_TO_CLAIM', 'CLAIMED');