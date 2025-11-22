/*
  # VIRAL GROWTH ENGINE - PART 1: REFERRAL SYSTEM
  
  Creates the infrastructure for dual-sided referral program:
  - Client referrals ("Bring Your Squad" Program)
  - Supplier referrals ("Growth Hacking Partnership")
  - Referral credit tracking
  - VIP loyalty progression
*/

-- Table: referral_codes
-- Unique referral codes for each user (DISTRI-NIGHT-JEAN-MARC-2025)
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  role user_role NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_active_code_per_user UNIQUE (user_id)
);

-- Table: referrals
-- Tracks who referred whom and conversion status
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  referrer_role user_role NOT NULL,
  referred_role user_role NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, converted, completed
  converted_at timestamptz, -- When referred user made first order
  referrer_reward_amount integer DEFAULT 0,
  referred_reward_amount integer DEFAULT 0,
  rewards_distributed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_referral UNIQUE (referrer_id, referred_id)
);

-- Table: referral_credits
-- Tracks credit balance and transactions for each user
CREATE TABLE IF NOT EXISTS referral_credits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance integer DEFAULT 0 CHECK (balance >= 0),
  total_earned integer DEFAULT 0,
  total_spent integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_credit_per_user UNIQUE (user_id)
);

-- Table: credit_transactions
-- Audit trail for all credit movements
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL, -- earned, spent, expired
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  source_type text, -- referral, bonus, order, vip_upgrade
  source_id uuid, -- referral_id, order_id, etc.
  description text,
  created_at timestamptz DEFAULT now()
);

-- Table: vip_tiers
-- VIP tier definitions and rewards
CREATE TABLE IF NOT EXISTS vip_tiers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name text UNIQUE NOT NULL, -- Regular, VIP, Platinum, Legend
  tier_level integer UNIQUE NOT NULL,
  min_referrals integer NOT NULL DEFAULT 0,
  commission_discount_percentage numeric(5, 2) DEFAULT 0,
  priority_matching boolean DEFAULT false,
  custom_pricing boolean DEFAULT false,
  board_membership boolean DEFAULT false,
  description text,
  badge_emoji text,
  created_at timestamptz DEFAULT now()
);

-- Table: user_vip_status
-- Tracks current VIP tier for each user
CREATE TABLE IF NOT EXISTS user_vip_status (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_tier_id uuid REFERENCES vip_tiers(id),
  tier_level integer DEFAULT 1,
  successful_referrals integer DEFAULT 0,
  upgraded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_vip_per_user UNIQUE (user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_credits_user_id ON referral_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_vip_status_user_id ON user_vip_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vip_status_tier_level ON user_vip_status(tier_level);

-- Triggers
CREATE TRIGGER update_referral_credits_updated_at BEFORE UPDATE ON referral_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_vip_status_updated_at BEFORE UPDATE ON user_vip_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_name text, user_role text)
RETURNS text AS $$
DECLARE
  clean_name text;
  code text;
  counter integer := 0;
BEGIN
  -- Clean and format name (remove spaces, uppercase)
  clean_name := UPPER(REPLACE(user_name, ' ', '-'));
  
  -- Generate code: DISTRI-NIGHT-{NAME}-{YEAR}
  code := 'DISTRI-NIGHT-' || clean_name || '-2025';
  
  -- Ensure uniqueness by adding counter if needed
  WHILE EXISTS (SELECT 1 FROM referral_codes WHERE referral_codes.code = code) LOOP
    counter := counter + 1;
    code := 'DISTRI-NIGHT-' || clean_name || '-2025-' || counter;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function: Process referral conversion (when referred user makes first order)
CREATE OR REPLACE FUNCTION process_referral_conversion()
RETURNS TRIGGER AS $$
DECLARE
  referral_record RECORD;
  referrer_reward integer;
  referred_reward integer;
BEGIN
  -- Check if this is the first completed order for the client
  IF NEW.status = 'delivered' AND 
     (SELECT COUNT(*) FROM orders WHERE client_id = NEW.client_id AND status = 'delivered') = 1 THEN
    
    -- Find any pending referral for this user
    SELECT * INTO referral_record
    FROM referrals
    WHERE referred_id = NEW.client_id AND status = 'pending'
    LIMIT 1;
    
    IF FOUND THEN
      -- Determine rewards based on role
      IF referral_record.referrer_role = 'client' THEN
        referrer_reward := 50000; -- 50,000 FCFA for client referrer
        referred_reward := 30000; -- 30,000 FCFA welcome credit
      ELSIF referral_record.referrer_role = 'supplier' THEN
        referrer_reward := 100000; -- 100,000 FCFA for supplier referrer
        referred_reward := 50000; -- 50,000 FCFA welcome credit
      END IF;
      
      -- Update referral status
      UPDATE referrals
      SET status = 'converted',
          converted_at = now(),
          referrer_reward_amount = referrer_reward,
          referred_reward_amount = referred_reward
      WHERE id = referral_record.id;
      
      -- Add credits to referrer
      INSERT INTO referral_credits (user_id, balance, total_earned)
      VALUES (referral_record.referrer_id, referrer_reward, referrer_reward)
      ON CONFLICT (user_id) DO UPDATE
      SET balance = referral_credits.balance + referrer_reward,
          total_earned = referral_credits.total_earned + referrer_reward,
          updated_at = now();
      
      -- Log referrer transaction
      INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, source_type, source_id, description)
      VALUES (
        referral_record.referrer_id,
        'earned',
        referrer_reward,
        (SELECT balance FROM referral_credits WHERE user_id = referral_record.referrer_id),
        'referral',
        referral_record.id,
        'Referral reward for bringing ' || (SELECT name FROM profiles WHERE id = NEW.client_id)
      );
      
      -- Add credits to referred user
      INSERT INTO referral_credits (user_id, balance, total_earned)
      VALUES (referral_record.referred_id, referred_reward, referred_reward)
      ON CONFLICT (user_id) DO UPDATE
      SET balance = referral_credits.balance + referred_reward,
          total_earned = referral_credits.total_earned + referred_reward,
          updated_at = now();
      
      -- Log referred user transaction
      INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, source_type, source_id, description)
      VALUES (
        referral_record.referred_id,
        'earned',
        referred_reward,
        (SELECT balance FROM referral_credits WHERE user_id = referral_record.referred_id),
        'referral',
        referral_record.id,
        'Welcome credit for joining via referral'
      );
      
      -- Update VIP status for referrer
      UPDATE user_vip_status
      SET successful_referrals = successful_referrals + 1,
          updated_at = now()
      WHERE user_id = referral_record.referrer_id;
      
      -- Check for VIP tier upgrade (every 5 successful referrals)
      PERFORM check_vip_tier_upgrade(referral_record.referrer_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Check and upgrade VIP tier
CREATE OR REPLACE FUNCTION check_vip_tier_upgrade(p_user_id uuid)
RETURNS void AS $$
DECLARE
  current_referrals integer;
  new_tier_level integer;
  new_tier_id uuid;
BEGIN
  -- Get current referral count
  SELECT successful_referrals INTO current_referrals
  FROM user_vip_status
  WHERE user_id = p_user_id;
  
  -- Determine new tier level (every 5 referrals = 1 tier up, max 5 tiers)
  new_tier_level := LEAST((current_referrals / 5) + 1, 5);
  
  -- Get the tier ID for this level
  SELECT id INTO new_tier_id
  FROM vip_tiers
  WHERE tier_level = new_tier_level;
  
  -- Update user's tier if changed
  UPDATE user_vip_status
  SET current_tier_id = new_tier_id,
      tier_level = new_tier_level,
      upgraded_at = CASE WHEN tier_level < new_tier_level THEN now() ELSE upgraded_at END,
      updated_at = now()
  WHERE user_id = p_user_id AND tier_level < new_tier_level;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Process referral conversion on order delivery
CREATE TRIGGER process_referral_on_delivery
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION process_referral_conversion();

-- Insert VIP tier definitions
INSERT INTO vip_tiers (tier_name, tier_level, min_referrals, commission_discount_percentage, priority_matching, custom_pricing, board_membership, description, badge_emoji)
VALUES
  ('Newcomer', 1, 0, 0, false, false, false, 'Welcome to DISTRI-NIGHT! Start referring to unlock VIP benefits.', '🌟'),
  ('Regular', 2, 5, 2, false, false, false, 'Regular member with 2% commission discount', '⭐'),
  ('VIP', 3, 10, 5, true, false, false, 'VIP member with priority matching and 5% discount', '💎'),
  ('Platinum', 4, 20, 8, true, true, false, 'Platinum tier with custom pricing access', '👑'),
  ('Legend', 5, 30, 10, true, true, true, 'Legendary status with board membership and maximum benefits', '🏆')
ON CONFLICT (tier_level) DO NOTHING;

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vip_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies: referral_codes
CREATE POLICY "Users can view their own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral code"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view referral codes by code"
  ON referral_codes FOR SELECT
  USING (true);

-- RLS Policies: referrals
CREATE POLICY "Users can view referrals they're involved in"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies: referral_credits
CREATE POLICY "Users can view their own credits"
  ON referral_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage credits"
  ON referral_credits FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies: credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON credit_transactions FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- RLS Policies: vip_tiers
CREATE POLICY "Anyone can view VIP tiers"
  ON vip_tiers FOR SELECT
  USING (true);

-- RLS Policies: user_vip_status
CREATE POLICY "Users can view their own VIP status"
  ON user_vip_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view VIP status"
  ON user_vip_status FOR SELECT
  USING (true);

CREATE POLICY "System can manage VIP status"
  ON user_vip_status FOR ALL
  USING (true)
  WITH CHECK (true);
