CREATE TABLE "app_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_initial" text,
	"phone_number" text NOT NULL,
	"mpin" text,
	"blacklisted" boolean DEFAULT false NOT NULL,
	"blacklist_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "fcm_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"tracking_id" text NOT NULL,
	"product_name" text NOT NULL,
	"recipient_name" text NOT NULL,
	"price" double precision NOT NULL,
	"change" double precision DEFAULT 0 NOT NULL,
	"amount_received" double precision,
	"status" text NOT NULL,
	"status_timeline" jsonb NOT NULL,
	"qr_image_url" text NOT NULL,
	"image_url" text,
	"proof_image_url" text,
	"customer_id" text NOT NULL,
	"modified_by" text NOT NULL,
	"claim_requested" boolean DEFAULT false NOT NULL,
	"claim_initiated_at" timestamp with time zone,
	"claim_expires_at" timestamp with time zone,
	"courier_paid" boolean DEFAULT false NOT NULL,
	"courier_paid_by" text,
	"courier_paid_at" timestamp with time zone,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_tracking_id_unique" UNIQUE("tracking_id")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"middle_initial" text,
	"phone_number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;