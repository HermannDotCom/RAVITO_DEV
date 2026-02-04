-- Update subscription_invoices table structure to support new requirements

-- Ajouter les colonnes manquantes si nécessaire
ALTER TABLE subscription_invoices 
  ADD COLUMN IF NOT EXISTS amount_due numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transaction_reference text,
  ADD COLUMN IF NOT EXISTS payment_method text;

-- Migrer les données existantes
-- amount_due = amount (montant total de la facture)
UPDATE subscription_invoices 
SET amount_due = amount 
WHERE amount_due = 0;

-- amount_paid = paid_amount si la facture est payée
UPDATE subscription_invoices 
SET amount_paid = COALESCE(paid_amount, 0)
WHERE amount_paid IS NULL OR amount_paid = 0;

-- Créer une fonction pour calculer le statut de la facture basé sur amount_due et amount_paid
CREATE OR REPLACE FUNCTION calculate_invoice_status(
  p_amount_due numeric,
  p_amount_paid numeric,
  p_current_status text,
  p_due_date timestamptz
)
RETURNS text AS $$
BEGIN
  -- Si le montant payé >= montant dû, la facture est payée
  IF p_amount_paid >= p_amount_due THEN
    RETURN 'paid';
  END IF;
  
  -- Si aucun paiement n'a été fait
  IF p_amount_paid = 0 THEN
    -- Vérifier si la date d'échéance est dépassée
    IF p_due_date < NOW() THEN
      RETURN 'overdue';
    ELSE
      RETURN 'pending';
    END IF;
  END IF;
  
  -- Si un paiement partiel a été fait
  IF p_amount_paid > 0 AND p_amount_paid < p_amount_due THEN
    IF p_due_date < NOW() THEN
      RETURN 'overdue';
    ELSE
      RETURN 'pending';
    END IF;
  END IF;
  
  -- Par défaut, retourner le statut actuel
  RETURN p_current_status;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Créer un trigger pour mettre à jour automatiquement le statut en fonction des montants
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le nouveau statut basé sur amount_due et amount_paid
  NEW.status := calculate_invoice_status(
    NEW.amount_due,
    COALESCE(NEW.amount_paid, 0),
    NEW.status,
    NEW.due_date
  );
  
  -- Si la facture est complètement payée, mettre à jour paid_at
  IF NEW.amount_paid >= NEW.amount_due AND NEW.paid_at IS NULL THEN
    NEW.paid_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_invoice_status ON subscription_invoices;
CREATE TRIGGER trigger_update_invoice_status
  BEFORE INSERT OR UPDATE OF amount_paid, amount_due
  ON subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_payment();

-- Commentaires pour la documentation
COMMENT ON COLUMN subscription_invoices.amount_due IS 'Montant total à payer pour cette facture';
COMMENT ON COLUMN subscription_invoices.amount_paid IS 'Montant déjà payé (peut être partiel)';
COMMENT ON COLUMN subscription_invoices.transaction_reference IS 'Référence de transaction du paiement (Wave, Orange Money, etc.)';
COMMENT ON COLUMN subscription_invoices.payment_method IS 'Méthode de paiement utilisée (wave, orange_money, mtn_money, bank_transfer, cash)';
