/*
  # Add Approval Status Checks to RLS Policies

  1. Changes
    - Create helper function to check if user is approved
    - Update all relevant policies to check approval_status = 'approved'
    - Only approved users (except admins) can access application features
    
  2. Security
    - Pending/rejected users cannot create orders or access features
    - Admins bypass approval checks
    - Users can still view their own profile regardless of approval status
*/

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_approved(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id 
    AND approval_status = 'approved'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_approved(uuid) TO authenticated;

-- Drop and recreate orders policies with approval checks
DROP POLICY IF EXISTS "Clients can create orders" ON orders;
DROP POLICY IF EXISTS "Clients can update own pending orders" ON orders;
DROP POLICY IF EXISTS "Clients can view own orders" ON orders;
DROP POLICY IF EXISTS "Suppliers can update assigned orders" ON orders;
DROP POLICY IF EXISTS "Suppliers can view assigned orders" ON orders;

-- Clients can view their own orders (approved clients only)
CREATE POLICY "Clients can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() 
    AND public.is_approved(auth.uid())
  );

-- Suppliers can view orders assigned to them (approved suppliers only)
CREATE POLICY "Suppliers can view assigned orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    supplier_id = auth.uid()
    AND public.is_approved(auth.uid())
  );

-- Clients can create orders (approved clients only)
CREATE POLICY "Clients can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND public.is_client(auth.uid())
    AND public.is_approved(auth.uid())
  );

-- Clients can update their pending orders (approved clients only)
CREATE POLICY "Clients can update own pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    AND status = 'pending'
    AND public.is_approved(auth.uid())
  )
  WITH CHECK (
    client_id = auth.uid()
    AND public.is_approved(auth.uid())
  );

-- Suppliers can update assigned orders (approved suppliers only)
CREATE POLICY "Suppliers can update assigned orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    supplier_id = auth.uid()
    AND public.is_supplier(auth.uid())
    AND public.is_approved(auth.uid())
  )
  WITH CHECK (
    supplier_id = auth.uid()
    AND public.is_approved(auth.uid())
  );

-- Update supplier_zones policies to check approval
DROP POLICY IF EXISTS "Suppliers can request zones" ON supplier_zones;
DROP POLICY IF EXISTS "Suppliers can view own zone requests" ON supplier_zones;

-- Suppliers can view their own zone requests (approved suppliers only)
CREATE POLICY "Suppliers can view own zone requests"
  ON supplier_zones FOR SELECT
  TO authenticated
  USING (
    supplier_id = auth.uid()
    AND public.is_approved(auth.uid())
  );

-- Suppliers can request zones (approved suppliers only)
CREATE POLICY "Suppliers can request zones"
  ON supplier_zones FOR INSERT
  TO authenticated
  WITH CHECK (
    supplier_id = auth.uid()
    AND public.is_supplier(auth.uid())
    AND public.is_approved(auth.uid())
  );
