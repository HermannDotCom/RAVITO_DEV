/*
  # Restore Complete RLS Policies for All Tables
  
  This migration addresses critical regressions introduced by previous security migrations
  where policies were dropped but not properly recreated, causing:
  - Orders invisible to all users (admin, client, supplier)
  - Organizations/teams invisible
  - Order items invisible
  - Supplier offers invisible
  
  This migration ensures ALL necessary policies exist for proper data visibility.
*/

-- ============================================================================
-- ORDERS: Ensure all policies exist and work correctly
-- ============================================================================

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "orders_select_consolidated" ON orders;
DROP POLICY IF EXISTS "orders_insert_consolidated" ON orders;
DROP POLICY IF EXISTS "orders_update_consolidated" ON orders;
DROP POLICY IF EXISTS "orders_delete_consolidated" ON orders;

-- SELECT: Admin sees all, clients see own, suppliers see assigned + zone orders
CREATE POLICY "orders_select_all_roles" ON orders
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    client_id = auth.uid() OR
    supplier_id = auth.uid() OR
    (
      zone_id IN (
        SELECT zone_id FROM supplier_zones 
        WHERE supplier_id = auth.uid() 
        AND is_active = true
      )
    )
  );

-- INSERT: Admin and approved clients can create orders
CREATE POLICY "orders_insert_policy" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR
    (client_id = auth.uid() AND is_client())
  );

-- UPDATE: Admin can update all, clients can update own, suppliers can update assigned
CREATE POLICY "orders_update_policy" ON orders
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR
    client_id = auth.uid() OR
    supplier_id = auth.uid() OR
    (
      zone_id IN (
        SELECT zone_id FROM supplier_zones 
        WHERE supplier_id = auth.uid() 
        AND is_active = true
      )
    )
  )
  WITH CHECK (
    is_admin() OR
    client_id = auth.uid() OR
    supplier_id = auth.uid() OR
    (
      zone_id IN (
        SELECT zone_id FROM supplier_zones 
        WHERE supplier_id = auth.uid() 
        AND is_active = true
      )
    )
  );

-- DELETE: Admin only
CREATE POLICY "orders_delete_policy" ON orders
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================================
-- ORDER_ITEMS: Ensure all policies exist
-- ============================================================================

DROP POLICY IF EXISTS "order_items_select_consolidated" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_update_policy" ON order_items;
DROP POLICY IF EXISTS "order_items_delete_policy" ON order_items;

-- SELECT: Can view order items if can view the order
CREATE POLICY "order_items_select_all_roles" ON order_items
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (
        orders.client_id = auth.uid() OR
        orders.supplier_id = auth.uid() OR
        orders.zone_id IN (
          SELECT zone_id FROM supplier_zones 
          WHERE supplier_id = auth.uid() 
          AND is_active = true
        )
      )
    )
  );

-- INSERT: Can insert order items if can insert the order
CREATE POLICY "order_items_insert_policy" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.client_id = auth.uid()
    )
  );

-- UPDATE: Admin only
CREATE POLICY "order_items_update_policy" ON order_items
  FOR UPDATE TO authenticated
  USING (is_admin());

-- DELETE: Admin only
CREATE POLICY "order_items_delete_policy" ON order_items
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================================
-- ZONES: Ensure everyone can view zones
-- ============================================================================

DROP POLICY IF EXISTS "zones_select_consolidated" ON zones;
DROP POLICY IF EXISTS "zones_other_consolidated" ON zones;

CREATE POLICY "zones_select_all_authenticated" ON zones
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "zones_manage_admin_only" ON zones
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- ORGANIZATIONS: Ensure visibility for members
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Admins can view all organizations" ON organizations;

CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

-- Keep existing INSERT/UPDATE/DELETE policies for organizations
CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR is_admin());

CREATE POLICY "organizations_delete_policy" ON organizations
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR is_admin());

-- ============================================================================
-- ORGANIZATION_MEMBERS: Ensure visibility for members
-- ============================================================================

DROP POLICY IF EXISTS "Members can view their organization's members" ON organization_members;

CREATE POLICY "organization_members_select_policy" ON organization_members
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND (
          o.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = o.id
              AND om.user_id = auth.uid()
              AND om.status = 'active'
          )
        )
    )
  );

-- Keep existing INSERT/UPDATE/DELETE policies for organization_members
CREATE POLICY "organization_members_insert_policy" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
        AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND has_permission(auth.uid(), om.organization_id, 'team', 'invite')
    )
  );

CREATE POLICY "organization_members_update_policy" ON organization_members
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
        AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND has_permission(auth.uid(), om.organization_id, 'team', 'edit')
    ) OR
    user_id = auth.uid()
  );

CREATE POLICY "organization_members_delete_policy" ON organization_members
  FOR DELETE TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
        AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND has_permission(auth.uid(), om.organization_id, 'team', 'remove')
    )
  );

-- ============================================================================
-- SUPPLIER_OFFERS: Ensure all roles can see relevant offers
-- ============================================================================

DROP POLICY IF EXISTS "supplier_offers_select_consolidated" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_insert_consolidated" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_update_consolidated" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_delete_consolidated" ON supplier_offers;

-- SELECT: Suppliers see own, clients see offers for their orders, admin sees all
CREATE POLICY "supplier_offers_select_all_roles" ON supplier_offers
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    supplier_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = supplier_offers.order_id 
      AND orders.client_id = auth.uid()
    )
  );

-- INSERT: Suppliers can create offers, admins can create any
CREATE POLICY "supplier_offers_insert_policy" ON supplier_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR
    (
      supplier_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = supplier_offers.order_id 
        AND orders.zone_id IN (
          SELECT zone_id FROM supplier_zones 
          WHERE supplier_id = auth.uid() 
          AND is_active = true
        )
        AND orders.status IN ('pending', 'offers-received')
      )
    )
  );

-- UPDATE: Clients can update offer status (accept/reject), admins can update all
CREATE POLICY "supplier_offers_update_policy" ON supplier_offers
  FOR UPDATE TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = supplier_offers.order_id 
      AND orders.client_id = auth.uid()
    )
  );

-- DELETE: Admin only
CREATE POLICY "supplier_offers_delete_policy" ON supplier_offers
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================================
-- SUPPLIER_ZONES: Ensure proper visibility
-- ============================================================================

DROP POLICY IF EXISTS "supplier_zones_select_consolidated" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_insert_consolidated" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_update_consolidated" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_delete_consolidated" ON supplier_zones;

-- SELECT: Everyone can see supplier zones (for zone information display)
CREATE POLICY "supplier_zones_select_all" ON supplier_zones
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Suppliers can request zones, admins can insert any
CREATE POLICY "supplier_zones_insert_policy" ON supplier_zones
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin() OR
    supplier_id = auth.uid()
  );

-- UPDATE: Admins can update all, suppliers can update own
CREATE POLICY "supplier_zones_update_policy" ON supplier_zones
  FOR UPDATE TO authenticated
  USING (is_admin() OR supplier_id = auth.uid());

-- DELETE: Admins can delete all, suppliers can delete own pending requests
CREATE POLICY "supplier_zones_delete_policy" ON supplier_zones
  FOR DELETE TO authenticated
  USING (
    is_admin() OR
    (
      supplier_id = auth.uid() AND
      is_active = false AND
      approved_by IS NULL
    )
  );

-- ============================================================================
-- PRODUCTS: Ensure all authenticated users can view products
-- ============================================================================

DROP POLICY IF EXISTS "products_select_consolidated" ON products;
DROP POLICY IF EXISTS "products_insert_consolidated" ON products;
DROP POLICY IF EXISTS "products_update_consolidated" ON products;
DROP POLICY IF EXISTS "products_delete_consolidated" ON products;

-- SELECT: All authenticated users can view products
CREATE POLICY "products_select_all_authenticated" ON products
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Admin only
CREATE POLICY "products_insert_admin_only" ON products
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- UPDATE: Admin only
CREATE POLICY "products_update_admin_only" ON products
  FOR UPDATE TO authenticated
  USING (is_admin());

-- DELETE: Admin only
CREATE POLICY "products_delete_admin_only" ON products
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================================
-- TRANSFERS: Ensure proper visibility
-- ============================================================================

DROP POLICY IF EXISTS "transfers_select_consolidated" ON transfers;
DROP POLICY IF EXISTS "transfers_other_consolidated" ON transfers;

CREATE POLICY "transfers_select_policy" ON transfers
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    supplier_id = auth.uid()
  );

CREATE POLICY "transfers_manage_admin_only" ON transfers
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- TRANSFER_ORDERS: Ensure proper visibility
-- ============================================================================

DROP POLICY IF EXISTS "transfer_orders_select_consolidated" ON transfer_orders;
DROP POLICY IF EXISTS "transfer_orders_other_consolidated" ON transfer_orders;

CREATE POLICY "transfer_orders_select_policy" ON transfer_orders
  FOR SELECT TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM transfers 
      WHERE transfers.id = transfer_orders.transfer_id 
      AND transfers.supplier_id = auth.uid()
    )
  );

CREATE POLICY "transfer_orders_manage_admin_only" ON transfer_orders
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- PROFILES: Ensure consolidated policies exist (already fixed but verify)
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select_consolidated" ON profiles;
DROP POLICY IF EXISTS "profiles_update_consolidated" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

CREATE POLICY "profiles_select_all_roles" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    is_admin()
  );

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_all_roles" ON profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid() OR
    is_admin()
  )
  WITH CHECK (
    id = auth.uid() OR
    is_admin()
  );

CREATE POLICY "profiles_delete_admin_only" ON profiles
  FOR DELETE TO authenticated
  USING (is_admin());
