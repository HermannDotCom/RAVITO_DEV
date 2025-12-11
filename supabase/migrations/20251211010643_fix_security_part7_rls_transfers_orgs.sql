/*
  # Fix Security Issues - Part 7: Optimize RLS for Transfers and Organizations
  
  Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row
*/

-- TRANSFERS TABLE
DROP POLICY IF EXISTS "Admins can manage all transfers" ON transfers;
CREATE POLICY "Admins can manage all transfers" ON transfers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Suppliers can view their own transfers" ON transfers;
CREATE POLICY "Suppliers can view their own transfers" ON transfers
  FOR SELECT TO authenticated
  USING (supplier_id = (select auth.uid()));

-- TRANSFER_ORDERS TABLE
DROP POLICY IF EXISTS "Admins can manage all transfer orders" ON transfer_orders;
CREATE POLICY "Admins can manage all transfer orders" ON transfer_orders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Suppliers can view their own transfer orders" ON transfer_orders;
CREATE POLICY "Suppliers can view their own transfer orders" ON transfer_orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transfers 
      WHERE transfers.id = transfer_orders.transfer_id 
      AND transfers.supplier_id = (select auth.uid())
    )
  );

-- RATINGS TABLE
DROP POLICY IF EXISTS "Order participants and admins can view ratings" ON ratings;
CREATE POLICY "Order participants and admins can view ratings" ON ratings
  FOR SELECT TO authenticated
  USING (
    from_user_id = (select auth.uid()) OR 
    to_user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ORGANIZATIONS TABLE
DROP POLICY IF EXISTS "organizations_select" ON organizations;
CREATE POLICY "organizations_select" ON organizations
  FOR SELECT TO authenticated
  USING (
    owner_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "organizations_insert" ON organizations;
CREATE POLICY "organizations_insert" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "organizations_update" ON organizations;
CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE TO authenticated
  USING (
    owner_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = (select auth.uid())
      AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "organizations_delete" ON organizations;
CREATE POLICY "organizations_delete" ON organizations
  FOR DELETE TO authenticated
  USING (owner_id = (select auth.uid()));

-- ORGANIZATION_MEMBERS TABLE
DROP POLICY IF EXISTS "org_members_select" ON organization_members;
CREATE POLICY "org_members_select" ON organization_members
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = organization_members.organization_id 
      AND owner_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM organization_members om 
      WHERE om.organization_id = organization_members.organization_id 
      AND om.user_id = (select auth.uid())
      AND om.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
CREATE POLICY "org_members_insert" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = organization_members.organization_id 
      AND owner_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM organization_members om 
      WHERE om.organization_id = organization_members.organization_id 
      AND om.user_id = (select auth.uid())
      AND om.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "org_members_update" ON organization_members;
CREATE POLICY "org_members_update" ON organization_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = organization_members.organization_id 
      AND owner_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM organization_members om 
      WHERE om.organization_id = organization_members.organization_id 
      AND om.user_id = (select auth.uid())
      AND om.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "org_members_delete" ON organization_members;
CREATE POLICY "org_members_delete" ON organization_members
  FOR DELETE TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = organization_members.organization_id 
      AND owner_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM organization_members om 
      WHERE om.organization_id = organization_members.organization_id 
      AND om.user_id = (select auth.uid())
      AND om.role IN ('admin', 'owner')
    )
  );