-- ============================================
-- RAVITO Team Management System Refactor
-- Migration: Transform invitation system to direct member creation
-- ============================================

-- ============================================
-- 1. CREATE CUSTOM_ROLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_type TEXT NOT NULL CHECK (organization_type IN ('client', 'supplier', 'admin')),
  role_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  allowed_pages TEXT[] NOT NULL,
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_type, role_key)
);

-- Create indexes for custom_roles
CREATE INDEX IF NOT EXISTS idx_custom_roles_org_type ON custom_roles(organization_type);
CREATE INDEX IF NOT EXISTS idx_custom_roles_key ON custom_roles(role_key);
CREATE INDEX IF NOT EXISTS idx_custom_roles_active ON custom_roles(is_active);

-- Add updated_at trigger for custom_roles
CREATE OR REPLACE FUNCTION update_custom_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_roles_updated_at
BEFORE UPDATE ON custom_roles
FOR EACH ROW
EXECUTE FUNCTION update_custom_roles_updated_at();

-- ============================================
-- 2. MODIFY ORGANIZATION_MEMBERS TABLE
-- ============================================

-- Add new columns to organization_members
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES custom_roles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allowed_pages TEXT[],
ADD COLUMN IF NOT EXISTS password_set_by_owner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_organization_members_custom_role ON organization_members(custom_role_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_is_active ON organization_members(is_active);
CREATE INDEX IF NOT EXISTS idx_organization_members_last_login ON organization_members(last_login_at);

-- ============================================
-- 3. UPDATE ORGANIZATION MAX_MEMBERS FOR ADMIN
-- ============================================

-- Update existing admin organizations to have max 40 members
UPDATE organizations 
SET max_members = 40 
WHERE type = 'admin' AND max_members < 40;

-- Update the create_organization_with_owner function to use new quotas
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  p_name TEXT,
  p_type TEXT,
  p_owner_id UUID,
  p_email TEXT
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  max_members_count INTEGER;
BEGIN
  -- Determine max members based on type
  max_members_count := CASE p_type
    WHEN 'client' THEN 2
    WHEN 'supplier' THEN 2
    WHEN 'admin' THEN 40  -- Updated from 5 to 40
    ELSE 2
  END;

  -- Create organization
  INSERT INTO organizations (name, type, owner_id, max_members)
  VALUES (p_name, p_type, p_owner_id, max_members_count)
  RETURNING id INTO new_org_id;

  -- Add owner as active member with owner role
  INSERT INTO organization_members (
    organization_id,
    user_id,
    email,
    role,
    status,
    is_active,
    accepted_at
  )
  VALUES (
    new_org_id,
    p_owner_id,
    p_email,
    CASE p_type
      WHEN 'admin' THEN 'super_admin'
      ELSE 'owner'
    END,
    'active',
    true,
    NOW()
  );

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. SEED PREDEFINED ROLES INTO CUSTOM_ROLES
-- ============================================

-- Client roles
INSERT INTO custom_roles (organization_type, role_key, display_name, description, allowed_pages, is_system_role) VALUES
('client', 'owner', 'Propriétaire', 'Accès complet à toutes les fonctionnalités', 
  ARRAY['dashboard', 'catalog', 'cart', 'orders', 'profile', 'treasury', 'team', 'support'], 
  true),
('client', 'manager', 'Gérant', 'Gère le catalogue et les commandes', 
  ARRAY['dashboard', 'catalog', 'cart', 'orders', 'treasury'], 
  false),
('client', 'employee', 'Employé', 'Crée des commandes, accès limité', 
  ARRAY['dashboard', 'catalog', 'cart', 'orders'], 
  false)
ON CONFLICT (organization_type, role_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  allowed_pages = EXCLUDED.allowed_pages,
  is_system_role = EXCLUDED.is_system_role;

-- Supplier roles
INSERT INTO custom_roles (organization_type, role_key, display_name, description, allowed_pages, is_system_role) VALUES
('supplier', 'owner', 'Propriétaire', 'Accès complet à toutes les fonctionnalités', 
  ARRAY['dashboard', 'delivery-mode', 'orders', 'deliveries', 'treasury', 'zones', 'pricing', 'team', 'history', 'support', 'profile'], 
  true),
('supplier', 'manager', 'Gestionnaire', 'Gère les commandes et livraisons', 
  ARRAY['dashboard', 'orders', 'deliveries', 'treasury', 'history'], 
  false),
('supplier', 'driver', 'Livreur', 'Mode livreur uniquement', 
  ARRAY['dashboard', 'delivery-mode', 'deliveries'], 
  false)
ON CONFLICT (organization_type, role_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  allowed_pages = EXCLUDED.allowed_pages,
  is_system_role = EXCLUDED.is_system_role;

-- Admin roles
INSERT INTO custom_roles (organization_type, role_key, display_name, description, allowed_pages, is_system_role) VALUES
('admin', 'super_admin', 'Super Admin', 'Accès complet incluant pages exclusives', 
  ARRAY['analytics', 'users', 'orders', 'products', 'pricing', 'treasury', 'commissions', 'zones', 'team', 'tickets', 'data', 'settings'], 
  true),
('admin', 'administrator', 'Administrateur', 'Gestion opérationnelle quotidienne', 
  ARRAY['analytics', 'users', 'orders', 'products', 'treasury', 'zones'], 
  false),
('admin', 'support', 'Support', 'Assistance utilisateurs et tickets', 
  ARRAY['users', 'orders', 'tickets'], 
  false),
('admin', 'analyst', 'Analyste', 'Rapports et statistiques', 
  ARRAY['analytics', 'orders', 'treasury'], 
  false),
('admin', 'catalog_manager', 'Gestionnaire Catalogue', 'Produits et prix de référence', 
  ARRAY['products', 'pricing'], 
  false),
('admin', 'zone_manager', 'Gestionnaire Zones', 'Zones de livraison', 
  ARRAY['zones', 'users'], 
  false)
ON CONFLICT (organization_type, role_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  allowed_pages = EXCLUDED.allowed_pages,
  is_system_role = EXCLUDED.is_system_role;

-- ============================================
-- 5. CREATE HELPER FUNCTIONS FOR ROLE MANAGEMENT
-- ============================================

-- Function to get custom role by key
CREATE OR REPLACE FUNCTION get_custom_role(
  p_org_type TEXT,
  p_role_key TEXT
)
RETURNS custom_roles AS $$
  SELECT * FROM custom_roles
  WHERE organization_type = p_org_type
    AND role_key = p_role_key
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to get allowed pages for a member
CREATE OR REPLACE FUNCTION get_member_allowed_pages(
  p_member_id UUID
)
RETURNS TEXT[] AS $$
DECLARE
  member_record RECORD;
  role_pages TEXT[];
BEGIN
  -- Get member data
  SELECT 
    om.custom_role_id,
    om.allowed_pages,
    om.role,
    o.type as org_type
  INTO member_record
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.id = p_member_id;

  IF NOT FOUND THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  -- If member has custom_role_id, get pages from custom_roles
  IF member_record.custom_role_id IS NOT NULL THEN
    SELECT allowed_pages INTO role_pages
    FROM custom_roles
    WHERE id = member_record.custom_role_id;
    
    RETURN COALESCE(role_pages, ARRAY[]::TEXT[]);
  END IF;

  -- If member has allowed_pages directly, return them
  IF member_record.allowed_pages IS NOT NULL AND array_length(member_record.allowed_pages, 1) > 0 THEN
    RETURN member_record.allowed_pages;
  END IF;

  -- Fallback: get pages from role_key in custom_roles
  SELECT allowed_pages INTO role_pages
  FROM custom_roles
  WHERE organization_type = member_record.org_type
    AND role_key = member_record.role
    AND is_active = true;

  RETURN COALESCE(role_pages, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if member has access to a specific page
CREATE OR REPLACE FUNCTION member_has_page_access(
  p_member_id UUID,
  p_page_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  allowed_pages TEXT[];
BEGIN
  allowed_pages := get_member_allowed_pages(p_member_id);
  RETURN p_page_key = ANY(allowed_pages);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update member login stats
CREATE OR REPLACE FUNCTION update_member_login_stats(
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE organization_members
  SET 
    last_login_at = NOW(),
    login_count = COALESCE(login_count, 0) + 1
  WHERE user_id = p_user_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. UPDATE RLS POLICIES
-- ============================================

-- Enable RLS on custom_roles
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view custom roles
CREATE POLICY "Authenticated users can view custom roles"
  ON custom_roles FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Policy: Only super admins can create custom roles
CREATE POLICY "Super admins can create custom roles"
  ON custom_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND o.type = 'admin'
        AND om.role = 'super_admin'
        AND om.is_active = true
    )
  );

-- Policy: Only super admins can update non-system custom roles
CREATE POLICY "Super admins can update non-system custom roles"
  ON custom_roles FOR UPDATE
  USING (
    is_system_role = false
    AND EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND o.type = 'admin'
        AND om.role = 'super_admin'
        AND om.is_active = true
    )
  );

-- Policy: Only super admins can delete non-system custom roles
CREATE POLICY "Super admins can delete non-system custom roles"
  ON custom_roles FOR DELETE
  USING (
    is_system_role = false
    AND EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND o.type = 'admin'
        AND om.role = 'super_admin'
        AND om.is_active = true
    )
  );

-- Update organization_members policies to consider is_active status
DROP POLICY IF EXISTS "Members can view their organization's members" ON organization_members;
CREATE POLICY "Members can view their organization's members"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND (
          o.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = o.id
              AND om.user_id = auth.uid()
              AND om.is_active = true
          )
        )
    )
  );

-- ============================================
-- 7. MIGRATE EXISTING DATA
-- ============================================

-- Set is_active = true for all currently active members
UPDATE organization_members
SET is_active = true
WHERE status = 'active' AND is_active IS NULL;

-- Set is_active = false for inactive members
UPDATE organization_members
SET is_active = false
WHERE status = 'inactive' AND is_active IS NULL;

-- Link existing members to custom_roles based on their role
UPDATE organization_members om
SET custom_role_id = cr.id
FROM organizations o, custom_roles cr
WHERE om.organization_id = o.id
  AND cr.organization_type = o.type
  AND cr.role_key = om.role
  AND om.custom_role_id IS NULL;

-- ============================================
-- 8. ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE custom_roles;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE custom_roles IS 'Stores custom roles with page-based permissions for each organization type';
COMMENT ON COLUMN custom_roles.organization_type IS 'Type of organization this role applies to: client, supplier, or admin';
COMMENT ON COLUMN custom_roles.role_key IS 'Unique identifier for the role within the organization type';
COMMENT ON COLUMN custom_roles.allowed_pages IS 'Array of page IDs this role can access';
COMMENT ON COLUMN custom_roles.is_system_role IS 'System roles (owner, super_admin) cannot be modified or deleted';

COMMENT ON COLUMN organization_members.custom_role_id IS 'Reference to custom_roles table for Admin type organizations';
COMMENT ON COLUMN organization_members.is_active IS 'Whether the member account is active and can login';
COMMENT ON COLUMN organization_members.allowed_pages IS 'Direct page access for Client/Supplier types (bypasses role pages)';
COMMENT ON COLUMN organization_members.password_set_by_owner IS 'Indicates if the password was set by the organization owner during creation';
COMMENT ON COLUMN organization_members.last_login_at IS 'Timestamp of the last successful login';
COMMENT ON COLUMN organization_members.login_count IS 'Total number of successful logins';
