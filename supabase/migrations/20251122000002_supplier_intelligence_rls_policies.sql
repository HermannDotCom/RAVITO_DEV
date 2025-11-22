/*
  # Row Level Security Policies for Supplier Intelligence Dashboard
  
  This migration creates RLS policies for the Supplier Intelligence Dashboard tables
  to ensure proper access control based on user roles and subscription tiers.
*/

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_optimization_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_risk_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_share_tracking ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SUBSCRIPTION TIERS POLICIES
-- =============================================

-- All authenticated users can view active subscription tiers
CREATE POLICY "Anyone can view active subscription tiers"
  ON subscription_tiers
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage subscription tiers
CREATE POLICY "Only admins can insert subscription tiers"
  ON subscription_tiers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update subscription tiers"
  ON subscription_tiers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- SUPPLIER SUBSCRIPTIONS POLICIES
-- =============================================

-- Suppliers can view their own subscriptions
CREATE POLICY "Suppliers can view their own subscriptions"
  ON supplier_subscriptions
  FOR SELECT
  USING (supplier_id = auth.uid());

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON supplier_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Suppliers can create their own subscriptions
CREATE POLICY "Suppliers can create subscriptions"
  ON supplier_subscriptions
  FOR INSERT
  WITH CHECK (supplier_id = auth.uid());

-- Suppliers can update their own subscriptions (for cancellation, etc.)
CREATE POLICY "Suppliers can update their own subscriptions"
  ON supplier_subscriptions
  FOR UPDATE
  USING (supplier_id = auth.uid());

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON supplier_subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- SUPPLIER ANALYTICS POLICIES
-- =============================================

-- Suppliers can view their own analytics
CREATE POLICY "Suppliers can view their own analytics"
  ON supplier_analytics
  FOR SELECT
  USING (supplier_id = auth.uid());

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
  ON supplier_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System (service role) can insert/update analytics
-- This policy is used by edge functions and scheduled jobs
CREATE POLICY "Service role can manage analytics"
  ON supplier_analytics
  FOR ALL
  USING (
    -- Allow if called from service role context
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- =============================================
-- DEMAND FORECASTS POLICIES
-- =============================================

-- GOLD and PLATINUM tier suppliers can view demand forecasts
CREATE POLICY "Premium suppliers can view demand forecasts"
  ON demand_forecasts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM supplier_subscriptions ss
      JOIN subscription_tiers st ON ss.tier_id = st.id
      WHERE ss.supplier_id = auth.uid()
      AND ss.status = 'active'
      AND st.tier_name IN ('GOLD', 'PLATINUM')
    )
  );

-- Admins can view all forecasts
CREATE POLICY "Admins can view all forecasts"
  ON demand_forecasts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can manage forecasts
CREATE POLICY "Service role can manage forecasts"
  ON demand_forecasts
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- =============================================
-- MARKET INTELLIGENCE POLICIES
-- =============================================

-- SILVER and above can view published market intelligence
CREATE POLICY "Premium suppliers can view market intelligence"
  ON market_intelligence
  FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM supplier_subscriptions ss
      JOIN subscription_tiers st ON ss.tier_id = st.id
      WHERE ss.supplier_id = auth.uid()
      AND ss.status = 'active'
      AND st.tier_name IN ('SILVER', 'GOLD', 'PLATINUM')
    )
  );

-- Admins can view all intelligence
CREATE POLICY "Admins can view all market intelligence"
  ON market_intelligence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can manage intelligence
CREATE POLICY "Admins can manage market intelligence"
  ON market_intelligence
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- COMPETITOR BENCHMARKS POLICIES
-- =============================================

-- SILVER and above can view competitor benchmarks
CREATE POLICY "Premium suppliers can view benchmarks"
  ON competitor_benchmarks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM supplier_subscriptions ss
      JOIN subscription_tiers st ON ss.tier_id = st.id
      WHERE ss.supplier_id = auth.uid()
      AND ss.status = 'active'
      AND st.tier_name IN ('SILVER', 'GOLD', 'PLATINUM')
    )
  );

-- Admins can view all benchmarks
CREATE POLICY "Admins can view all benchmarks"
  ON competitor_benchmarks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can manage benchmarks
CREATE POLICY "Service role can manage benchmarks"
  ON competitor_benchmarks
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- =============================================
-- PRICE OPTIMIZATION POLICIES
-- =============================================

-- GOLD and PLATINUM suppliers can view their price suggestions
CREATE POLICY "Premium suppliers can view price suggestions"
  ON price_optimization_suggestions
  FOR SELECT
  USING (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM supplier_subscriptions ss
      JOIN subscription_tiers st ON ss.tier_id = st.id
      WHERE ss.supplier_id = auth.uid()
      AND ss.status = 'active'
      AND st.tier_name IN ('GOLD', 'PLATINUM')
    )
  );

-- Suppliers can mark suggestions as applied
CREATE POLICY "Suppliers can update their price suggestions"
  ON price_optimization_suggestions
  FOR UPDATE
  USING (supplier_id = auth.uid());

-- Admins can view all suggestions
CREATE POLICY "Admins can view all price suggestions"
  ON price_optimization_suggestions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can manage suggestions
CREATE POLICY "Service role can manage price suggestions"
  ON price_optimization_suggestions
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- =============================================
-- CHURN RISK PREDICTIONS POLICIES
-- =============================================

-- GOLD and PLATINUM suppliers can view their churn predictions
CREATE POLICY "Premium suppliers can view churn predictions"
  ON churn_risk_predictions
  FOR SELECT
  USING (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM supplier_subscriptions ss
      JOIN subscription_tiers st ON ss.tier_id = st.id
      WHERE ss.supplier_id = auth.uid()
      AND ss.status = 'active'
      AND st.tier_name IN ('GOLD', 'PLATINUM')
    )
  );

-- Admins can view all predictions
CREATE POLICY "Admins can view all churn predictions"
  ON churn_risk_predictions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can manage predictions
CREATE POLICY "Service role can manage churn predictions"
  ON churn_risk_predictions
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- =============================================
-- WHITE LABEL API KEYS POLICIES
-- =============================================

-- Only admins can view API keys
CREATE POLICY "Only admins can view API keys"
  ON white_label_api_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can manage API keys
CREATE POLICY "Only admins can manage API keys"
  ON white_label_api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- REVENUE SHARE TRACKING POLICIES
-- =============================================

-- Only admins can view revenue share tracking
CREATE POLICY "Only admins can view revenue tracking"
  ON revenue_share_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role can manage revenue tracking
CREATE POLICY "Service role can manage revenue tracking"
  ON revenue_share_tracking
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- =============================================
-- HELPER FUNCTION: CHECK SUBSCRIPTION TIER
-- =============================================

-- Function to check if a supplier has access to a specific feature
CREATE OR REPLACE FUNCTION has_feature_access(
  p_supplier_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier_name TEXT;
BEGIN
  -- Get the supplier's current tier
  SELECT st.tier_name INTO v_tier_name
  FROM supplier_subscriptions ss
  JOIN subscription_tiers st ON ss.tier_id = st.id
  WHERE ss.supplier_id = p_supplier_id
  AND ss.status = 'active'
  LIMIT 1;
  
  -- If no subscription, they have FREE tier access
  IF v_tier_name IS NULL THEN
    v_tier_name := 'FREE';
  END IF;
  
  -- Check feature access based on tier
  CASE p_feature
    WHEN 'basic_dashboard' THEN
      RETURN TRUE; -- All tiers
    WHEN 'advanced_analytics' THEN
      RETURN v_tier_name IN ('SILVER', 'GOLD', 'PLATINUM');
    WHEN 'ml_predictions' THEN
      RETURN v_tier_name IN ('GOLD', 'PLATINUM');
    WHEN 'api_access' THEN
      RETURN v_tier_name = 'PLATINUM';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ENABLE REALTIME FOR KEY TABLES
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE supplier_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE supplier_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE demand_forecasts;
ALTER PUBLICATION supabase_realtime ADD TABLE price_optimization_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE churn_risk_predictions;
