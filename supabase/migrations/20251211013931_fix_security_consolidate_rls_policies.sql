/*
  # Consolidate Multiple Permissive RLS Policies
  
  When multiple permissive policies exist for the same action, PostgreSQL will
  grant access if ANY policy passes. This can lead to security issues.
  
  Solution: Consolidate multiple permissive policies into single policies with OR conditions.
  
  ## Tables Updated
  - order_items (SELECT)
  - orders (INSERT, SELECT, UPDATE)
  - products (DELETE, INSERT, SELECT, UPDATE)
  - profiles (SELECT, UPDATE)
  - supplier_offers (INSERT, SELECT, UPDATE)
  - supplier_zones (DELETE, INSERT, SELECT)
  - transfer_orders (SELECT)
  - transfers (SELECT)
  - user_activity_log (SELECT)
  - zones (SELECT)
*/

-- ============================================================================
-- ORDER_ITEMS: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Clients can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Suppliers can view order items of their zone orders" ON order_items;

CREATE POLICY "order_items_select_consolidated" ON order_items
  FOR SELECT TO authenticated
  USING (
    -- Admin can view all
    is_admin() OR
    -- Client can view their own order items
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.client_id = (select auth.uid())
    ) OR
    -- Supplier can view order items in their zones
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.zone_id IN (
        SELECT zone_id FROM supplier_zones 
        WHERE supplier_id = (select auth.uid()) 
        AND is_active = true
      )
    )
  );

-- ============================================================================
-- ORDERS: Consolidate policies
-- ============================================================================

-- INSERT policies
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
DROP POLICY IF EXISTS "Clients can create orders" ON orders;

CREATE POLICY "orders_insert_consolidated" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Admin can insert any order
    is_admin() OR
    -- Client can create their own orders
    (client_id = (select auth.uid()) AND is_client())
  );

-- SELECT policies
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Approved suppliers can view pending orders in their zones" ON orders;
DROP POLICY IF EXISTS "Clients can view own orders" ON orders;
DROP POLICY IF EXISTS "Suppliers can view assigned orders" ON orders;

CREATE POLICY "orders_select_consolidated" ON orders
  FOR SELECT TO authenticated
  USING (
    -- Admin can view all
    is_admin() OR
    -- Client can view own orders
    client_id = (select auth.uid()) OR
    -- Supplier can view assigned orders
    supplier_id = (select auth.uid()) OR
    -- Supplier can view pending orders in their zones
    (
      status IN ('pending', 'offers-received') AND
      zone_id IN (
        SELECT zone_id FROM supplier_zones 
        WHERE supplier_id = (select auth.uid()) 
        AND is_active = true
      ) AND
      is_supplier()
    )
  );

-- UPDATE policies
DROP POLICY IF EXISTS "Clients can accept offers for their orders" ON orders;
DROP POLICY IF EXISTS "Clients can update own pending orders" ON orders;
DROP POLICY IF EXISTS "Clients can update payment status for their orders" ON orders;
DROP POLICY IF EXISTS "Suppliers can update status when submitting offers" ON orders;
DROP POLICY IF EXISTS "Suppliers can update their assigned orders" ON orders;

CREATE POLICY "orders_update_consolidated" ON orders
  FOR UPDATE TO authenticated
  USING (
    -- Admin can update all
    is_admin() OR
    -- Client can update own orders
    client_id = (select auth.uid()) OR
    -- Supplier can update assigned orders
    supplier_id = (select auth.uid()) OR
    -- Supplier can update when submitting offers
    (
      status IN ('pending', 'offers-received') AND
      zone_id IN (
        SELECT zone_id FROM supplier_zones 
        WHERE supplier_id = (select auth.uid()) 
        AND is_active = true
      )
    )
  )
  WITH CHECK (
    -- Admin can set any values
    is_admin() OR
    -- Client can update own orders
    client_id = (select auth.uid()) OR
    -- Supplier can update assigned orders
    supplier_id = (select auth.uid()) OR
    -- Supplier can update when submitting offers
    (
      status IN ('pending', 'offers-received') AND
      zone_id IN (
        SELECT zone_id FROM supplier_zones 
        WHERE supplier_id = (select auth.uid()) 
        AND is_active = true
      )
    )
  );

-- DELETE policy (from "Admins can manage all orders")
CREATE POLICY "orders_delete_consolidated" ON orders
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================================
-- PRODUCTS: Consolidate policies
-- ============================================================================

-- DELETE policies
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "products_delete_consolidated" ON products
  FOR DELETE TO authenticated
  USING (is_admin());

-- INSERT policies
DROP POLICY IF EXISTS "Admins can insert products" ON products;

CREATE POLICY "products_insert_consolidated" ON products
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- SELECT policies
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to view all products" ON products;
DROP POLICY IF EXISTS "Approved clients can view products" ON products;
DROP POLICY IF EXISTS "Approved suppliers can view products" ON products;

CREATE POLICY "products_select_consolidated" ON products
  FOR SELECT TO authenticated
  USING (
    -- Admin can view all
    is_admin() OR
    -- Client can view products
    is_client() OR
    -- Supplier can view products
    is_supplier()
  );

-- UPDATE policies
DROP POLICY IF EXISTS "Admins can update products" ON products;

CREATE POLICY "products_update_consolidated" ON products
  FOR UPDATE TO authenticated
  USING (is_admin());

-- ============================================================================
-- PROFILES: Consolidate policies
-- ============================================================================

-- SELECT policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "profiles_select_consolidated" ON profiles
  FOR SELECT TO authenticated
  USING (
    -- User can view own profile
    id = (select auth.uid()) OR
    -- Admin can view all profiles
    is_admin()
  );

-- UPDATE policies
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "profiles_update_consolidated" ON profiles
  FOR UPDATE TO authenticated
  USING (
    -- User can update own profile
    id = (select auth.uid()) OR
    -- Admin can update all profiles
    is_admin()
  )
  WITH CHECK (
    -- User can update own profile
    id = (select auth.uid()) OR
    -- Admin can update all profiles
    is_admin()
  );

-- ============================================================================
-- SUPPLIER_OFFERS: Consolidate policies
-- ============================================================================

-- INSERT policies
DROP POLICY IF EXISTS "Admins can manage all offers" ON supplier_offers;
DROP POLICY IF EXISTS "Suppliers can create offers for zone orders" ON supplier_offers;

CREATE POLICY "supplier_offers_insert_consolidated" ON supplier_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Admin can insert any offer
    is_admin() OR
    -- Supplier can create offers for zone orders
    (
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
    )
  );

-- SELECT policies
DROP POLICY IF EXISTS "Clients can view offers for their orders" ON supplier_offers;
DROP POLICY IF EXISTS "Suppliers can view own offers" ON supplier_offers;

CREATE POLICY "supplier_offers_select_consolidated" ON supplier_offers
  FOR SELECT TO authenticated
  USING (
    -- Admin can view all
    is_admin() OR
    -- Supplier can view own offers
    supplier_id = (select auth.uid()) OR
    -- Client can view offers for their orders
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = supplier_offers.order_id 
      AND orders.client_id = (select auth.uid())
    )
  );

-- UPDATE policies
DROP POLICY IF EXISTS "Clients can update offer status" ON supplier_offers;

CREATE POLICY "supplier_offers_update_consolidated" ON supplier_offers
  FOR UPDATE TO authenticated
  USING (
    -- Admin can update all
    is_admin() OR
    -- Client can update offer status for their orders
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = supplier_offers.order_id 
      AND orders.client_id = (select auth.uid())
    )
  );

-- DELETE policy
CREATE POLICY "supplier_offers_delete_consolidated" ON supplier_offers
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================================
-- SUPPLIER_ZONES: Consolidate policies
-- ============================================================================

-- DELETE policies
DROP POLICY IF EXISTS "Admins can manage zone requests" ON supplier_zones;
DROP POLICY IF EXISTS "Suppliers can delete own pending zone requests" ON supplier_zones;

CREATE POLICY "supplier_zones_delete_consolidated" ON supplier_zones
  FOR DELETE TO authenticated
  USING (
    -- Admin can delete all
    is_admin() OR
    -- Supplier can delete own pending zone requests
    (
      supplier_id = (select auth.uid()) 
      AND is_active = false 
      AND approved_by IS NULL
    )
  );

-- INSERT policies
DROP POLICY IF EXISTS "Suppliers can request zones" ON supplier_zones;

CREATE POLICY "supplier_zones_insert_consolidated" ON supplier_zones
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Admin can insert any
    is_admin() OR
    -- Supplier can request zones
    supplier_id = (select auth.uid())
  );

-- SELECT policies
DROP POLICY IF EXISTS "Admins can view all zone requests" ON supplier_zones;
DROP POLICY IF EXISTS "Authenticated users can view supplier zones" ON supplier_zones;
DROP POLICY IF EXISTS "Suppliers can view own zone requests" ON supplier_zones;

CREATE POLICY "supplier_zones_select_consolidated" ON supplier_zones
  FOR SELECT TO authenticated
  USING (
    -- Admin can view all
    is_admin() OR
    -- Supplier can view own zone requests
    supplier_id = (select auth.uid()) OR
    -- Any authenticated user can view supplier zones (for zone info display)
    true
  );

-- UPDATE policy
CREATE POLICY "supplier_zones_update_consolidated" ON supplier_zones
  FOR UPDATE TO authenticated
  USING (is_admin());

-- ============================================================================
-- TRANSFER_ORDERS: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all transfer orders" ON transfer_orders;
DROP POLICY IF EXISTS "Suppliers can view their own transfer orders" ON transfer_orders;

CREATE POLICY "transfer_orders_select_consolidated" ON transfer_orders
  FOR SELECT TO authenticated
  USING (
    -- Admin can view all
    is_admin() OR
    -- Supplier can view their own transfer orders
    EXISTS (
      SELECT 1 FROM transfers 
      WHERE transfers.id = transfer_orders.transfer_id 
      AND transfers.supplier_id = (select auth.uid())
    )
  );

CREATE POLICY "transfer_orders_other_consolidated" ON transfer_orders
  FOR ALL TO authenticated
  USING (is_admin());

-- ============================================================================
-- TRANSFERS: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all transfers" ON transfers;
DROP POLICY IF EXISTS "Suppliers can view their own transfers" ON transfers;

CREATE POLICY "transfers_select_consolidated" ON transfers
  FOR SELECT TO authenticated
  USING (
    -- Admin can view all
    is_admin() OR
    -- Supplier can view own transfers
    supplier_id = (select auth.uid())
  );

CREATE POLICY "transfers_other_consolidated" ON transfers
  FOR ALL TO authenticated
  USING (is_admin());

-- ============================================================================
-- USER_ACTIVITY_LOG: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Admins can read all activity logs" ON user_activity_log;
DROP POLICY IF EXISTS "Users can read own activity logs" ON user_activity_log;

CREATE POLICY "user_activity_log_select_consolidated" ON user_activity_log
  FOR SELECT TO authenticated
  USING (
    -- User can view own logs
    user_id = (select auth.uid()) OR
    -- Admin can view all logs
    is_admin()
  );

-- ============================================================================
-- ZONES: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view active zones" ON zones;
DROP POLICY IF EXISTS "Only admins can manage zones" ON zones;

CREATE POLICY "zones_select_consolidated" ON zones
  FOR SELECT TO authenticated
  USING (true);  -- Anyone can view zones

CREATE POLICY "zones_other_consolidated" ON zones
  FOR ALL TO authenticated
  USING (is_admin());