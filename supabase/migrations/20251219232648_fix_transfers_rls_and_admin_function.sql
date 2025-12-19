/*
  # Fix Transfers RLS and is_admin Function

  1. Problem:
    - Admin users cannot INSERT into transfers table (RLS policy violation)
    - Transfers history shows 0 despite data existing in database
  
  2. Solution:
    - Recreate is_admin() function with proper SECURITY DEFINER and search_path
    - Recreate RLS policies for transfers table with explicit INSERT policy
    - Recreate RLS policies for transfer_orders table
  
  3. Changes:
    - Drop and recreate is_admin() function
    - Drop existing policies on transfers and transfer_orders
    - Create new explicit policies (SELECT, INSERT, UPDATE, DELETE separately)
*/

-- Drop the existing is_admin() function (no args version) and recreate with proper settings
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Drop existing policies on transfers
DROP POLICY IF EXISTS "transfers_manage_admin_only" ON transfers;
DROP POLICY IF EXISTS "transfers_select_policy" ON transfers;
DROP POLICY IF EXISTS "transfers_insert_admin" ON transfers;
DROP POLICY IF EXISTS "transfers_update_admin" ON transfers;
DROP POLICY IF EXISTS "transfers_delete_admin" ON transfers;

-- Create separate policies for transfers table
CREATE POLICY "transfers_select_all"
  ON transfers FOR SELECT
  TO authenticated
  USING (
    is_admin() OR supplier_id = auth.uid()
  );

CREATE POLICY "transfers_insert_admin"
  ON transfers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "transfers_update_admin"
  ON transfers FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "transfers_delete_admin"
  ON transfers FOR DELETE
  TO authenticated
  USING (is_admin());

-- Drop existing policies on transfer_orders
DROP POLICY IF EXISTS "transfer_orders_manage_admin_only" ON transfer_orders;
DROP POLICY IF EXISTS "transfer_orders_select_policy" ON transfer_orders;
DROP POLICY IF EXISTS "transfer_orders_insert_admin" ON transfer_orders;
DROP POLICY IF EXISTS "transfer_orders_update_admin" ON transfer_orders;
DROP POLICY IF EXISTS "transfer_orders_delete_admin" ON transfer_orders;

-- Create separate policies for transfer_orders table
CREATE POLICY "transfer_orders_select_all"
  ON transfer_orders FOR SELECT
  TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM transfers
      WHERE transfers.id = transfer_orders.transfer_id
      AND transfers.supplier_id = auth.uid()
    )
  );

CREATE POLICY "transfer_orders_insert_admin"
  ON transfer_orders FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "transfer_orders_update_admin"
  ON transfer_orders FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "transfer_orders_delete_admin"
  ON transfer_orders FOR DELETE
  TO authenticated
  USING (is_admin());
