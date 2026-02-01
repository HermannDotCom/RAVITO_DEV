/*
  # Fix RLS policies for sales_objectives table
  
  ## Problem
  The Owner Admin cannot see sales objectives because the RLS policy checks for
  om.role = 'super_admin' but the Owner has role = 'owner' in organization_members.
  
  ## Solution
  Replace all existing policies with a single comprehensive policy that:
  - Allows Super Admin (via profiles.is_super_admin) full access
  - Allows Owner of Admin organization full access
  - Allows sales reps to view their own objectives
*/

-- 1. Drop ALL existing policies on sales_objectives
DROP POLICY IF EXISTS "Admins can view sales objectives" ON sales_objectives;
DROP POLICY IF EXISTS "Super admins can manage sales objectives" ON sales_objectives;
DROP POLICY IF EXISTS "sales_objectives_select" ON sales_objectives;
DROP POLICY IF EXISTS "sales_objectives_insert" ON sales_objectives;
DROP POLICY IF EXISTS "sales_objectives_update" ON sales_objectives;
DROP POLICY IF EXISTS "sales_objectives_delete" ON sales_objectives;
DROP POLICY IF EXISTS "admin_full_access_sales_objectives" ON sales_objectives;

-- 2. Create a single comprehensive policy for ALL operations
CREATE POLICY "admin_full_access_sales_objectives" ON sales_objectives
FOR ALL 
TO authenticated
USING (
  -- Super Admin via profiles.is_super_admin
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_super_admin = true
  )
  OR
  -- Owner of Admin organization
  EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.owner_id = auth.uid() AND o.type = 'admin'
  )
  OR
  -- Sales rep can view their own objectives
  EXISTS (
    SELECT 1 FROM sales_representatives sr
    WHERE sr.id = sales_objectives.sales_rep_id AND sr.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Only Super Admin and Owner Admin can create/modify
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.is_super_admin = true
  )
  OR
  EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.owner_id = auth.uid() AND o.type = 'admin'
  )
);
