-- Versioned Supabase Realtime Private Channel RLS Policy
-- Apply manually in Supabase Dashboard SQL Editor (or Supabase CLI migrations)
-- for staging and production environments.
--
-- IMPORTANT: Keep this file out of backend/db/migrations/*.sql because local dev
-- and CI tests run Drizzle migrations against @electric-sql/pglite, where the
-- Supabase `realtime` schema does not exist.

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_can_listen_orders" ON realtime.messages;
CREATE POLICY "staff_can_listen_orders"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'user_role') = 'STAFF'
    AND (SELECT realtime.topic()) = 'staff:orders'
  );

DROP POLICY IF EXISTS "customer_can_listen_own_orders" ON realtime.messages;
CREATE POLICY "customer_can_listen_own_orders"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt() ->> 'user_role') = 'CUSTOMER'
    AND (SELECT realtime.topic()) = ('customer:' || (SELECT auth.uid()::text))
  );
