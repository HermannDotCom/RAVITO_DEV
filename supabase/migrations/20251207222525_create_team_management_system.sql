-- ============================================
-- DISTRI-NIGHT Team Management System
-- Migration: Create team management tables
-- ============================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('client', 'supplier', 'admin')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members INTEGER NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id)
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invitation_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_type TEXT NOT NULL CHECK (organization_type IN ('client', 'supplier', 'admin')),
  role_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_type, role_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_status ON organization_members(status);
CREATE INDEX IF NOT EXISTS idx_organization_members_token ON organization_members(invitation_token);
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON role_permissions(organization_type, role_name);

-- Add updated_at trigger for organizations
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_organizations_updated_at();

-- Add updated_at trigger for organization_members
CREATE OR REPLACE FUNCTION update_organization_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_members_updated_at
BEFORE UPDATE ON organization_members
FOR EACH ROW
EXECUTE FUNCTION update_organization_members_updated_at();

-- ============================================
-- SQL Functions
-- ============================================

-- Function to get organization member count
CREATE OR REPLACE FUNCTION get_organization_member_count(org_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM organization_members
  WHERE organization_id = org_id AND status = 'active';
$$ LANGUAGE SQL STABLE;

-- Function to check if organization can add more members
CREATE OR REPLACE FUNCTION can_add_member(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  SELECT max_members INTO max_count
  FROM organizations
  WHERE id = org_id;

  SELECT get_organization_member_count(org_id) INTO current_count;

  RETURN current_count < max_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID, org_id UUID)
RETURNS JSONB AS $$
DECLARE
  member_record RECORD;
  role_perms JSONB;
BEGIN
  -- Check if user is organization owner
  IF EXISTS (
    SELECT 1 FROM organizations WHERE id = org_id AND owner_id = p_user_id
  ) THEN
    -- Owners have all permissions
    RETURN '{
      "catalog": {"view": true, "create": true, "edit": true, "delete": true},
      "orders": {"view": true, "create": true, "edit": true, "delete": true},
      "treasury": {"view": true, "manage": true},
      "team": {"view": true, "invite": true, "remove": true, "edit": true},
      "settings": {"view": true, "edit": true},
      "zones": {"view": true, "create": true, "edit": true, "delete": true},
      "deliveries": {"view": true, "manage": true},
      "analytics": {"view": true},
      "users": {"view": true, "create": true, "edit": true, "delete": true},
      "products": {"view": true, "create": true, "edit": true, "delete": true},
      "support": {"view": true, "manage": true}
    }'::jsonb;
  END IF;

  -- Get member's role and permissions
  SELECT om.role, om.permissions INTO member_record
  FROM organization_members om
  WHERE om.organization_id = org_id 
    AND om.user_id = p_user_id 
    AND om.status = 'active';

  IF NOT FOUND THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Get role permissions from role_permissions table
  SELECT rp.permissions INTO role_perms
  FROM role_permissions rp
  JOIN organizations o ON o.type = rp.organization_type
  WHERE o.id = org_id AND rp.role_name = member_record.role;

  IF role_perms IS NULL THEN
    role_perms := '{}'::jsonb;
  END IF;

  -- Merge role permissions with member-specific permissions
  RETURN role_perms || COALESCE(member_record.permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  org_id UUID,
  section TEXT,
  action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_perms JSONB;
BEGIN
  user_perms := get_user_permissions(p_user_id, org_id);
  
  RETURN COALESCE(
    (user_perms -> section ->> action)::boolean,
    false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to create organization with owner
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
    WHEN 'admin' THEN 5
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
    accepted_at
  )
  VALUES (
    new_org_id,
    p_owner_id,
    p_email,
    'owner',
    'active',
    NOW()
  );

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

CREATE POLICY "Users can create their own organization"
  ON organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Organization owners can update their organization"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Organization owners can delete their organization"
  ON organizations FOR DELETE
  USING (owner_id = auth.uid());

-- Organization members policies
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
              AND om.status = 'active'
          )
        )
    )
  );

CREATE POLICY "Organization owners can invite members"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
        AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND has_permission(auth.uid(), om.organization_id, 'team', 'invite')
    )
  );

CREATE POLICY "Organization owners and authorized members can update members"
  ON organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
        AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND has_permission(auth.uid(), om.organization_id, 'team', 'edit')
    )
    OR
    user_id = auth.uid() -- Members can update their own record (e.g., accepting invitation)
  );

CREATE POLICY "Organization owners can delete members"
  ON organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
        AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
        AND has_permission(auth.uid(), om.organization_id, 'team', 'remove')
    )
  );

-- Role permissions policies (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view role permissions"
  ON role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- Seed Role Permissions
-- ============================================

-- Client roles
INSERT INTO role_permissions (organization_type, role_name, display_name, description, permissions)
VALUES 
  ('client', 'owner', 'Propriétaire', 'Propriétaire du compte avec tous les droits', '{
    "catalog": {"view": true, "create": true, "edit": true, "delete": true},
    "orders": {"view": true, "create": true, "edit": true, "delete": true},
    "treasury": {"view": true, "manage": true},
    "team": {"view": true, "invite": true, "remove": true, "edit": true},
    "settings": {"view": true, "edit": true}
  }'::jsonb),
  ('client', 'manager', 'Manager', 'Gestion des commandes et du catalogue', '{
    "catalog": {"view": true, "create": true, "edit": true, "delete": false},
    "orders": {"view": true, "create": true, "edit": true, "delete": false},
    "treasury": {"view": true, "manage": false},
    "team": {"view": true, "invite": false, "remove": false, "edit": false},
    "settings": {"view": true, "edit": false}
  }'::jsonb),
  ('client', 'employee', 'Employé', 'Consultation et création de commandes', '{
    "catalog": {"view": true, "create": false, "edit": false, "delete": false},
    "orders": {"view": true, "create": true, "edit": false, "delete": false},
    "treasury": {"view": false, "manage": false},
    "team": {"view": true, "invite": false, "remove": false, "edit": false},
    "settings": {"view": false, "edit": false}
  }'::jsonb)
ON CONFLICT (organization_type, role_name) DO NOTHING;

-- Supplier roles
INSERT INTO role_permissions (organization_type, role_name, display_name, description, permissions)
VALUES 
  ('supplier', 'owner', 'Propriétaire', 'Propriétaire du compte avec tous les droits', '{
    "zones": {"view": true, "create": true, "edit": true, "delete": true},
    "orders": {"view": true, "create": true, "edit": true, "delete": true},
    "deliveries": {"view": true, "manage": true},
    "treasury": {"view": true, "manage": true},
    "team": {"view": true, "invite": true, "remove": true, "edit": true},
    "settings": {"view": true, "edit": true},
    "analytics": {"view": true}
  }'::jsonb),
  ('supplier', 'manager', 'Gestionnaire', 'Gestion des livraisons et commandes', '{
    "zones": {"view": true, "create": false, "edit": true, "delete": false},
    "orders": {"view": true, "create": true, "edit": true, "delete": false},
    "deliveries": {"view": true, "manage": true},
    "treasury": {"view": true, "manage": false},
    "team": {"view": true, "invite": false, "remove": false, "edit": false},
    "settings": {"view": true, "edit": false},
    "analytics": {"view": true}
  }'::jsonb),
  ('supplier', 'driver', 'Livreur', 'Gestion des livraisons en cours', '{
    "zones": {"view": true, "create": false, "edit": false, "delete": false},
    "orders": {"view": true, "create": false, "edit": false, "delete": false},
    "deliveries": {"view": true, "manage": true},
    "treasury": {"view": false, "manage": false},
    "team": {"view": false, "invite": false, "remove": false, "edit": false},
    "settings": {"view": false, "edit": false},
    "analytics": {"view": false}
  }'::jsonb)
ON CONFLICT (organization_type, role_name) DO NOTHING;

-- Admin roles
INSERT INTO role_permissions (organization_type, role_name, display_name, description, permissions)
VALUES 
  ('admin', 'super_admin', 'Super Admin', 'Administrateur avec tous les droits', '{
    "analytics": {"view": true},
    "users": {"view": true, "create": true, "edit": true, "delete": true},
    "orders": {"view": true, "create": true, "edit": true, "delete": true},
    "products": {"view": true, "create": true, "edit": true, "delete": true},
    "treasury": {"view": true, "manage": true},
    "zones": {"view": true, "create": true, "edit": true, "delete": true},
    "team": {"view": true, "invite": true, "remove": true, "edit": true},
    "settings": {"view": true, "edit": true},
    "support": {"view": true, "manage": true}
  }'::jsonb),
  ('admin', 'administrator', 'Administrateur', 'Gestion quotidienne de la plateforme', '{
    "analytics": {"view": true},
    "users": {"view": true, "create": true, "edit": true, "delete": false},
    "orders": {"view": true, "create": false, "edit": true, "delete": false},
    "products": {"view": true, "create": true, "edit": true, "delete": false},
    "treasury": {"view": true, "manage": false},
    "zones": {"view": true, "create": true, "edit": true, "delete": false},
    "team": {"view": true, "invite": false, "remove": false, "edit": false},
    "settings": {"view": true, "edit": false},
    "support": {"view": true, "manage": true}
  }'::jsonb),
  ('admin', 'support', 'Support', 'Assistance utilisateur et tickets', '{
    "analytics": {"view": false},
    "users": {"view": true, "create": false, "edit": false, "delete": false},
    "orders": {"view": true, "create": false, "edit": false, "delete": false},
    "products": {"view": true, "create": false, "edit": false, "delete": false},
    "treasury": {"view": false, "manage": false},
    "zones": {"view": true, "create": false, "edit": false, "delete": false},
    "team": {"view": false, "invite": false, "remove": false, "edit": false},
    "settings": {"view": false, "edit": false},
    "support": {"view": true, "manage": true}
  }'::jsonb)
ON CONFLICT (organization_type, role_name) DO NOTHING;

-- ============================================
-- Enable Realtime (optional)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE organization_members;
