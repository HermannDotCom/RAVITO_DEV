/*
  # Create Sales Commission Payments Table
  
  ## Description
  Table pour stocker les calculs de primes mensuelles par commercial.
  Chaque ligne représente le calcul de primes pour un commercial sur une période donnée.
  
  ## Structure
  - Détail des primes calculées (CHR, Dépôts, bonus, etc.)
  - Montant total
  - Statut workflow : pending -> validated -> paid
  - Audit trail complet
  
  ## Security
  - RLS activé
  - Lecture pour tous les admins
  - Gestion des statuts réservée aux Super Admin
*/

-- Create sales_commission_payments table
CREATE TABLE IF NOT EXISTS sales_commission_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  sales_rep_id UUID NOT NULL REFERENCES sales_representatives(id) ON DELETE CASCADE,
  
  -- Détail des primes
  chr_activated INTEGER DEFAULT 0,
  depot_activated INTEGER DEFAULT 0,
  prime_inscriptions INTEGER DEFAULT 0,
  bonus_objectives INTEGER DEFAULT 0,
  bonus_overshoot INTEGER DEFAULT 0,
  bonus_special INTEGER DEFAULT 0,
  commission_ca INTEGER DEFAULT 0,
  
  -- Total
  total_amount INTEGER NOT NULL,
  
  -- Statut
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'paid')),
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(period_year, period_month, sales_rep_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_payments_rep ON sales_commission_payments(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_sales_payments_period ON sales_commission_payments(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_sales_payments_status ON sales_commission_payments(status);

-- Enable RLS
ALTER TABLE sales_commission_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all payments
CREATE POLICY "Admins can view commission payments"
  ON sales_commission_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Super Admins can manage payments
CREATE POLICY "Super admins can manage commission payments"
  ON sales_commission_payments FOR ALL
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
CREATE TRIGGER update_sales_commission_payments_updated_at
  BEFORE UPDATE ON sales_commission_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE sales_commission_payments IS 'Calculs et paiements des primes mensuelles des commerciaux terrain';
