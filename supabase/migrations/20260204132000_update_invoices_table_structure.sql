-- Migration: Update subscription_invoices table structure
-- Description: Ajout des colonnes pour le système de paiement complet

-- 1. Ajouter les colonnes manquantes
ALTER TABLE subscription_invoices 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS amount_due numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_reference text,
  ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES payment_methods(id);

-- 2. Migrer les données existantes
UPDATE subscription_invoices 
SET amount_due = amount 
WHERE amount_due = 0 OR amount_due IS NULL;

UPDATE subscription_invoices 
SET amount_paid = COALESCE(paid_amount, 0)
WHERE amount_paid = 0 OR amount_paid IS NULL;

-- 3. Contraintes
ALTER TABLE subscription_invoices
  DROP CONSTRAINT IF EXISTS subscription_invoices_check_amounts;

ALTER TABLE subscription_invoices
  ADD CONSTRAINT subscription_invoices_check_amounts 
  CHECK (amount_due >= 0 AND amount_paid >= 0);

-- 4. Index pour performance
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_org ON subscription_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_due_date ON subscription_invoices(due_date);

-- 5. Fonction pour calculer le statut
CREATE OR REPLACE FUNCTION calculate_invoice_status(
  p_amount_due numeric,
  p_amount_paid numeric,
  p_current_status text,
  p_due_date date
)
RETURNS text AS $$
BEGIN
  IF p_amount_paid >= p_amount_due THEN
    RETURN 'paid';
  END IF;
  
  IF p_amount_paid = 0 THEN
    IF p_due_date < CURRENT_DATE THEN
      RETURN 'overdue';
    ELSE
      RETURN 'pending';
    END IF;
  END IF;
  
  IF p_amount_paid > 0 AND p_amount_paid < p_amount_due THEN
    IF p_due_date < CURRENT_DATE THEN
      RETURN 'overdue';
    ELSE
      RETURN 'partial';
    END IF;
  END IF;
  
  RETURN p_current_status;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Trigger pour mise à jour auto du statut
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status := calculate_invoice_status(
    NEW.amount_due,
    COALESCE(NEW.amount_paid, 0),
    NEW.status,
    NEW.due_date
  );
  
  IF NEW.amount_paid >= NEW.amount_due AND NEW.paid_at IS NULL THEN
    NEW.paid_at := NOW();
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_status ON subscription_invoices;
CREATE TRIGGER trigger_update_invoice_status
  BEFORE INSERT OR UPDATE OF amount_paid, amount_due
  ON subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_payment();

-- 7. Commentaires
COMMENT ON COLUMN subscription_invoices.amount_due IS 'Montant total à payer';
COMMENT ON COLUMN subscription_invoices.amount_paid IS 'Montant déjà payé (peut être partiel)';
COMMENT ON COLUMN subscription_invoices.transaction_reference IS 'Référence de transaction (Wave, Orange Money, etc.)';
COMMENT ON COLUMN subscription_invoices.payment_method_id IS 'ID du moyen de paiement utilisé';