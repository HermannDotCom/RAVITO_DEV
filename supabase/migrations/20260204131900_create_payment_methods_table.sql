-- Create payment_methods table for configurable payment options
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE, -- 'wave', 'orange_money', 'mtn_money', 'bank_transfer', 'cash'
  display_name text NOT NULL, -- 'Wave', 'Orange Money', etc.
  is_active boolean DEFAULT false,
  phone_number text, -- Pour mobile money
  bank_name text, -- Pour virement
  iban text, -- Pour virement
  account_holder text, -- Pour virement
  instructions text, -- Instructions personnalisées
  icon text, -- Nom de l'icône Lucide
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Insérer les moyens de paiement par défaut
INSERT INTO payment_methods (name, display_name, is_active, icon, display_order) VALUES
  ('wave', 'Wave', true, 'smartphone', 1),
  ('orange_money', 'Orange Money', true, 'smartphone', 2),
  ('mtn_money', 'MTN Money', false, 'smartphone', 3),
  ('bank_transfer', 'Virement bancaire', false, 'building2', 4),
  ('cash', 'Espèces', true, 'banknote', 5)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre à tous de lire les moyens de paiement actifs
CREATE POLICY "Anyone can read active payment methods" 
  ON payment_methods FOR SELECT 
  USING (is_active = true);

-- Policy pour les admins de gérer tous les moyens de paiement
CREATE POLICY "Admins can manage payment methods" 
  ON payment_methods FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index pour améliorer les performances
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX idx_payment_methods_order ON payment_methods(display_order);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_methods_updated_at();
