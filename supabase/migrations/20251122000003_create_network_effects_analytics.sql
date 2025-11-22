/*
  # VIRAL GROWTH ENGINE - PART 3: NETWORK EFFECTS & ANALYTICS
  
  Creates the infrastructure for:
  - Zone activation bonuses
  - Supplier density rewards
  - Viral metrics tracking
  - Growth cohorts analysis
*/

-- Table: zone_network_bonuses
-- Tracks zone activation bonuses when critical mass is reached
CREATE TABLE IF NOT EXISTS zone_network_bonuses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id uuid NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
  bonus_type text NOT NULL, -- zone_activation, supplier_density
  threshold_met integer NOT NULL, -- Number of users/suppliers that triggered bonus
  bonus_percentage numeric(5, 2) NOT NULL,
  active_from timestamptz NOT NULL,
  active_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: supplier_competition_config
-- Configuration for competition prize pools
CREATE TABLE IF NOT EXISTS supplier_competition_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rank integer UNIQUE NOT NULL,
  prize_amount integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default prize configuration
INSERT INTO supplier_competition_config (rank, prize_amount, is_active)
VALUES
  (1, 200000, true),
  (2, 100000, true),
  (3, 50000, true)
ON CONFLICT (rank) DO NOTHING;

-- Table: supplier_competition_pools
-- Monthly competition prize pools for suppliers in same zone
CREATE TABLE IF NOT EXISTS supplier_competition_pools (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id uuid NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  prize_pool jsonb NOT NULL, -- {"rank_1": 200000, "rank_2": 100000, "rank_3": 50000}
  winners jsonb, -- Array of {user_id, rank, prize, volume}
  status text DEFAULT 'active', -- active, completed, distributed
  distributed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: marketplace_health_metrics
-- Tracks overall marketplace health score
CREATE TABLE IF NOT EXISTS marketplace_health_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculated_at timestamptz DEFAULT now(),
  health_score numeric(5, 2) NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  avg_response_time integer, -- in minutes
  delivery_reliability numeric(5, 2), -- percentage
  customer_satisfaction numeric(5, 2), -- 1-5 rating
  active_suppliers integer,
  active_clients integer,
  total_orders_24h integer,
  bonus_triggered boolean DEFAULT false,
  bonus_percentage numeric(5, 2),
  created_at timestamptz DEFAULT now()
);

-- Table: viral_metrics
-- Tracks viral coefficient and growth metrics
CREATE TABLE IF NOT EXISTS viral_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_new_users integer DEFAULT 0,
  organic_signups integer DEFAULT 0, -- Without referral
  referred_signups integer DEFAULT 0, -- With referral
  viral_coefficient numeric(5, 2), -- k factor
  conversion_rate numeric(5, 2), -- Referred -> First order
  avg_referrals_per_user numeric(5, 2),
  top_referral_channel text, -- whatsapp, sms, instagram
  channel_breakdown jsonb, -- {"whatsapp": 45, "sms": 30, "instagram": 25}
  created_at timestamptz DEFAULT now()
);

-- Table: growth_cohorts
-- Tracks user cohorts and retention
CREATE TABLE IF NOT EXISTS growth_cohorts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_name text NOT NULL, -- "Jan-2025", "Feb-2025"
  cohort_start timestamptz NOT NULL,
  cohort_end timestamptz NOT NULL,
  initial_users integer DEFAULT 0,
  retention_week_1 numeric(5, 2),
  retention_week_4 numeric(5, 2),
  retention_week_12 numeric(5, 2),
  avg_orders_per_user numeric(5, 2),
  total_revenue integer DEFAULT 0,
  churn_risk_users jsonb, -- Array of user_ids at risk of churning
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: social_shares
-- Tracks social sharing activity
CREATE TABLE IF NOT EXISTS social_shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_type text NOT NULL, -- order_completion, achievement, referral
  share_channel text NOT NULL, -- whatsapp, instagram, sms
  content_type text, -- achievement_key, order_id, referral_code
  content_id text,
  clicks_received integer DEFAULT 0,
  conversions integer DEFAULT 0, -- Users who signed up via this share
  created_at timestamptz DEFAULT now()
);

-- Table: live_activity_feed
-- Real-time anonymized activity for social proof
CREATE TABLE IF NOT EXISTS live_activity_feed (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type text NOT NULL, -- order_placed, order_completed, user_joined
  zone_name text,
  anonymized_message text NOT NULL, -- "5 people in Cocody just ordered!"
  metadata jsonb, -- Additional context
  display_until timestamptz NOT NULL, -- Auto-expire old activities
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_zone_network_bonuses_zone_id ON zone_network_bonuses(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_network_bonuses_is_active ON zone_network_bonuses(is_active);

CREATE INDEX IF NOT EXISTS idx_supplier_competition_pools_zone_id ON supplier_competition_pools(zone_id);
CREATE INDEX IF NOT EXISTS idx_supplier_competition_pools_status ON supplier_competition_pools(status);
CREATE INDEX IF NOT EXISTS idx_supplier_competition_pools_period ON supplier_competition_pools(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_marketplace_health_calculated_at ON marketplace_health_metrics(calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_viral_metrics_period ON viral_metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_growth_cohorts_cohort_start ON growth_cohorts(cohort_start);

CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_share_channel ON social_shares(share_channel);
CREATE INDEX IF NOT EXISTS idx_social_shares_created_at ON social_shares(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_activity_display_until ON live_activity_feed(display_until);
CREATE INDEX IF NOT EXISTS idx_live_activity_created_at ON live_activity_feed(created_at DESC);

-- Triggers
CREATE TRIGGER update_zone_network_bonuses_updated_at BEFORE UPDATE ON zone_network_bonuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_competition_pools_updated_at BEFORE UPDATE ON supplier_competition_pools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_growth_cohorts_updated_at BEFORE UPDATE ON growth_cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Check zone activation threshold
CREATE OR REPLACE FUNCTION check_zone_activation()
RETURNS TRIGGER AS $$
DECLARE
  client_count integer;
  supplier_count integer;
BEGIN
  -- Count active clients in the zone
  SELECT COUNT(DISTINCT p.id) INTO client_count
  FROM profiles p
  WHERE p.role = 'client' 
    AND p.is_approved = true
    AND p.is_active = true
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.client_id = p.id
        AND ST_DWithin(
          o.coordinates::geography,
          (SELECT ST_Centroid(ST_Collect(coordinates::geometry))::geography 
           FROM orders 
           WHERE zone_id = NEW.id),
          10000 -- 10km radius
        )
    );
  
  -- Count active suppliers in the zone
  SELECT COUNT(DISTINCT supplier_id) INTO supplier_count
  FROM supplier_zones
  WHERE zone_id = NEW.id AND is_active = true;
  
  -- Trigger zone activation bonus if threshold met (10+ clients)
  IF client_count >= 10 AND NOT EXISTS (
    SELECT 1 FROM zone_network_bonuses
    WHERE zone_id = NEW.id AND bonus_type = 'zone_activation' AND is_active = true
  ) THEN
    INSERT INTO zone_network_bonuses (zone_id, bonus_type, threshold_met, bonus_percentage, active_from)
    VALUES (NEW.id, 'zone_activation', client_count, 10.0, now());
  END IF;
  
  -- Trigger supplier density bonus if threshold met (5+ suppliers)
  IF supplier_count >= 5 AND NOT EXISTS (
    SELECT 1 FROM zone_network_bonuses
    WHERE zone_id = NEW.id AND bonus_type = 'supplier_density' AND is_active = true
  ) THEN
    INSERT INTO zone_network_bonuses (zone_id, bonus_type, threshold_met, bonus_percentage, active_from)
    VALUES (NEW.id, 'supplier_density', supplier_count, 5.0, now());
    
    -- Create competition pool for this zone with dynamic prize configuration
    INSERT INTO supplier_competition_pools (
      zone_id, 
      period_start, 
      period_end, 
      prize_pool,
      status
    )
    VALUES (
      NEW.id,
      date_trunc('month', now()),
      date_trunc('month', now() + interval '1 month'),
      (
        SELECT jsonb_object_agg('rank_' || rank, prize_amount)
        FROM supplier_competition_config
        WHERE is_active = true
      ),
      'active'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Add to live activity feed
CREATE OR REPLACE FUNCTION add_to_activity_feed()
RETURNS TRIGGER AS $$
DECLARE
  zone_name text;
BEGIN
  -- Get zone name if available
  IF NEW.zone_id IS NOT NULL THEN
    SELECT commune_name INTO zone_name
    FROM delivery_zones
    WHERE id = NEW.zone_id;
  END IF;
  
  -- Add order placed activity
  IF NEW.status = 'pending' THEN
    INSERT INTO live_activity_feed (activity_type, zone_name, anonymized_message, display_until, metadata)
    VALUES (
      'order_placed',
      COALESCE(zone_name, 'Abidjan'),
      'Someone just ordered in ' || COALESCE(zone_name, 'Abidjan') || '!',
      now() + interval '30 minutes',
      jsonb_build_object('order_count', (SELECT COUNT(*) FROM orders WHERE created_at > now() - interval '1 hour'))
    );
  END IF;
  
  -- Add order completed activity
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    INSERT INTO live_activity_feed (activity_type, zone_name, anonymized_message, display_until, metadata)
    VALUES (
      'order_completed',
      COALESCE(zone_name, 'Abidjan'),
      'Order delivered successfully in ' || COALESCE(zone_name, 'Abidjan') || '! 🚚⚡',
      now() + interval '30 minutes',
      jsonb_build_object('recent_orders', (SELECT COUNT(*) FROM orders WHERE status = 'delivered' AND delivered_at > now() - interval '1 hour'))
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Add activity on order changes
CREATE TRIGGER add_order_to_activity_feed
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION add_to_activity_feed();

-- Function: Calculate marketplace health score
CREATE OR REPLACE FUNCTION calculate_marketplace_health()
RETURNS numeric AS $$
DECLARE
  health_score numeric;
  response_time integer;
  reliability numeric;
  satisfaction numeric;
BEGIN
  -- Calculate average response time (from order creation to acceptance)
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (accepted_at - created_at)) / 60), 0)
  INTO response_time
  FROM orders
  WHERE accepted_at IS NOT NULL
    AND created_at > now() - interval '7 days';
  
  -- Calculate delivery reliability (% of orders delivered successfully)
  SELECT COALESCE(
    (COUNT(*) FILTER (WHERE status = 'delivered')::numeric / NULLIF(COUNT(*), 0) * 100),
    100
  )
  INTO reliability
  FROM orders
  WHERE created_at > now() - interval '7 days';
  
  -- Calculate customer satisfaction (average rating)
  SELECT COALESCE(AVG(overall), 5.0)
  INTO satisfaction
  FROM ratings
  WHERE created_at > now() - interval '7 days';
  
  -- Calculate health score (weighted average)
  health_score := (
    (CASE WHEN response_time < 30 THEN 100 WHEN response_time < 60 THEN 80 ELSE 60 END * 0.3) +
    (reliability * 0.4) +
    (satisfaction / 5.0 * 100 * 0.3)
  );
  
  -- Insert metrics
  INSERT INTO marketplace_health_metrics (
    health_score,
    avg_response_time,
    delivery_reliability,
    customer_satisfaction,
    active_suppliers,
    active_clients,
    total_orders_24h,
    bonus_triggered,
    bonus_percentage
  )
  VALUES (
    health_score,
    response_time,
    reliability,
    satisfaction,
    (SELECT COUNT(*) FROM profiles WHERE role = 'supplier' AND is_active = true),
    (SELECT COUNT(*) FROM profiles WHERE role = 'client' AND is_active = true),
    (SELECT COUNT(*) FROM orders WHERE created_at > now() - interval '24 hours'),
    health_score > 85,
    CASE WHEN health_score > 85 THEN 2.0 ELSE 0 END
  );
  
  RETURN health_score;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate viral metrics
CREATE OR REPLACE FUNCTION calculate_viral_metrics(start_date timestamptz, end_date timestamptz)
RETURNS void AS $$
DECLARE
  total_new integer;
  organic integer;
  referred integer;
  viral_k numeric;
  conv_rate numeric;
BEGIN
  -- Count new users in period
  SELECT COUNT(*) INTO total_new
  FROM profiles
  WHERE created_at BETWEEN start_date AND end_date;
  
  -- Count referred users
  SELECT COUNT(DISTINCT referred_id) INTO referred
  FROM referrals
  WHERE created_at BETWEEN start_date AND end_date;
  
  organic := total_new - referred;
  
  -- Calculate viral coefficient
  -- k = (% of users who refer) * (avg referrals per referring user) * (conversion rate)
  WITH referrer_stats AS (
    SELECT 
      COUNT(DISTINCT referrer_id)::numeric / NULLIF(total_new, 0) as refer_percentage,
      AVG(referral_count) as avg_referrals
    FROM (
      SELECT referrer_id, COUNT(*) as referral_count
      FROM referrals
      WHERE created_at BETWEEN start_date AND end_date
      GROUP BY referrer_id
    ) sub
  ),
  conversion_stats AS (
    SELECT COUNT(*) FILTER (WHERE status = 'converted')::numeric / NULLIF(COUNT(*), 0) as conv_rate
    FROM referrals
    WHERE created_at BETWEEN start_date AND end_date
  )
  SELECT 
    COALESCE(rs.refer_percentage * rs.avg_referrals * cs.conv_rate, 0),
    COALESCE(cs.conv_rate * 100, 0)
  INTO viral_k, conv_rate
  FROM referrer_stats rs, conversion_stats cs;
  
  -- Insert metrics
  INSERT INTO viral_metrics (
    period_start,
    period_end,
    total_new_users,
    organic_signups,
    referred_signups,
    viral_coefficient,
    conversion_rate
  )
  VALUES (
    start_date,
    end_date,
    total_new,
    organic,
    referred,
    viral_k,
    conv_rate
  );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE supplier_competition_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_network_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_competition_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_activity_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view competition config"
  ON supplier_competition_config FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage competition config"
  ON supplier_competition_config FOR ALL
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

CREATE POLICY "Anyone can view zone bonuses"
  ON zone_network_bonuses FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view competition pools"
  ON supplier_competition_pools FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view marketplace health"
  ON marketplace_health_metrics FOR SELECT
  USING (true);

CREATE POLICY "Admins can view viral metrics"
  ON viral_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view growth cohorts"
  ON growth_cohorts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own shares"
  ON social_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares"
  ON social_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view live activity feed"
  ON live_activity_feed FOR SELECT
  USING (display_until > now());
