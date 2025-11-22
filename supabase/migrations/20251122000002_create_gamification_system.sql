/*
  # VIRAL GROWTH ENGINE - PART 2: GAMIFICATION & PROGRESSION
  
  Creates the infrastructure for:
  - User level progression (Newcomer -> Legend)
  - Achievement/badge system
  - Leaderboards
*/

-- Table: user_levels
-- Defines progression ladder for clients and suppliers
CREATE TABLE IF NOT EXISTS user_levels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_name text NOT NULL,
  level_number integer NOT NULL,
  role user_role NOT NULL,
  min_orders integer DEFAULT 0,
  min_completed_offers integer DEFAULT 0, -- For suppliers
  perks jsonb, -- Array of perks unlocked at this level
  description text,
  badge_emoji text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_level_per_role UNIQUE (role, level_number)
);

-- Table: user_progression
-- Tracks each user's current level and progress
CREATE TABLE IF NOT EXISTS user_progression (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  current_level integer DEFAULT 1,
  total_orders integer DEFAULT 0,
  total_completed_offers integer DEFAULT 0,
  level_upgraded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_progression_per_user UNIQUE (user_id)
);

-- Table: achievements
-- Defines all available achievements/badges
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_key text UNIQUE NOT NULL, -- night_owl, loyal_customer, speed_champion
  name text NOT NULL,
  description text NOT NULL,
  badge_emoji text,
  role user_role, -- NULL means available for all roles
  unlock_criteria jsonb NOT NULL, -- Conditions to unlock
  share_message text, -- Template for social sharing
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table: user_achievements
-- Tracks which users have unlocked which achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  shared_count integer DEFAULT 0, -- Track social shares
  last_shared_at timestamptz,
  CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

-- Table: leaderboards
-- Monthly leaderboards for different categories
CREATE TABLE IF NOT EXISTS leaderboards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category text NOT NULL, -- top_referrers, top_clients, top_suppliers
  role user_role,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  rankings jsonb NOT NULL, -- Array of {user_id, name, score, rank}
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_levels_role ON user_levels(role);
CREATE INDEX IF NOT EXISTS idx_user_levels_level_number ON user_levels(level_number);

CREATE INDEX IF NOT EXISTS idx_user_progression_user_id ON user_progression(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progression_role ON user_progression(role);
CREATE INDEX IF NOT EXISTS idx_user_progression_current_level ON user_progression(current_level);

CREATE INDEX IF NOT EXISTS idx_achievements_role ON achievements(role);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_category ON leaderboards(category);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period ON leaderboards(period_start, period_end);

-- Triggers
CREATE TRIGGER update_user_progression_updated_at BEFORE UPDATE ON user_progression
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboards_updated_at BEFORE UPDATE ON leaderboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update user progression on order completion
CREATE OR REPLACE FUNCTION update_user_progression()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role;
  current_count integer;
  new_level integer;
  level_record RECORD;
BEGIN
  -- Update client progression on order delivery
  IF NEW.status = 'delivered' THEN
    -- Update client
    INSERT INTO user_progression (user_id, role, total_orders, current_level)
    VALUES (NEW.client_id, 'client', 1, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_orders = user_progression.total_orders + 1,
        updated_at = now();
    
    -- Check for level upgrade (client) - dynamically from user_levels table
    current_count := (SELECT total_orders FROM user_progression WHERE user_id = NEW.client_id);
    
    SELECT level_number INTO new_level
    FROM user_levels
    WHERE role = 'client' AND min_orders <= current_count
    ORDER BY level_number DESC
    LIMIT 1;
    
    IF new_level IS NOT NULL THEN
      UPDATE user_progression
      SET current_level = new_level,
          level_upgraded_at = CASE WHEN current_level < new_level THEN now() ELSE level_upgraded_at END,
          updated_at = now()
      WHERE user_id = NEW.client_id AND current_level < new_level;
    END IF;
    
    -- Update supplier progression if supplier exists
    IF NEW.supplier_id IS NOT NULL THEN
      INSERT INTO user_progression (user_id, role, total_completed_offers, current_level)
      VALUES (NEW.supplier_id, 'supplier', 1, 1)
      ON CONFLICT (user_id) DO UPDATE
      SET total_completed_offers = user_progression.total_completed_offers + 1,
          updated_at = now();
      
      -- Check for level upgrade (supplier) - dynamically from user_levels table
      current_count := (SELECT total_completed_offers FROM user_progression WHERE user_id = NEW.supplier_id);
      
      SELECT level_number INTO new_level
      FROM user_levels
      WHERE role = 'supplier' AND min_completed_offers <= current_count
      ORDER BY level_number DESC
      LIMIT 1;
      
      IF new_level IS NOT NULL THEN
        UPDATE user_progression
        SET current_level = new_level,
            level_upgraded_at = CASE WHEN current_level < new_level THEN now() ELSE level_upgraded_at END,
            updated_at = now()
        WHERE user_id = NEW.supplier_id AND current_level < new_level;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update progression on order delivery
CREATE TRIGGER update_progression_on_delivery
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION update_user_progression();

-- Function: Check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievement_unlock(p_user_id uuid, p_achievement_key text)
RETURNS boolean AS $$
DECLARE
  achievement_record RECORD;
  already_unlocked boolean;
BEGIN
  -- Check if already unlocked
  SELECT EXISTS (
    SELECT 1 FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = p_user_id AND a.achievement_key = p_achievement_key
  ) INTO already_unlocked;
  
  IF already_unlocked THEN
    RETURN false;
  END IF;
  
  -- Get achievement details
  SELECT * INTO achievement_record
  FROM achievements
  WHERE achievement_key = p_achievement_key AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Unlock achievement
  INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
  VALUES (p_user_id, achievement_record.id, now())
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Insert Client Levels
INSERT INTO user_levels (level_name, level_number, role, min_orders, perks, description, badge_emoji)
VALUES
  ('Newcomer', 1, 'client', 0, '["Basic referral program"]', 'Welcome! Start ordering to unlock benefits', '🌱'),
  ('Regular', 2, 'client', 5, '["VIP discount -2%", "Enhanced referral bonus"]', 'You''re getting the hang of it!', '⭐'),
  ('VIP', 3, 'client', 15, '["Priority matching", "Referral bonus x1.5", "VIP discount -5%"]', 'VIP member with exclusive perks', '💎'),
  ('Platinum', 4, 'client', 30, '["Custom pricing", "Dedicated supplier contact", "VIP discount -8%"]', 'Elite customer status', '👑'),
  ('Legend', 5, 'client', 100, '["Board membership", "5% commission rebate", "Free premium analytics"]', 'Legendary customer - you run the night!', '🏆')
ON CONFLICT (role, level_number) DO NOTHING;

-- Insert Supplier Levels
INSERT INTO user_levels (level_name, level_number, role, min_completed_offers, perks, description, badge_emoji)
VALUES
  ('New', 1, 'supplier', 0, '["Build rating"]', 'Welcome! Complete orders to build your reputation', '🚀'),
  ('Trusted', 2, 'supplier', 50, '["Zone expansion requests"]', 'Trusted supplier - expand your territory', '✅'),
  ('Master', 3, 'supplier', 150, '["Premium tier eligibility"]', 'Master supplier with premium access', '🌟'),
  ('Elite', 4, 'supplier', 300, '["White-label API", "Custom commission rates"]', 'Elite supplier with advanced features', '💼'),
  ('Partner', 5, 'supplier', 500, '["Board seat", "Equity opportunity (future)"]', 'Strategic partner in DISTRI-NIGHT', '🤝')
ON CONFLICT (role, level_number) DO NOTHING;

-- Insert Achievement Definitions
INSERT INTO achievements (achievement_key, name, description, badge_emoji, role, unlock_criteria, share_message, is_active)
VALUES
  ('night_owl', 'Night Owl', 'Ordered after 2am', '🦉', 'client', '{"type": "order_after_time", "time": "02:00"}', '{name} is a NIGHT OWL on DISTRI-NIGHT 🦉', true),
  ('loyal_customer', 'Loyal Customer', 'Completed 10 orders', '❤️', 'client', '{"type": "total_orders", "count": 10}', '{name} is a LOYAL CUSTOMER on DISTRI-NIGHT ❤️', true),
  ('speed_champion', 'Speed Champion', 'Paid within 30 seconds', '⚡', 'client', '{"type": "fast_payment", "seconds": 30}', '{name} is a SPEED CHAMPION on DISTRI-NIGHT ⚡', true),
  ('referral_master', 'Referral Master', 'Referred 10+ users', '👥', NULL, '{"type": "successful_referrals", "count": 10}', '{name} is a REFERRAL MASTER on DISTRI-NIGHT 👥', true),
  ('early_adopter', 'Early Adopter', 'Joined in first 100 users', '🚀', NULL, '{"type": "early_user", "max_user_number": 100}', '{name} is an EARLY ADOPTER of DISTRI-NIGHT 🚀', true),
  ('zone_champion', 'Zone Champion', 'Top supplier in a zone', '🏆', 'supplier', '{"type": "top_in_zone", "rank": 1}', '{name} is a ZONE CHAMPION on DISTRI-NIGHT 🏆', true),
  ('reliable_partner', 'Reliable Partner', '100% success rate over 20 orders', '💯', 'supplier', '{"type": "success_rate", "rate": 100, "min_orders": 20}', '{name} is a RELIABLE PARTNER on DISTRI-NIGHT 💯', true)
ON CONFLICT (achievement_key) DO NOTHING;

-- Enable RLS
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies: user_levels
CREATE POLICY "Anyone can view user levels"
  ON user_levels FOR SELECT
  USING (true);

-- RLS Policies: user_progression
CREATE POLICY "Users can view their own progression"
  ON user_progression FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view user progression"
  ON user_progression FOR SELECT
  USING (true);

CREATE POLICY "System can manage user progression"
  ON user_progression FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies: achievements
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (is_active = true);

-- RLS Policies: user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view user achievements"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can manage user achievements"
  ON user_achievements FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies: leaderboards
CREATE POLICY "Anyone can view leaderboards"
  ON leaderboards FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage leaderboards"
  ON leaderboards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
