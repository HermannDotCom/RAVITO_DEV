-- ============================================
-- CREDIT ALERTS AND STATUS MANAGEMENT
-- Migration: Add status management and alert tracking
-- ============================================

-- ============================================
-- 1. ADD NEW COLUMNS TO CREDIT_CUSTOMERS
-- ============================================
-- D'abord ajouter les colonnes
ALTER TABLE credit_customers
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS freeze_reason TEXT,
ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ;

-- Puis ajouter la contrainte CHECK (sans IF NOT EXISTS)
-- On utilise une approche conditionnelle
DO $$
BEGIN
  -- Vérifier si la contrainte n'existe pas déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'credit_customers_status_check'
  ) THEN
    ALTER TABLE credit_customers 
    ADD CONSTRAINT credit_customers_status_check 
    CHECK (status IN ('active', 'frozen', 'disabled'));
  END IF;
END $$;

COMMENT ON COLUMN credit_customers.status IS 'active = peut consommer, frozen = gelé, disabled = désactivé';
COMMENT ON COLUMN credit_customers.last_payment_date IS 'Date du dernier règlement';
COMMENT ON COLUMN credit_customers.freeze_reason IS 'Motif du gel si applicable';
COMMENT ON COLUMN credit_customers.frozen_at IS 'Date du gel si applicable';

-- ============================================
-- 2. TRIGGER TO UPDATE LAST_PAYMENT_DATE
-- ============================================
CREATE OR REPLACE FUNCTION update_last_payment_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'payment' THEN
    UPDATE credit_customers
    SET last_payment_date = NEW.transaction_date
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_last_payment_date ON credit_transactions;
CREATE TRIGGER trigger_update_last_payment_date
AFTER INSERT ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION update_last_payment_date();

-- ============================================
-- 3. UPDATE CHECK_CREDIT_LIMIT FUNCTION
-- Add status checking (frozen/disabled customers cannot consume)
-- ============================================
CREATE OR REPLACE FUNCTION check_credit_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_credit_limit INTEGER;
  v_new_balance INTEGER;
  v_status VARCHAR(20);
  v_customer_name VARCHAR(100);
BEGIN
  IF NEW.transaction_type = 'consumption' THEN
    -- Get customer info
    SELECT credit_limit, status, current_balance + NEW.amount, name
    INTO v_credit_limit, v_status, v_new_balance, v_customer_name
    FROM credit_customers
    WHERE id = NEW.customer_id;
    
    -- Check if customer is frozen or disabled
    IF v_status IN ('frozen', 'disabled') THEN
      RAISE EXCEPTION 'Client % - Crédit gelé ou désactivé. Règlement requis avant nouvelle consommation.', v_customer_name;
    END IF;
    
    -- Check if limit is exceeded (if limit > 0)
    IF v_credit_limit > 0 AND v_new_balance > v_credit_limit THEN
      RAISE EXCEPTION 'Plafond de crédit dépassé. Plafond: %, Nouveau solde: %', v_credit_limit, v_new_balance;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to apply updated function
DROP TRIGGER IF EXISTS trigger_check_credit_limit ON credit_transactions;
CREATE TRIGGER trigger_check_credit_limit
BEFORE INSERT ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION check_credit_limit();

-- ============================================
-- 4. CREATE CREDIT_ALERTS VIEW
-- Calculate alert levels for customers
-- ============================================
CREATE OR REPLACE VIEW credit_alerts AS
SELECT 
  cc.id,
  cc.organization_id,
  cc.name,
  cc.phone,
  cc.current_balance,
  cc.last_payment_date,
  cc.status,
  cc.credit_limit,
  cc.created_at,
  CASE 
    WHEN cc.last_payment_date IS NULL AND cc.current_balance > 0 THEN 
      EXTRACT(DAY FROM NOW() - cc.created_at)::INTEGER
    WHEN cc.current_balance > 0 THEN 
      EXTRACT(DAY FROM NOW() - cc.last_payment_date)::INTEGER
    ELSE 0
  END AS days_since_payment,
  CASE 
    WHEN cc.last_payment_date IS NULL AND cc.current_balance > 0 AND 
         EXTRACT(DAY FROM NOW() - cc.created_at) > 45 THEN 'critical'
    WHEN cc.last_payment_date IS NULL AND cc.current_balance > 0 AND 
         EXTRACT(DAY FROM NOW() - cc.created_at) > 30 THEN 'warning'
    WHEN cc.current_balance > 0 AND 
         EXTRACT(DAY FROM NOW() - cc.last_payment_date) > 45 THEN 'critical'
    WHEN cc.current_balance > 0 AND 
         EXTRACT(DAY FROM NOW() - cc.last_payment_date) > 30 THEN 'warning'
    ELSE 'normal'
  END AS alert_level
FROM credit_customers cc
WHERE cc.is_active = true;

COMMENT ON VIEW credit_alerts IS 'Vue pour les alertes de crédit avec calcul des jours depuis dernier règlement';

-- ============================================
-- 5. GRANT PERMISSIONS ON VIEW
-- ============================================
GRANT SELECT ON credit_alerts TO authenticated;