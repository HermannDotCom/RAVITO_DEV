/*
  # Fix Security Issues - Part 2: Optimize RLS for Orders Table
  
  Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row
  This significantly improves query performance at scale
*/

-- ORDERS TABLE
DROP POLICY IF EXISTS "Clients can view own orders" ON orders;
CREATE POLICY "Clients can view own orders" ON orders
  FOR SELECT TO authenticated
  USING (client_id = (select auth.uid()));

DROP POLICY IF EXISTS "Suppliers can view assigned orders" ON orders;
CREATE POLICY "Suppliers can view assigned orders" ON orders
  FOR SELECT TO authenticated
  USING (supplier_id = (select auth.uid()));

DROP POLICY IF EXISTS "Clients can update own pending orders" ON orders;
CREATE POLICY "Clients can update own pending orders" ON orders
  FOR UPDATE TO authenticated
  USING (client_id = (select auth.uid()) AND status = 'pending');

DROP POLICY IF EXISTS "Suppliers can update their assigned orders" ON orders;
CREATE POLICY "Suppliers can update their assigned orders" ON orders
  FOR UPDATE TO authenticated
  USING (supplier_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders" ON orders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

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
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'supplier' 
      AND is_approved = true
    )
  );

DROP POLICY IF EXISTS "Suppliers can update status when submitting offers" ON orders;
CREATE POLICY "Suppliers can update status when submitting offers" ON orders
  FOR UPDATE TO authenticated
  USING (
    status IN ('pending', 'offers-received') AND
    zone_id IN (
      SELECT zone_id FROM supplier_zones 
      WHERE supplier_id = (select auth.uid()) 
      AND is_active = true
    )
  )
  WITH CHECK (
    status IN ('pending', 'offers-received') AND
    zone_id IN (
      SELECT zone_id FROM supplier_zones 
      WHERE supplier_id = (select auth.uid()) 
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Clients can accept offers for their orders" ON orders;
CREATE POLICY "Clients can accept offers for their orders" ON orders
  FOR UPDATE TO authenticated
  USING (client_id = (select auth.uid()))
  WITH CHECK (client_id = (select auth.uid()));

DROP POLICY IF EXISTS "Clients can update payment status for their orders" ON orders;
CREATE POLICY "Clients can update payment status for their orders" ON orders
  FOR UPDATE TO authenticated
  USING (client_id = (select auth.uid()))
  WITH CHECK (client_id = (select auth.uid()));

DROP POLICY IF EXISTS "Clients can create orders" ON orders;
CREATE POLICY "Clients can create orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'client' 
      AND is_approved = true
    )
  );