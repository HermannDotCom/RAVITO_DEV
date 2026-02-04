-- Migration: Create invoices table
-- Description: Factures des abonnements avec suivi des paiements

-- 1. Créer la table invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Relations
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Période concernée
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  -- Montants
  amount_due numeric NOT NULL DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  
  -- Paiement
  payment_method_id uuid REFERENCES payment_methods(id),
  transaction_reference text,
  
  -- Statuts
  status text NOT NULL DEFAULT 'pending',  -- 'pending', 'paid', 'partial', 'overdue', 'cancelled'
  due_date date NOT NULL,
  
  -- Dates importantes
  issued_at timestamptz DEFAULT NOW(),
  paid_at timestamptz,
  
  -- Métadonnées
  notes text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT invoices_unique_subscription_period UNIQUE (subscription_id, period_start, period_end),
  CONSTRAINT invoices_check_period CHECK (period_end >= period_start),
  CONSTRAINT invoices_check_amounts CHECK (amount_due >= 0 AND amount_paid >= 0)
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- 3. RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization invoices" ON invoices;
CREATE POLICY "Users can view their organization invoices" 
  ON invoices 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
CREATE POLICY "Admins can manage all invoices" 
  ON invoices 
  FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Trigger pour mise à jour auto du statut
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.amount_paid >= NEW.amount_due THEN
    NEW.status := 'paid';
    NEW.paid_at := COALESCE(NEW.paid_at, NOW());
  ELSIF NEW.amount_paid > 0 THEN
    NEW.status := 'partial';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.amount_paid < NEW.amount_due THEN
    NEW.status := 'overdue';
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_status ON invoices;
CREATE TRIGGER trigger_update_invoice_status
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status();

-- 5. Fonction de suspension automatique des abonnements impayés
CREATE OR REPLACE FUNCTION check_and_suspend_overdue_subscriptions()
RETURNS void AS $$
BEGIN
  -- Suspendre les abonnements avec factures impayées après échéance
  UPDATE subscriptions s
  SET 
    status = 'suspended',
    suspended_at = NOW(),
    updated_at = NOW()
  WHERE 
    s.status IN ('trial', 'active')
    AND EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.subscription_id = s.id
      AND i.status IN ('pending', 'partial', 'overdue')
      AND i.due_date < CURRENT_DATE
      AND i.amount_paid < i.amount_due
    );
    
  -- Mettre à jour les factures en retard
  UPDATE invoices
  SET status = 'overdue', updated_at = NOW()
  WHERE status IN ('pending', 'partial')
  AND due_date < CURRENT_DATE
  AND amount_paid < amount_due;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;