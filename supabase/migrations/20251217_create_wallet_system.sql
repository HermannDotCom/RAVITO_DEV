-- RAVITO Wallet System - Phase 1 MVP
-- Creates tables for wallet management, transactions, and withdrawal requests

-- =============================================
-- 1. WALLETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

-- Index for fast user lookups
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_active ON wallets(is_active);

-- =============================================
-- 2. TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'earning', 'refund')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  commission DECIMAL(10, 2) DEFAULT 0.00,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  related_withdrawal_id UUID,
  payment_method VARCHAR(50),
  transaction_reference VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_order_id ON wallet_transactions(related_order_id);

-- =============================================
-- 3. WITHDRAWAL REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(10, 2) NOT NULL CHECK (net_amount > 0),
  method VARCHAR(50) NOT NULL CHECK (method IN ('mobile_money', 'bank_transfer', 'orange', 'mtn', 'moov', 'wave')),
  account_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'cancelled')),
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_date TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  processed_date TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  completed_date TIMESTAMP WITH TIME ZONE,
  estimated_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  failure_reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_withdrawal_requests_wallet_id ON withdrawal_requests(wallet_id);
CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_request_date ON withdrawal_requests(request_date DESC);
CREATE INDEX idx_withdrawal_requests_method ON withdrawal_requests(method);

-- =============================================
-- 4. AUTOMATIC WALLET CREATION TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 0.00, 'XOF')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create wallet when user profile is created
CREATE TRIGGER trigger_create_wallet_for_user
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_new_user();

-- =============================================
-- 5. UPDATE TIMESTAMP TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_wallet_timestamp
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_timestamp();

CREATE TRIGGER trigger_update_wallet_transaction_timestamp
  BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_timestamp();

CREATE TRIGGER trigger_update_withdrawal_request_timestamp
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_timestamp();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Wallets policies
CREATE POLICY "Users can view their own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Transaction policies
CREATE POLICY "Users can view their own transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update transactions"
  ON wallet_transactions FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view all transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Withdrawal requests policies
CREATE POLICY "Users can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Function to get wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS DECIMAL(10, 2)
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_balance DECIMAL(10, 2);
BEGIN
  SELECT balance INTO v_balance
  FROM wallets
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate withdrawal fee
CREATE OR REPLACE FUNCTION calculate_withdrawal_fee(p_amount DECIMAL, p_method VARCHAR)
RETURNS DECIMAL(10, 2)
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_fee DECIMAL(10, 2);
  v_fee_percentage DECIMAL(5, 4);
BEGIN
  -- Fee structure (can be adjusted)
  -- Mobile Money: 2%
  -- Bank Transfer: 1.5%
  CASE p_method
    WHEN 'mobile_money', 'orange', 'mtn', 'moov', 'wave' THEN
      v_fee_percentage := 0.02;
    WHEN 'bank_transfer' THEN
      v_fee_percentage := 0.015;
    ELSE
      v_fee_percentage := 0.02;
  END CASE;
  
  v_fee := ROUND(p_amount * v_fee_percentage, 2);
  
  -- Minimum fee of 100 XOF
  IF v_fee < 100 THEN
    v_fee := 100;
  END IF;
  
  RETURN v_fee;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. CREATE WALLETS FOR EXISTING USERS
-- =============================================
INSERT INTO wallets (user_id, balance, currency)
SELECT id, 0.00, 'XOF'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM wallets)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON TABLE wallets IS 'User wallet accounts for RAVITO platform';
COMMENT ON TABLE wallet_transactions IS 'All wallet transactions including deposits, withdrawals, payments, and earnings';
COMMENT ON TABLE withdrawal_requests IS 'Withdrawal requests from users to external accounts';
COMMENT ON FUNCTION get_wallet_balance IS 'Get current balance for a user wallet';
COMMENT ON FUNCTION calculate_withdrawal_fee IS 'Calculate withdrawal fee based on amount and method';
