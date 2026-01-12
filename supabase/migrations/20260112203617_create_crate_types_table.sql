-- ============================================
-- Table crate_types : Configuration des emballages
-- ============================================

CREATE TABLE IF NOT EXISTS crate_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  short_label VARCHAR(50),
  description TEXT,
  is_consignable BOOLEAN DEFAULT false,
  icon VARCHAR(10) DEFAULT '📦',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_crate_types_is_consignable ON crate_types(is_consignable);

CREATE INDEX idx_crate_types_is_active ON crate_types(is_active);

-- Données initiales
INSERT INTO crate_types (code, label, short_label, description, is_consignable, icon, display_order) VALUES
  ('B33', 'Casier 33cl (24 bout.)', '24×33cl', '24 bouteilles de 33cl', true, '🍺', 1);

INSERT INTO crate_types (code, label, short_label, description, is_consignable, icon, display_order) VALUES
  ('B65', 'Casier 65cl (12 bout.)', '12×65cl', '12 bouteilles de 65cl', true, '🍺', 2);

INSERT INTO crate_types (code, label, short_label, description, is_consignable, icon, display_order) VALUES
  ('B100', 'Casier Bock 100cl', 'Bock 100cl', 'Bock 100cl', true, '🍺', 3);

INSERT INTO crate_types (code, label, short_label, description, is_consignable, icon, display_order) VALUES
  ('B50V', 'Casier Vin 50cl', 'Vin 50cl', 'Vin Valpière 50cl', true, '🍷', 4);

INSERT INTO crate_types (code, label, short_label, description, is_consignable, icon, display_order) VALUES
  ('B100V', 'Casier Vin 100cl', 'Vin 100cl', 'Vin Valpière 100cl', true, '🍷', 5);

INSERT INTO crate_types (code, label, short_label, description, is_consignable, icon, display_order) VALUES
  ('C6', 'Casier 6×1.5L', '6×1.5L', '6 bouteilles de 1.5L', false, '💧', 6);

INSERT INTO crate_types (code, label, short_label, description, is_consignable, icon, display_order) VALUES
  ('C20', 'Casier 20 bouteilles', '20 bout.', '20 bouteilles', false, '📦', 7);

INSERT INTO crate_types (code, label, short_label, description, is_consignable, icon, display_order) VALUES
  ('CARTON24', 'Carton 24 unités', 'Carton 24', 'Emballage jetable', false, '📦', 8);

INSERT INTO crate_types (code, label, short_label, description, is_consignable, icon, display_order) VALUES
  ('PACK6', 'Pack 6 unités', 'Pack 6', 'Emballage jetable', false, '📦', 9);

INSERT INTO crate_types (code, label, short_label, description, is_consignable, icon, display_order) VALUES
  ('PACK12', 'Pack 12 unités', 'Pack 12', 'Emballage jetable', false, '📦', 10);

-- RLS Policies
ALTER TABLE crate_types ENABLE ROW LEVEL SECURITY;

-- Lecture publique (tous les utilisateurs authentifiés)
CREATE POLICY "crate_types_select_policy" ON crate_types
  FOR SELECT TO authenticated USING (true);

-- Modification réservée aux admins (vérifier via user metadata ou rôle)
CREATE POLICY "crate_types_update_policy" ON crate_types
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE crate_types IS 'Configuration des types d emballages et leur caractère consignable';
