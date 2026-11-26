-- Allow reusing tracking IDs once a previous parcel is CLAIMED.
-- Only active paid statuses (AWAITING_PARCEL, READY_TO_CLAIM) enforce uniqueness.
DROP INDEX IF EXISTS "orders_paid_tracking_id_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "orders_paid_tracking_id_unique"
  ON "orders" USING btree ("tracking_id")
  WHERE "orders"."tracking_id" IS NOT NULL
    AND "orders"."status" IN ('AWAITING_PARCEL', 'READY_TO_CLAIM');
