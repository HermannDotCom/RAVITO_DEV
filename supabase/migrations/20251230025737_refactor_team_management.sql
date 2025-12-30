-- ============================================================
-- MIGRATION: Refonte Team Management
-- Date: 2025-12-30
-- Description: Création directe de membres, permissions par page, gestion rôles
-- ============================================================

-- 1. Créer la table d'historisation des migrations (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ DEFAULT now(),
  executed_by TEXT DEFAULT current_user,
  description TEXT,
  success BOOLEAN DEFAULT true
);

-- 2. Vérifier si cette migration a déjà été exécutée
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM migration_history WHERE migration_name = '20251230_refactor_team_management') THEN
    RAISE EXCEPTION 'Migration 20251230_refactor_team_management already executed on %', 
      (SELECT executed_at FROM migration_history WHERE migration_name = '20251230_refactor_team_management');
  END IF;
END $$;

-- 3. Créer la table custom_roles
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_type TEXT NOT NULL CHECK (organization_type IN ('client', 'supplier', 'admin')),
  role_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  allowed_pages TEXT[] NOT NULL,
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_type, role_key)
);

-- 4. Ajouter les colonnes manquantes à organization_members
ALTER TABLE organization_members 
ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES custom_roles(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allowed_pages TEXT[],
ADD COLUMN IF NOT EXISTS password_set_by_owner BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- 5. Mettre à jour le quota Admin de 5 à 40
UPDATE organizations SET max_members = 40 WHERE type = 'admin';

-- 6. Insérer les rôles prédéfinis (ignorer si déjà existants)
INSERT INTO custom_roles (organization_type, role_key, display_name, description, allowed_pages, is_system_role) VALUES
-- Client roles
('client', 'owner', 'Propriétaire', 'Accès complet à toutes les fonctionnalités', ARRAY['dashboard', 'catalog', 'cart', 'orders', 'profile', 'treasury', 'team', 'support'], true),
('client', 'manager', 'Gérant', 'Gère le catalogue et les commandes', ARRAY['dashboard', 'catalog', 'cart', 'orders', 'treasury'], false),
('client', 'employee', 'Employé', 'Crée des commandes, accès limité', ARRAY['dashboard', 'catalog', 'cart', 'orders'], false),
-- Supplier roles
('supplier', 'owner', 'Propriétaire', 'Accès complet à toutes les fonctionnalités', ARRAY['dashboard', 'delivery-mode', 'orders', 'deliveries', 'treasury', 'zones', 'pricing', 'team', 'history', 'support', 'profile'], true),
('supplier', 'manager', 'Gestionnaire', 'Gère les commandes et livraisons', ARRAY['dashboard', 'orders', 'deliveries', 'treasury', 'history'], false),
('supplier', 'driver', 'Livreur', 'Mode livreur uniquement', ARRAY['dashboard', 'delivery-mode', 'deliveries'], false),
-- Admin roles
('admin', 'super_admin', 'Super Admin', 'Accès complet incluant pages exclusives', ARRAY['analytics', 'users', 'orders', 'products', 'pricing', 'treasury', 'commissions', 'zones', 'team', 'tickets', 'data', 'settings'], true),
('admin', 'administrator', 'Administrateur', 'Gestion opérationnelle quotidienne', ARRAY['analytics', 'users', 'orders', 'products', 'treasury', 'zones'], false),
('admin', 'support', 'Support', 'Assistance utilisateurs et tickets', ARRAY['users', 'orders', 'tickets'], false),
('admin', 'analyst', 'Analyste', 'Rapports et statistiques', ARRAY['analytics', 'orders', 'treasury'], false),
('admin', 'catalog_manager', 'Gestionnaire Catalogue', 'Produits et prix de référence', ARRAY['products', 'pricing'], false),
('admin', 'zone_manager', 'Gestionnaire Zones', 'Zones de livraison', ARRAY['zones', 'users'], false)
ON CONFLICT (organization_type, role_key) DO NOTHING;

-- 7. Activer RLS sur custom_roles
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- 8. Politiques RLS pour custom_roles
DROP POLICY IF EXISTS "Anyone can view active roles" ON custom_roles;
CREATE POLICY "Anyone can view active roles" ON custom_roles
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Super admin can manage roles" ON custom_roles;
CREATE POLICY "Super admin can manage roles" ON custom_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN organization_members om ON om.user_id = p.id
      JOIN organizations o ON o.id = om. organization_id
      WHERE p.id = auth.uid()
        AND o.type = 'admin'
        AND o.owner_id = p.id
    )
  );

-- 9. Index pour performance
CREATE INDEX IF NOT EXISTS idx_custom_roles_org_type ON custom_roles(organization_type);
CREATE INDEX IF NOT EXISTS idx_custom_roles_role_key ON custom_roles(role_key);
CREATE INDEX IF NOT EXISTS idx_org_members_custom_role ON organization_members(custom_role_id);
CREATE INDEX IF NOT EXISTS idx_org_members_is_active ON organization_members(is_active);

-- 10. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_custom_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_custom_roles_updated_at ON custom_roles;
CREATE TRIGGER trigger_custom_roles_updated_at
  BEFORE UPDATE ON custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_roles_updated_at();

-- 12. Enregistrer la migration dans l'historique
INSERT INTO migration_history (migration_name, description)
VALUES (
  '20251230_refactor_team_management',
  'Refonte Team Management:  custom_roles table, nouvelles colonnes organization_members, quota Admin 40, rôles prédéfinis'
);

-- 13. Afficher le résultat
SELECT 
  '✅ Migration 20251230_refactor_team_management exécutée avec succès!' as status,
  now() as executed_at,
  (SELECT COUNT(*) FROM custom_roles) as roles_created,
  (SELECT max_members FROM organizations WHERE type = 'admin' LIMIT 1) as admin_quota;
