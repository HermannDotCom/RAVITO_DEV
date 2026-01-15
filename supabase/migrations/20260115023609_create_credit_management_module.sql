-- ============================================
-- CREDIT MANAGEMENT MODULE (Carnet de Crédit)
-- Migration: Create tables for credit customer tracking
-- ============================================

-- ============================================
-- 1. CREDIT CUSTOMERS TABLE
-- Stores clients who buy on credit
-- ============================================
CREATE TABLE IF NOT EXISTS credit_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  notes TEXT,
  credit_limit INTEGER DEFAULT 0, -- Plafond (0 = illimité)
  current_balance INTEGER DEFAULT 0, -- Solde actuel dû
  total_credited INTEGER DEFAULT 0, -- Total crédité historique
  total_paid INTEGER DEFAULT 0, -- Total réglé historique
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_customers_org ON credit_customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_customers_name ON credit_customers(name);
CREATE INDEX IF NOT EXISTS idx_credit_customers_balance ON credit_customers(current_balance);
CREATE INDEX IF NOT EXISTS idx_credit_customers_active ON credit_customers(is_active);

-- ============================================
-- 2. CREDIT TRANSACTIONS TABLE
-- Stores consumption and payment transactions
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES credit_customers(id) ON DELETE CASCADE,
  daily_sheet_id UUID REFERENCES daily_sheets(id), -- Lien avec la journée
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('consumption', 'payment')),
  amount INTEGER NOT NULL CHECK (amount > 0), -- Toujours positif
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'mobile_money', 'transfer')),
  notes TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_customer ON credit_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_sheet ON credit_transactions(daily_sheet_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_date ON credit_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_org ON credit_transactions(organization_id);

-- ============================================
-- 3. CREDIT TRANSACTION ITEMS TABLE
-- Details of products in consumption transactions
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES credit_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(100) NOT NULL, -- Stocké pour historique
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price > 0),
  subtotal INTEGER NOT NULL CHECK (subtotal > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_credit_items_transaction ON credit_transaction_items(transaction_id);

-- ============================================
-- 4. ADD CREDIT COLUMNS TO DAILY_SHEETS
-- Track credit activity per day
-- ============================================
ALTER TABLE daily_sheets 
ADD COLUMN IF NOT EXISTS credit_sales INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_payments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_balance_eod INTEGER DEFAULT 0;

COMMENT ON COLUMN daily_sheets.credit_sales IS 'Total des crédits accordés ce jour';
COMMENT ON COLUMN daily_sheets.credit_payments IS 'Total des règlements crédits reçus ce jour';
COMMENT ON COLUMN daily_sheets.credit_balance_eod IS 'Solde total crédit en fin de journée (tous clients)';

-- ============================================
-- 5. TRIGGERS FOR CUSTOMER BALANCE UPDATES
-- ============================================

-- Trigger to update customer balance after transaction
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'consumption' THEN
    UPDATE credit_customers
    SET 
      current_balance = current_balance + NEW.amount,
      total_credited = total_credited + NEW.amount,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  ELSIF NEW.transaction_type = 'payment' THEN
    UPDATE credit_customers
    SET 
      current_balance = current_balance - NEW.amount,
      total_paid = total_paid + NEW.amount,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_customer_balance
AFTER INSERT ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION update_customer_balance();

-- Trigger for updated_at on credit_customers
CREATE OR REPLACE FUNCTION update_credit_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER credit_customers_updated_at
BEFORE UPDATE ON credit_customers
FOR EACH ROW
EXECUTE FUNCTION update_credit_customers_updated_at();

-- Trigger to update daily_sheet credit totals
CREATE OR REPLACE FUNCTION update_daily_sheet_credits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.daily_sheet_id IS NOT NULL THEN
    -- Update credit_sales or credit_payments based on transaction type
    IF NEW.transaction_type = 'consumption' THEN
      UPDATE daily_sheets
      SET credit_sales = credit_sales + NEW.amount
      WHERE id = NEW.daily_sheet_id;
    ELSIF NEW.transaction_type = 'payment' THEN
      UPDATE daily_sheets
      SET credit_payments = credit_payments + NEW.amount
      WHERE id = NEW.daily_sheet_id;
    END IF;
    
    -- Update credit_balance_eod (total balance of all customers)
    UPDATE daily_sheets
    SET credit_balance_eod = (
      SELECT COALESCE(SUM(current_balance), 0)
      FROM credit_customers
      WHERE organization_id = NEW.organization_id
    )
    WHERE id = NEW.daily_sheet_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_daily_sheet_credits
AFTER INSERT ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION update_daily_sheet_credits();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE credit_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transaction_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy for credit_customers
CREATE POLICY "Users can manage their organization credit customers"
  ON credit_customers FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policy for credit_transactions
CREATE POLICY "Users can manage their organization credit transactions"
  ON credit_transactions FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policy for credit_transaction_items
CREATE POLICY "Users can manage credit transaction items"
  ON credit_transaction_items FOR ALL
  USING (
    transaction_id IN (
      SELECT id FROM credit_transactions WHERE organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
        UNION
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE credit_customers IS 'Clients fidèles achetant à crédit';
COMMENT ON TABLE credit_transactions IS 'Transactions de crédit (consommations et règlements)';
COMMENT ON TABLE credit_transaction_items IS 'Détail des articles dans les consommations à crédit';

COMMENT ON FUNCTION update_customer_balance() IS 'Met à jour le solde client après transaction';
COMMENT ON FUNCTION update_credit_customers_updated_at() IS 'Met à jour updated_at automatiquement';
COMMENT ON FUNCTION update_daily_sheet_credits() IS 'Met à jour les totaux crédits dans daily_sheets';
