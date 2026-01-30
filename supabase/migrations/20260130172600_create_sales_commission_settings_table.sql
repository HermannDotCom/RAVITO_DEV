/*
  # Create Sales Commission Settings Table
  
  ## Description
  Table de configuration unique pour les règles de calcul des primes commerciales.
  Une seule ligne dans cette table (singleton pattern) contient toute la configuration.
  
  ## Structure
  - Primes à l'inscription (conditionnées par activation)
  - Commission sur CA (tranches progressives)
  - Bonus objectifs mensuels
  - Bonus dépassement
  - Bonus spéciaux
  
  ## Security
  - RLS activé
  - Lecture pour tous les admins
  - Modification réservée aux Super Admin
*/

-- Create sales_commission_settings table
CREATE TABLE IF NOT EXISTS sales_commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Primes inscription (conditionnées)
  prime_per_chr_activated INTEGER DEFAULT 1000,
  chr_activation_threshold INTEGER DEFAULT 50000, -- CA minimum en FCFA
  prime_per_depot_activated INTEGER DEFAULT 1000,
  depot_activation_deliveries INTEGER DEFAULT 3, -- Nb livraisons min
  
  -- Commission CA (tranches)
  ca_commission_enabled BOOLEAN DEFAULT false,
  ca_tier1_max INTEGER DEFAULT 500000,
  ca_tier1_rate NUMERIC(5,2) DEFAULT 0.5,
  ca_tier2_max INTEGER DEFAULT 1500000,
  ca_tier2_rate NUMERIC(5,2) DEFAULT 0.8,
  ca_tier3_max INTEGER DEFAULT 3000000,
  ca_tier3_rate NUMERIC(5,2) DEFAULT 1.0,
  ca_tier4_rate NUMERIC(5,2) DEFAULT 1.2,
  
  -- Bonus objectifs
  bonus_chr_objective INTEGER DEFAULT 15000,
  bonus_depot_objective INTEGER DEFAULT 15000,
  bonus_combined INTEGER DEFAULT 10000,
  
  -- Bonus dépassement
  overshoot_tier1_threshold INTEGER DEFAULT 120, -- 120%
  overshoot_tier1_bonus INTEGER DEFAULT 15000,
  overshoot_tier2_threshold INTEGER DEFAULT 150, -- 150%
  overshoot_tier2_bonus INTEGER DEFAULT 30000,
  
  -- Bonus spéciaux
  bonus_best_of_month INTEGER DEFAULT 25000,
  
  -- Audit
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE sales_commission_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view settings
CREATE POLICY "Admins can view commission settings"
  ON sales_commission_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Super Admins can manage settings
CREATE POLICY "Super admins can manage commission settings"
  ON sales_commission_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND o.type = 'admin'
      AND om.role = 'super_admin'
      AND om.is_active = true
    )
  )
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

-- Trigger for updated_at
CREATE TRIGGER update_sales_commission_settings_updated_at
  BEFORE UPDATE ON sales_commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration (singleton)
INSERT INTO sales_commission_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Comment
COMMENT ON TABLE sales_commission_settings IS 'Configuration unique des règles de calcul des primes commerciales (singleton)';
