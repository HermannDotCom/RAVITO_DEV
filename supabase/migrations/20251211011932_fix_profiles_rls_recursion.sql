/*
  # Fix Infinite Recursion in Profiles RLS Policies
  
  The problem: Policies on profiles table were checking profiles table itself,
  causing infinite recursion.
  
  Solution: 
  - For user's own profile: Direct check with auth.uid()
  - For admin checks: Use a SECURITY DEFINER function that bypasses RLS
*/

-- Create a function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Create a function to check if current user is supplier (bypasses RLS)
CREATE OR REPLACE FUNCTION is_supplier()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'supplier'
  );
END;
$$;

-- Create a function to check if current user is client (bypasses RLS)
CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'client'
  );
END;
$$;

-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Suppliers can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Clients can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON profiles;

-- Recreate profiles policies without recursion
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE TO authenticated
  USING (is_admin());

-- Now fix other tables that had similar recursion issues
-- ORDERS TABLE
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Approved suppliers can view pending orders in their zones" ON orders;
CREATE POLICY "Approved suppliers can view pending orders in their zones" ON orders
  FOR SELECT TO authenticated
  USING (
    status IN ('pending', 'offers-received') AND
    zone_id IN (
      SELECT zone_id FROM supplier_zones 
      WHERE supplier_id = (select auth.uid()) 
      AND is_active = true
    ) AND
    is_supplier()
  );

DROP POLICY IF EXISTS "Clients can create orders" ON orders;
CREATE POLICY "Clients can create orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id = (select auth.uid()) AND
    is_client()
  );

-- PRODUCTS TABLE
DROP POLICY IF EXISTS "Approved clients can view products" ON products;
CREATE POLICY "Approved clients can view products" ON products
  FOR SELECT TO authenticated
  USING (is_client());

DROP POLICY IF EXISTS "Approved suppliers can view products" ON products;
CREATE POLICY "Approved suppliers can view products" ON products
  FOR SELECT TO authenticated
  USING (is_supplier());

DROP POLICY IF EXISTS "Admins can view all products" ON products;
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products" ON products
  FOR UPDATE TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products" ON products
  FOR DELETE TO authenticated
  USING (is_admin());

-- ORDER_ITEMS TABLE
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update order items" ON order_items;
CREATE POLICY "Admins can update order items" ON order_items
  FOR UPDATE TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;
CREATE POLICY "Admins can delete order items" ON order_items
  FOR DELETE TO authenticated
  USING (is_admin());

-- SUPPLIER_OFFERS TABLE
DROP POLICY IF EXISTS "Admins can manage all offers" ON supplier_offers;
CREATE POLICY "Admins can manage all offers" ON supplier_offers
  FOR ALL TO authenticated
  USING (is_admin());

-- SUPPLIER_ZONES TABLE
DROP POLICY IF EXISTS "Admins can view all zone requests" ON supplier_zones;
CREATE POLICY "Admins can view all zone requests" ON supplier_zones
  FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage zone requests" ON supplier_zones;
CREATE POLICY "Admins can manage zone requests" ON supplier_zones
  FOR ALL TO authenticated
  USING (is_admin());

-- ZONES TABLE
DROP POLICY IF EXISTS "Only admins can manage zones" ON zones;
CREATE POLICY "Only admins can manage zones" ON zones
  FOR ALL TO authenticated
  USING (is_admin());

-- ZONE_REGISTRATION_REQUESTS TABLE
DROP POLICY IF EXISTS "Admins can update requests" ON zone_registration_requests;
CREATE POLICY "Admins can update requests" ON zone_registration_requests
  FOR UPDATE TO authenticated
  USING (is_admin());

-- USER_ACTIVITY_LOG TABLE
DROP POLICY IF EXISTS "Admins can read all activity logs" ON user_activity_log;
CREATE POLICY "Admins can read all activity logs" ON user_activity_log
  FOR SELECT TO authenticated
  USING (is_admin());

-- TRANSFERS TABLE
DROP POLICY IF EXISTS "Admins can manage all transfers" ON transfers;
CREATE POLICY "Admins can manage all transfers" ON transfers
  FOR ALL TO authenticated
  USING (is_admin());

-- TRANSFER_ORDERS TABLE
DROP POLICY IF EXISTS "Admins can manage all transfer orders" ON transfer_orders;
CREATE POLICY "Admins can manage all transfer orders" ON transfer_orders
  FOR ALL TO authenticated
  USING (is_admin());

-- RATINGS TABLE
DROP POLICY IF EXISTS "Order participants and admins can view ratings" ON ratings;
CREATE POLICY "Order participants and admins can view ratings" ON ratings
  FOR SELECT TO authenticated
  USING (
    from_user_id = (select auth.uid()) OR 
    to_user_id = (select auth.uid()) OR
    is_admin()
  );