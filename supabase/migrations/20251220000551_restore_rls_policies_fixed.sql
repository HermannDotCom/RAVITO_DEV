/*
  # Restore Missing RLS Policies (Fixed Version)

  Restores all RLS policies that were removed by CASCADE
*/

-- ==========================================
-- ORDERS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "orders_select_client" ON orders;
DROP POLICY IF EXISTS "orders_select_supplier" ON orders;
DROP POLICY IF EXISTS "orders_select_admin" ON orders;
DROP POLICY IF EXISTS "orders_insert_client" ON orders;
DROP POLICY IF EXISTS "orders_update_client" ON orders;
DROP POLICY IF EXISTS "orders_update_supplier" ON orders;
DROP POLICY IF EXISTS "orders_update_admin" ON orders;

CREATE POLICY "orders_select_client"
  ON orders FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "orders_select_supplier"
  ON orders FOR SELECT
  TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "orders_select_admin"
  ON orders FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "orders_insert_client"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "orders_update_client"
  ON orders FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "orders_update_supplier"
  ON orders FOR UPDATE
  TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==========================================
-- ORDER_ITEMS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_select_client" ON order_items;
DROP POLICY IF EXISTS "order_items_select_supplier" ON order_items;
DROP POLICY IF EXISTS "order_items_select_admin" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_client" ON order_items;

CREATE POLICY "order_items_select_client"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.client_id = auth.uid()
    )
  );

CREATE POLICY "order_items_select_supplier"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.supplier_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM orders o
      JOIN supplier_offers so ON so.order_id = o.id
      WHERE o.id = order_items.order_id
      AND so.supplier_id = auth.uid()
    )
  );

CREATE POLICY "order_items_select_admin"
  ON order_items FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "order_items_insert_client"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.client_id = auth.uid()
    )
  );

-- ==========================================
-- PROFILES TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_for_orders" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "profiles_select_for_orders"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE (orders.client_id = profiles.id OR orders.supplier_id = profiles.id)
      AND (orders.client_id = auth.uid() OR orders.supplier_id = auth.uid())
    )
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ==========================================
-- PRODUCTS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_insert_admin" ON products;
DROP POLICY IF EXISTS "products_update_admin" ON products;
DROP POLICY IF EXISTS "products_delete_admin" ON products;

CREATE POLICY "products_select_all"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- ==========================================
-- SUPPLIER_ZONES TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "supplier_zones_select_policy" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_select_own" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_select_admin" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_insert_own" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_update_own" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_delete_own" ON supplier_zones;

CREATE POLICY "supplier_zones_select_own"
  ON supplier_zones FOR SELECT
  TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "supplier_zones_select_admin"
  ON supplier_zones FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "supplier_zones_insert_own"
  ON supplier_zones FOR INSERT
  TO authenticated
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "supplier_zones_update_own"
  ON supplier_zones FOR UPDATE
  TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "supplier_zones_delete_own"
  ON supplier_zones FOR DELETE
  TO authenticated
  USING (supplier_id = auth.uid());

-- ==========================================
-- ZONES TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "zones_select_all" ON zones;
DROP POLICY IF EXISTS "zones_insert_admin" ON zones;
DROP POLICY IF EXISTS "zones_update_admin" ON zones;
DROP POLICY IF EXISTS "zones_delete_admin" ON zones;

CREATE POLICY "zones_select_all"
  ON zones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "zones_insert_admin"
  ON zones FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "zones_update_admin"
  ON zones FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "zones_delete_admin"
  ON zones FOR DELETE
  TO authenticated
  USING (is_admin());

-- ==========================================
-- SUPPLIER_OFFERS TABLE POLICIES
-- ==========================================

DROP POLICY IF EXISTS "supplier_offers_select_policy" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_insert_policy" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_select_client" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_select_supplier" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_select_admin" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_insert_supplier" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_update_supplier" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_update_client" ON supplier_offers;

CREATE POLICY "supplier_offers_select_client"
  ON supplier_offers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = supplier_offers.order_id
      AND orders.client_id = auth.uid()
    )
  );

CREATE POLICY "supplier_offers_select_supplier"
  ON supplier_offers FOR SELECT
  TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "supplier_offers_select_admin"
  ON supplier_offers FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "supplier_offers_insert_supplier"
  ON supplier_offers FOR INSERT
  TO authenticated
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "supplier_offers_update_supplier"
  ON supplier_offers FOR UPDATE
  TO authenticated
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "supplier_offers_update_client"
  ON supplier_offers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = supplier_offers.order_id
      AND orders.client_id = auth.uid()
    )
  );

-- ==========================================
-- RATINGS TABLE POLICIES (using correct column names)
-- ==========================================

DROP POLICY IF EXISTS "ratings_select_policy" ON ratings;
DROP POLICY IF EXISTS "ratings_select_own" ON ratings;
DROP POLICY IF EXISTS "ratings_select_admin" ON ratings;
DROP POLICY IF EXISTS "ratings_insert_own" ON ratings;
DROP POLICY IF EXISTS "ratings_update_own" ON ratings;

CREATE POLICY "ratings_select_own"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid()
  );

CREATE POLICY "ratings_select_admin"
  ON ratings FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "ratings_insert_own"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "ratings_update_own"
  ON ratings FOR UPDATE
  TO authenticated
  USING (from_user_id = auth.uid())
  WITH CHECK (from_user_id = auth.uid());
