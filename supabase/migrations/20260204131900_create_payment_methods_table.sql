-- Migration: Create payment_methods and user_payment_preferences tables
-- Description: Moyens de paiement acceptés par Ravito + préférences utilisateurs

-- 1. Supprimer l'ancienne table si elle existe avec mauvaise structure
DROP TABLE IF EXISTS payment_methods CASCADE;

-- 2. Créer la table payment_methods (config Admin)
CREATE TABLE payment_methods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Configuration Admin (moyens acceptés par Ravito)
  name text NOT NULL UNIQUE,  -- 'wave', 'orange_money', 'mtn_money', 'bank_transfer', 'cash'
  display_name text NOT NULL,  -- 'Wave', 'Orange Money', etc.
  is_active boolean DEFAULT false,  -- Activé par l'admin
  phone_number text,  -- Numéro pour mobile money
  bank_name text,  -- Pour virement bancaire
  iban text,  -- Pour virement bancaire
  account_holder text,  -- Titulaire du compte
  instructions text,  -- Instructions personnalisées
  icon text,  -- Nom de l'icône
  display_order integer DEFAULT 0,  -- Ordre d'affichage
  
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- 3. Insérer les moyens de paiement par défaut
INSERT INTO payment_methods (name, display_name, is_active, icon, display_order) VALUES
  ('wave', 'Wave', true, 'smartphone', 1),
  ('orange_money', 'Orange Money', true, 'smartphone', 2),
  ('mtn_money', 'MTN Money', false, 'smartphone', 3),
  ('bank_transfer', 'Virement bancaire', false, 'building-2', 4),
  ('cash', 'Espèces', true, 'banknote', 5);

-- 4. Créer la table des préférences utilisateurs
CREATE TABLE IF NOT EXISTS user_payment_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id uuid NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  is_preferred boolean DEFAULT false,  -- Moyen préféré de l'utilisateur
  account_identifier text,  -- Numéro de téléphone/compte de l'utilisateur (optionnel)
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  
  UNIQUE(user_id, payment_method_id)
);

-- 5. RLS pour payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les moyens actifs
CREATE POLICY "Anyone can read active payment methods" 
  ON payment_methods 
  FOR SELECT 
  USING (is_active = true);

-- Les admins peuvent lire tous les moyens (même inactifs)
CREATE POLICY "Admins can read all payment methods" 
  ON payment_methods 
  FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can update payment methods" 
  ON payment_methods 
  FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. RLS pour user_payment_preferences
ALTER TABLE user_payment_preferences ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent gérer leurs propres préférences
CREATE POLICY "Users can manage their payment preferences" 
  ON user_payment_preferences 
  FOR ALL 
  USING (user_id = auth.uid());

-- Les admins peuvent voir toutes les préférences
CREATE POLICY "Admins can view all payment preferences" 
  ON user_payment_preferences 
  FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Index pour performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_order ON payment_methods(display_order);
CREATE INDEX IF NOT EXISTS idx_user_payment_prefs_user ON user_payment_preferences(user_id);