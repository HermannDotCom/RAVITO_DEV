/*
  # Fix Security Issues - Part 5: Optimize RLS for Supplier Offers and Zones
  
  Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row
*/

-- SUPPLIER_OFFERS TABLE
DROP POLICY IF EXISTS "Suppliers can view own offers" ON supplier_offers;
CREATE POLICY "Suppliers can view own offers" ON supplier_offers
  FOR SELECT TO authenticated
  USING (supplier_id = (select auth.uid()));

DROP POLICY IF EXISTS "Clients can view offers for their orders" ON supplier_offers;
CREATE POLICY "Clients can view offers for their orders" ON supplier_offers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = supplier_offers.order_id 
      AND orders.client_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Clients can update offer status" ON supplier_offers;
CREATE POLICY "Clients can update offer status" ON supplier_offers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = supplier_offers.order_id 
      AND orders.client_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage all offers" ON supplier_offers;
CREATE POLICY "Admins can manage all offers" ON supplier_offers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Suppliers can create offers for zone orders" ON supplier_offers;
CREATE POLICY "Suppliers can create offers for zone orders" ON supplier_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    supplier_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = supplier_offers.order_id 
      AND orders.zone_id IN (
        SELECT zone_id FROM supplier_zones 
        WHERE supplier_id = (select auth.uid()) 
        AND is_active = true
      )
      AND orders.status IN ('pending', 'offers-received')
    )
  );

-- SUPPLIER_ZONES TABLE
DROP POLICY IF EXISTS "Suppliers can view own zone requests" ON supplier_zones;
CREATE POLICY "Suppliers can view own zone requests" ON supplier_zones
  FOR SELECT TO authenticated
  USING (supplier_id = (select auth.uid()));

DROP POLICY IF EXISTS "Suppliers can request zones" ON supplier_zones;
CREATE POLICY "Suppliers can request zones" ON supplier_zones
  FOR INSERT TO authenticated
  WITH CHECK (supplier_id = (select auth.uid()));

DROP POLICY IF EXISTS "Suppliers can delete own pending zone requests" ON supplier_zones;
CREATE POLICY "Suppliers can delete own pending zone requests" ON supplier_zones
  FOR DELETE TO authenticated
  USING (
    supplier_id = (select auth.uid()) 
    AND is_active = false 
    AND approved_by IS NULL
  );

DROP POLICY IF EXISTS "Admins can view all zone requests" ON supplier_zones;
CREATE POLICY "Admins can view all zone requests" ON supplier_zones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage zone requests" ON supplier_zones;
CREATE POLICY "Admins can manage zone requests" ON supplier_zones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ZONES TABLE
DROP POLICY IF EXISTS "Only admins can manage zones" ON zones;
CREATE POLICY "Only admins can manage zones" ON zones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );