/*
  # Supplier Intelligence Dashboard Schema
  
  This migration creates the infrastructure for the Supplier Intelligence Dashboard,
  enabling advanced analytics, market intelligence, and subscription management.
  
  ## New Tables
  
  ### 1. subscription_tiers
  Defines the available subscription tiers (FREE, SILVER, GOLD, PLATINUM)
  
  ### 2. supplier_subscriptions
  Tracks supplier subscriptions and tier assignments
  
  ### 3. supplier_analytics
  Stores real-time performance metrics and KPIs for suppliers
  
  ### 4. demand_forecasts
  ML-based demand predictions by zone, hour, and day
  
  ### 5. market_intelligence
  Market trends, insights, and seasonal patterns
  
  ### 6. competitor_benchmarks
  Anonymous competitor performance data for benchmarking
  
  ### 7. price_optimization_suggestions
  AI-generated price optimization recommendations
  
  ### 8. churn_risk_predictions
  Predictive analytics for customer churn risk
  
  ### 9. white_label_api_keys
  API keys for white-label integration partners
  
  ### 10. revenue_share_tracking
  Tracks revenue sharing for white-label transactions
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. SUBSCRIPTION TIERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name TEXT NOT NULL UNIQUE CHECK (tier_name IN ('FREE', 'SILVER', 'GOLD', 'PLATINUM')),
  monthly_price INTEGER NOT NULL DEFAULT 0, -- Price in FCFA
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. SUPPLIER SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS supplier_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  payment_method TEXT,
  last_payment_at TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(supplier_id, status) WHERE status = 'active' -- Only one active subscription per supplier
);

-- =============================================
-- 3. SUPPLIER ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS supplier_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Order Metrics
  total_orders INTEGER NOT NULL DEFAULT 0,
  accepted_orders INTEGER NOT NULL DEFAULT 0,
  completed_orders INTEGER NOT NULL DEFAULT 0,
  cancelled_orders INTEGER NOT NULL DEFAULT 0,
  acceptance_rate NUMERIC(5,2), -- Percentage
  
  -- Revenue Metrics
  gross_revenue INTEGER NOT NULL DEFAULT 0, -- FCFA
  net_revenue INTEGER NOT NULL DEFAULT 0, -- After commissions
  average_order_value INTEGER NOT NULL DEFAULT 0,
  
  -- Performance Metrics
  average_delivery_time INTEGER, -- Minutes
  on_time_delivery_rate NUMERIC(5,2), -- Percentage
  customer_satisfaction NUMERIC(3,2), -- Average rating 1-5
  
  -- Customer Metrics
  unique_customers INTEGER NOT NULL DEFAULT 0,
  repeat_customers INTEGER NOT NULL DEFAULT 0,
  new_customers INTEGER NOT NULL DEFAULT 0,
  churn_customers INTEGER NOT NULL DEFAULT 0,
  
  -- Zone Coverage
  zones_served JSONB DEFAULT '[]'::jsonb, -- Array of zone IDs
  primary_zone TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(supplier_id, date)
);

-- =============================================
-- 4. DEMAND FORECASTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES delivery_zones(id) ON DELETE CASCADE,
  product_category TEXT NOT NULL,
  forecast_date DATE NOT NULL,
  forecast_hour INTEGER CHECK (forecast_hour >= 0 AND forecast_hour < 24),
  
  -- Forecast Data
  predicted_demand INTEGER NOT NULL, -- Number of orders expected
  confidence_level NUMERIC(3,2), -- 0-1 scale
  demand_intensity TEXT CHECK (demand_intensity IN ('low', 'medium', 'high', 'very_high')),
  
  -- Factors
  seasonality_factor NUMERIC(5,2),
  weather_factor NUMERIC(5,2),
  event_factor NUMERIC(5,2), -- Holidays, matches, etc.
  historical_average INTEGER,
  
  -- Recommendations
  suggested_stock_level INTEGER,
  suggested_pricing_adjustment NUMERIC(5,2), -- Percentage
  
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(zone_id, product_category, forecast_date, forecast_hour)
);

-- =============================================
-- 5. MARKET INTELLIGENCE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS market_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'quarterly', 'special')),
  title TEXT NOT NULL,
  report_date DATE NOT NULL,
  zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
  
  -- Market Data
  total_market_volume INTEGER, -- Total orders in period
  total_market_value INTEGER, -- Total FCFA
  growth_rate NUMERIC(5,2), -- Percentage vs previous period
  
  -- Trends
  trending_products JSONB DEFAULT '[]'::jsonb,
  declining_products JSONB DEFAULT '[]'::jsonb,
  emerging_zones JSONB DEFAULT '[]'::jsonb,
  
  -- Insights
  key_insights JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Heatmap Data
  demand_heatmap JSONB DEFAULT '{}'::jsonb,
  
  report_url TEXT, -- PDF URL
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 6. COMPETITOR BENCHMARKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS competitor_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES delivery_zones(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Benchmark Categories
  category TEXT NOT NULL DEFAULT 'overall' CHECK (category IN ('overall', 'by_zone', 'by_product_category')),
  
  -- Performance Metrics (Anonymized)
  avg_delivery_time INTEGER, -- Zone average in minutes
  avg_acceptance_rate NUMERIC(5,2), -- Zone average percentage
  avg_customer_rating NUMERIC(3,2), -- Zone average 1-5
  avg_order_value INTEGER, -- Zone average FCFA
  
  -- Percentile Data
  top_10_percent_metrics JSONB DEFAULT '{}'::jsonb,
  top_25_percent_metrics JSONB DEFAULT '{}'::jsonb,
  median_metrics JSONB DEFAULT '{}'::jsonb,
  
  total_suppliers_in_benchmark INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(zone_id, period_start, period_end, category)
);

-- =============================================
-- 7. PRICE OPTIMIZATION SUGGESTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS price_optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Current State
  current_price INTEGER NOT NULL,
  current_demand INTEGER NOT NULL,
  
  -- Suggestions
  suggested_price INTEGER NOT NULL,
  expected_demand_change NUMERIC(5,2), -- Percentage
  expected_revenue_impact INTEGER, -- FCFA
  
  -- Reasoning
  optimization_type TEXT CHECK (optimization_type IN ('increase_revenue', 'increase_volume', 'competitive', 'seasonal')),
  demand_elasticity NUMERIC(5,4),
  confidence_score NUMERIC(3,2),
  reasoning TEXT,
  
  -- Validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_applied BOOLEAN NOT NULL DEFAULT false,
  applied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 8. CHURN RISK PREDICTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS churn_risk_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Risk Assessment
  churn_risk_score NUMERIC(3,2) NOT NULL, -- 0-1 scale
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Contributing Factors
  factors JSONB DEFAULT '[]'::jsonb, -- Array of risk factors
  
  -- Recommendations
  retention_actions JSONB DEFAULT '[]'::jsonb,
  estimated_lifetime_value INTEGER, -- Potential revenue at risk
  
  -- Predictions
  predicted_churn_date DATE,
  confidence_level NUMERIC(3,2),
  
  -- Status
  is_churned BOOLEAN NOT NULL DEFAULT false,
  churned_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(supplier_id, customer_id, created_at)
);

-- =============================================
-- 9. WHITE LABEL API KEYS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS white_label_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT NOT NULL,
  
  -- Access Control
  is_active BOOLEAN NOT NULL DEFAULT true,
  allowed_endpoints JSONB DEFAULT '[]'::jsonb,
  rate_limit INTEGER NOT NULL DEFAULT 1000, -- Requests per hour
  
  -- Business Terms
  revenue_share_percentage NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  
  -- Usage Tracking
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 10. REVENUE SHARE TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS revenue_share_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID NOT NULL REFERENCES white_label_api_keys(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('order', 'subscription', 'service')),
  gross_amount INTEGER NOT NULL,
  platform_share INTEGER NOT NULL,
  partner_share INTEGER NOT NULL,
  
  -- Settlement
  settlement_status TEXT NOT NULL DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'processed', 'paid')),
  settled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Supplier subscriptions indexes
CREATE INDEX idx_supplier_subscriptions_supplier_id ON supplier_subscriptions(supplier_id);
CREATE INDEX idx_supplier_subscriptions_status ON supplier_subscriptions(status);
CREATE INDEX idx_supplier_subscriptions_expires_at ON supplier_subscriptions(expires_at);

-- Supplier analytics indexes
CREATE INDEX idx_supplier_analytics_supplier_id ON supplier_analytics(supplier_id);
CREATE INDEX idx_supplier_analytics_date ON supplier_analytics(date);
CREATE INDEX idx_supplier_analytics_supplier_date ON supplier_analytics(supplier_id, date);

-- Demand forecasts indexes
CREATE INDEX idx_demand_forecasts_zone_id ON demand_forecasts(zone_id);
CREATE INDEX idx_demand_forecasts_date ON demand_forecasts(forecast_date);
CREATE INDEX idx_demand_forecasts_category ON demand_forecasts(product_category);
CREATE INDEX idx_demand_forecasts_zone_date ON demand_forecasts(zone_id, forecast_date);

-- Market intelligence indexes
CREATE INDEX idx_market_intelligence_report_date ON market_intelligence(report_date);
CREATE INDEX idx_market_intelligence_zone_id ON market_intelligence(zone_id);
CREATE INDEX idx_market_intelligence_type ON market_intelligence(report_type);

-- Competitor benchmarks indexes
CREATE INDEX idx_competitor_benchmarks_zone_id ON competitor_benchmarks(zone_id);
CREATE INDEX idx_competitor_benchmarks_period ON competitor_benchmarks(period_start, period_end);

-- Price optimization indexes
CREATE INDEX idx_price_optimization_supplier_id ON price_optimization_suggestions(supplier_id);
CREATE INDEX idx_price_optimization_product_id ON price_optimization_suggestions(product_id);
CREATE INDEX idx_price_optimization_valid ON price_optimization_suggestions(valid_from, valid_until);

-- Churn risk indexes
CREATE INDEX idx_churn_risk_supplier_id ON churn_risk_predictions(supplier_id);
CREATE INDEX idx_churn_risk_customer_id ON churn_risk_predictions(customer_id);
CREATE INDEX idx_churn_risk_level ON churn_risk_predictions(risk_level);

-- API keys indexes
CREATE INDEX idx_white_label_api_keys_api_key ON white_label_api_keys(api_key);
CREATE INDEX idx_white_label_api_keys_active ON white_label_api_keys(is_active);

-- Revenue share indexes
CREATE INDEX idx_revenue_share_api_key_id ON revenue_share_tracking(api_key_id);
CREATE INDEX idx_revenue_share_order_id ON revenue_share_tracking(order_id);
CREATE INDEX idx_revenue_share_settlement_status ON revenue_share_tracking(settlement_status);

-- =============================================
-- SEED SUBSCRIPTION TIERS
-- =============================================

INSERT INTO subscription_tiers (tier_name, monthly_price, features, limits, display_order) VALUES
(
  'FREE',
  0,
  '["Basic dashboard", "Last 7 days data", "Order history", "Basic performance metrics"]'::jsonb,
  '{"reports": 0, "api_calls": 0, "data_retention_days": 7, "support": "community"}'::jsonb,
  1
),
(
  'SILVER',
  5000,
  '["Advanced analytics", "Weekly reports", "30 days data retention", "Email support", "Competitor benchmarking"]'::jsonb,
  '{"reports": 4, "api_calls": 100, "data_retention_days": 30, "support": "email"}'::jsonb,
  2
),
(
  'GOLD',
  15000,
  '["Real-time ML predictions", "Daily insights", "90 days data retention", "Priority support", "Price optimization", "Churn risk alerts", "Custom reports"]'::jsonb,
  '{"reports": "unlimited", "api_calls": 1000, "data_retention_days": 90, "support": "priority", "dedicated_manager": true}'::jsonb,
  3
),
(
  'PLATINUM',
  50000,
  '["Custom API access", "Unlimited data retention", "White-label integration", "24/7 support", "Data partnership", "Custom ML models", "Dedicated account manager"]'::jsonb,
  '{"reports": "unlimited", "api_calls": "unlimited", "data_retention_days": "unlimited", "support": "24/7", "dedicated_manager": true, "api_access": true}'::jsonb,
  4
);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_subscriptions_updated_at
  BEFORE UPDATE ON supplier_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_analytics_updated_at
  BEFORE UPDATE ON supplier_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_intelligence_updated_at
  BEFORE UPDATE ON market_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_churn_risk_predictions_updated_at
  BEFORE UPDATE ON churn_risk_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_label_api_keys_updated_at
  BEFORE UPDATE ON white_label_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE subscription_tiers IS 'Defines available subscription tiers with features and pricing';
COMMENT ON TABLE supplier_subscriptions IS 'Tracks supplier subscriptions and billing';
COMMENT ON TABLE supplier_analytics IS 'Daily performance metrics and KPIs for suppliers';
COMMENT ON TABLE demand_forecasts IS 'ML-based demand predictions for planning';
COMMENT ON TABLE market_intelligence IS 'Market trends and intelligence reports';
COMMENT ON TABLE competitor_benchmarks IS 'Anonymous competitor performance data';
COMMENT ON TABLE price_optimization_suggestions IS 'AI-driven price optimization recommendations';
COMMENT ON TABLE churn_risk_predictions IS 'Customer churn risk predictions and retention actions';
COMMENT ON TABLE white_label_api_keys IS 'API keys for white-label partner integration';
COMMENT ON TABLE revenue_share_tracking IS 'Tracks revenue sharing for white-label transactions';
