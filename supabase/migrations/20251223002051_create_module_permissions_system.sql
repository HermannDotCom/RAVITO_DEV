-- ============================================
-- DISTRI-NIGHT Module Permissions System
-- Phase 1: Database Setup
-- Migration: Create module permissions tables
-- ============================================

-- ============================================
-- 1. Create available_modules table
-- ============================================
CREATE TABLE IF NOT EXISTS available_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  interface VARCHAR(20) NOT NULL CHECK (interface IN ('supplier', 'client', 'admin')),
  is_owner_only BOOLEAN DEFAULT false,
  is_super_admin_only BOOLEAN DEFAULT false,
  is_always_accessible BOOLEAN DEFAULT false,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Create user_module_permissions table
-- ============================================
CREATE TABLE IF NOT EXISTS user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key VARCHAR(50) NOT NULL,
  has_access BOOLEAN DEFAULT false,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id, module_key)
);

-- ============================================
-- 3. Add delivery assignment columns to orders
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_delivery_user_id UUID REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_delivery_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_delivery_by UUID REFERENCES auth.users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_by_user_id UUID REFERENCES auth.users(id);

-- ============================================
-- 4. Insert initial module data
-- ============================================

-- Supplier interface modules
INSERT INTO available_modules (key, name, description, icon, interface, display_order, is_always_accessible, is_owner_only, is_super_admin_only)
VALUES 
  ('dashboard', 'Accueil', 'Tableau de bord principal', 'Home', 'supplier', 1, false, false, false),
  ('orders', 'Commandes', 'Voir et répondre aux commandes', 'Package', 'supplier', 2, false, false, false),
  ('deliveries', 'Livraisons', 'Suivi des livraisons actives', 'Truck', 'supplier', 3, false, false, false),
  ('delivery_mode', 'Mode Livreur', 'Vue simplifiée pour livreurs (livraisons assignées uniquement)', 'Navigation', 'supplier', 4, false, false, false),
  ('history', 'Historique', 'Historique des livraisons', 'History', 'supplier', 5, false, false, false),
  ('products', 'Produits vendus', 'Gestion stocks et prix', 'ShoppingBag', 'supplier', 6, false, false, false),
  ('zones', 'Mes Zones', 'Gestion zones de livraison', 'MapPin', 'supplier', 7, false, false, false),
  ('treasury', 'Revenus', 'Suivi financier', 'Wallet', 'supplier', 8, false, false, false),
  ('team', 'Mon équipe', 'Gestion des membres', 'Users', 'supplier', 9, false, false, false),
  ('support', 'Support', 'Contact support', 'HelpCircle', 'supplier', 10, false, false, false),
  ('profile', 'Profil', 'Informations personnelles', 'User', 'supplier', 11, true, false, false)
ON CONFLICT (key) DO NOTHING;

-- Client interface modules
INSERT INTO available_modules (key, name, description, icon, interface, display_order, is_always_accessible, is_owner_only, is_super_admin_only)
VALUES 
  ('dashboard', 'Accueil', 'Tableau de bord', 'Home', 'client', 1, false, false, false),
  ('catalog', 'Catalogue', 'Consultation des produits', 'ShoppingBag', 'client', 2, false, false, false),
  ('cart', 'Panier', 'Gestion du panier', 'ShoppingCart', 'client', 3, false, false, false),
  ('orders', 'Mes Commandes', 'Suivi des commandes', 'Package', 'client', 4, false, false, false),
  ('history', 'Historique', 'Historique des commandes', 'History', 'client', 5, false, false, false),
  ('treasury', 'Trésorerie', 'Suivi financier', 'Wallet', 'client', 6, false, false, false),
  ('team', 'Mon équipe', 'Gestion des membres', 'Users', 'client', 7, false, false, false),
  ('support', 'Support', 'Contact support', 'HelpCircle', 'client', 8, false, false, false),
  ('profile', 'Profil', 'Informations personnelles', 'User', 'client', 9, true, false, false)
ON CONFLICT (key) DO NOTHING;

-- Admin interface modules
INSERT INTO available_modules (key, name, description, icon, interface, display_order, is_always_accessible, is_owner_only, is_super_admin_only)
VALUES 
  ('admin_dashboard', 'Dashboard', 'Vue d''ensemble', 'LayoutDashboard', 'admin', 1, false, false, false),
  ('admin_users', 'Utilisateurs', 'Gestion utilisateurs', 'Users', 'admin', 2, false, false, false),
  ('admin_orders', 'Commandes', 'Toutes les commandes', 'Package', 'admin', 3, false, false, false),
  ('admin_products', 'Produits', 'Gestion catalogue', 'ShoppingBag', 'admin', 4, false, false, false),
  ('admin_zones', 'Zones', 'Gestion des zones', 'Map', 'admin', 5, false, false, false),
  ('admin_reference_prices', 'Prix de référence', 'Gestion des prix catalogue', 'Tag', 'admin', 6, false, false, false),
  ('admin_support', 'Support', 'Tickets support', 'MessageSquare', 'admin', 7, false, false, false),
  ('admin_treasury', 'Trésorerie', 'Gestion financière plateforme', 'Wallet', 'admin', 8, false, false, true),
  ('admin_commissions', 'Mes Commissions', 'Paramétrage commissions', 'Percent', 'admin', 9, false, false, true),
  ('admin_team', 'Mon équipe', 'Équipe admin', 'UserCog', 'admin', 10, false, false, true),
  ('admin_settings', 'Paramètres', 'Paramètres système', 'Settings', 'admin', 11, false, false, true),
  ('admin_data', 'Gestion données', 'Import/Export', 'Database', 'admin', 12, false, false, true)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 5. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_available_modules_interface ON available_modules(interface);
CREATE INDEX IF NOT EXISTS idx_available_modules_key ON available_modules(key);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_org_user ON user_module_permissions(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_module ON user_module_permissions(module_key);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_delivery_user ON orders(assigned_delivery_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_by_user ON orders(delivered_by_user_id);

-- ============================================
-- 6. Enable RLS on new tables
-- ============================================
ALTER TABLE available_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. Create RLS policies for available_modules
-- ============================================

-- All authenticated users can view all modules
CREATE POLICY "available_modules_select_all"
  ON available_modules FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 8. Create RLS policies for user_module_permissions
-- ============================================

-- Helper function to check if user is organization owner (bypasses RLS)
CREATE OR REPLACE FUNCTION is_organization_owner(org_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = org_id AND owner_id = auth.uid()
  );
END;
$$;

-- Helper function to check if user has team access in organization
CREATE OR REPLACE FUNCTION has_team_access(org_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is owner (owners always have team access)
  IF is_organization_owner(org_id) THEN
    RETURN true;
  END IF;
  
  -- Check if user has team module permission
  RETURN EXISTS (
    SELECT 1 FROM public.user_module_permissions 
    WHERE organization_id = org_id 
      AND user_id = auth.uid() 
      AND module_key = 'team' 
      AND has_access = true
  );
END;
$$;

-- SELECT: User can see their own permissions, or organization permissions if they're owner or have team access
CREATE POLICY "user_module_permissions_select"
  ON user_module_permissions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_organization_owner(organization_id)
    OR has_team_access(organization_id)
  );

-- INSERT: Only organization owner or users with team access can assign permissions
CREATE POLICY "user_module_permissions_insert"
  ON user_module_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    is_organization_owner(organization_id)
    OR has_team_access(organization_id)
  );

-- UPDATE: Only organization owner or users with team access can update permissions
CREATE POLICY "user_module_permissions_update"
  ON user_module_permissions FOR UPDATE
  TO authenticated
  USING (
    is_organization_owner(organization_id)
    OR has_team_access(organization_id)
  )
  WITH CHECK (
    is_organization_owner(organization_id)
    OR has_team_access(organization_id)
  );

-- DELETE: Only organization owner can delete permissions
CREATE POLICY "user_module_permissions_delete"
  ON user_module_permissions FOR DELETE
  TO authenticated
  USING (is_organization_owner(organization_id));

-- ============================================
-- 9. Create trigger for recording delivery user
-- ============================================

-- Function to record which user delivered an order
CREATE OR REPLACE FUNCTION record_delivery_user()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to 'delivered', record the assigned delivery user
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    NEW.delivered_by_user_id := NEW.assigned_delivery_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically record delivery user
DROP TRIGGER IF EXISTS trigger_record_delivery_user ON orders;
CREATE TRIGGER trigger_record_delivery_user
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION record_delivery_user();

-- ============================================
-- 10. Add updated_at trigger for user_module_permissions
-- ============================================

CREATE OR REPLACE FUNCTION update_user_module_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_module_permissions_updated_at
  BEFORE UPDATE ON user_module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_module_permissions_updated_at();

-- ============================================
-- 11. Grant necessary permissions
-- ============================================

-- Grant usage on tables to authenticated users
GRANT SELECT ON available_modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_module_permissions TO authenticated;

-- ============================================
-- End of migration
-- ============================================
