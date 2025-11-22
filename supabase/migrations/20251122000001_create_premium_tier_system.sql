/*
  # Premium Tier Subscription System
  
  1. Tables
    - `premium_tiers` : Tier definitions (Basic/Free, Silver, Gold)
    - `supplier_subscriptions` : Supplier subscription management
    
  2. Features
    - Three tiers: Basic (Free), Silver (5000 FCFA/month), Gold (15000 FCFA/month)
    - Gold tier: Priority placement in offers, unlimited zones, advanced analytics, priority support
    - Silver tier: Priority placement, extended zones, basic analytics
    - Basic tier: Standard features
    
  3. Security
    - RLS policies for tier access
    - Admin-only tier management
    - Supplier can view own subscription
*/

-- Create enum for tier names
DO $$ BEGIN
  CREATE TYPE tier_name AS ENUM ('basic', 'silver', 'gold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for subscription status
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'pending', 'cancelled', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table: premium_tiers
-- Defines the three tier levels with their features and pricing
CREATE TABLE IF NOT EXISTS premium_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name tier_name UNIQUE NOT NULL,
  display_name text NOT NULL,
  price_monthly integer NOT NULL CHECK (price_monthly >= 0), -- in FCFA
  features jsonb NOT NULL DEFAULT '{}', -- Structured feature flags
  max_zones integer, -- NULL means unlimited
  has_priority_placement boolean DEFAULT false,
  has_advanced_analytics boolean DEFAULT false,
  has_priority_support boolean DEFAULT false,
  has_unlimited_zones boolean DEFAULT false,
  display_order integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: supplier_subscriptions
-- Manages supplier subscription to premium tiers
CREATE TABLE IF NOT EXISTS supplier_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES premium_tiers(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'pending',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  auto_renew boolean DEFAULT true,
  payment_method payment_method,
  last_payment_date timestamptz,
  next_payment_date timestamptz,
  total_paid integer DEFAULT 0 CHECK (total_paid >= 0), -- Total amount paid in FCFA
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  UNIQUE(supplier_id, tier_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplier_subscriptions_supplier_id ON supplier_subscriptions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_subscriptions_tier_id ON supplier_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_subscriptions_status ON supplier_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_supplier_subscriptions_ends_at ON supplier_subscriptions(ends_at);

-- Seed premium tiers
INSERT INTO premium_tiers (name, display_name, price_monthly, features, max_zones, has_priority_placement, has_advanced_analytics, has_priority_support, has_unlimited_zones, display_order, is_active)
VALUES 
  (
    'basic',
    'Basic (Gratuit)',
    0,
    '{"description": "Tier gratuit de base", "features": ["Accès aux commandes de votre zone", "Support standard", "Statistiques de base"]}'::jsonb,
    3, -- Limited to 3 zones
    false,
    false,
    false,
    false,
    1,
    true
  ),
  (
    'silver',
    'Silver (5000 FCFA/mois)',
    5000,
    '{"description": "Tier intermédiaire avec avantages", "features": ["Placement prioritaire dans les offres", "Jusqu''à 10 zones", "Statistiques avancées", "Support prioritaire par email"]}'::jsonb,
    10, -- Up to 10 zones
    true,
    false,
    false,
    false,
    2,
    true
  ),
  (
    'gold',
    'Gold (15000 FCFA/mois)',
    15000,
    '{"description": "Tier premium avec tous les avantages", "features": ["Placement PRIORITAIRE en tête des offres", "Zones illimitées", "Analytiques détaillées des acheteurs", "Support prioritaire dédié", "Badge Gold visible", "Boost de conversion ~40%"]}'::jsonb,
    NULL, -- Unlimited zones
    true,
    true,
    true,
    true,
    3,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Automatically create Basic tier subscription for all existing suppliers
INSERT INTO supplier_subscriptions (supplier_id, tier_id, status, starts_at, activated_at)
SELECT 
  p.id,
  pt.id,
  'active'::subscription_status,
  now(),
  now()
FROM profiles p
CROSS JOIN premium_tiers pt
WHERE p.role = 'supplier'
  AND pt.name = 'basic'
  AND NOT EXISTS (
    SELECT 1 FROM supplier_subscriptions ss
    WHERE ss.supplier_id = p.id
  )
ON CONFLICT (supplier_id, tier_id) DO NOTHING;

-- RLS on premium_tiers
ALTER TABLE premium_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can view tier information (needed for pricing pages)
CREATE POLICY "Anyone can view tier information"
  ON premium_tiers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can modify tiers
CREATE POLICY "Admins can manage tiers"
  ON premium_tiers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- RLS on supplier_subscriptions
ALTER TABLE supplier_subscriptions ENABLE ROW LEVEL SECURITY;

-- Suppliers can view their own subscriptions
CREATE POLICY "Suppliers can view own subscriptions"
  ON supplier_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'supplier'
    )
  );

-- Suppliers can create/update their own subscriptions (for upgrades/downgrades)
CREATE POLICY "Suppliers can manage own subscriptions"
  ON supplier_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'supplier'
        AND profiles.is_approved = true
    )
  );

CREATE POLICY "Suppliers can update own subscriptions"
  ON supplier_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'supplier'
    )
  );

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON supplier_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Function to get active subscription for a supplier
CREATE OR REPLACE FUNCTION get_active_subscription(supplier_uuid uuid)
RETURNS TABLE (
  subscription_id uuid,
  tier_name tier_name,
  tier_display_name text,
  has_priority_placement boolean,
  has_advanced_analytics boolean,
  has_priority_support boolean,
  has_unlimited_zones boolean,
  max_zones integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    pt.name,
    pt.display_name,
    pt.has_priority_placement,
    pt.has_advanced_analytics,
    pt.has_priority_support,
    pt.has_unlimited_zones,
    pt.max_zones
  FROM supplier_subscriptions ss
  JOIN premium_tiers pt ON ss.tier_id = pt.id
  WHERE ss.supplier_id = supplier_uuid
    AND ss.status = 'active'
    AND (ss.ends_at IS NULL OR ss.ends_at > now())
  ORDER BY pt.display_order DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if supplier has feature access
CREATE OR REPLACE FUNCTION has_tier_feature(supplier_uuid uuid, feature_name text)
RETURNS boolean AS $$
DECLARE
  has_feature boolean;
BEGIN
  SELECT 
    CASE 
      WHEN feature_name = 'priority_placement' THEN pt.has_priority_placement
      WHEN feature_name = 'advanced_analytics' THEN pt.has_advanced_analytics
      WHEN feature_name = 'priority_support' THEN pt.has_priority_support
      WHEN feature_name = 'unlimited_zones' THEN pt.has_unlimited_zones
      ELSE false
    END INTO has_feature
  FROM supplier_subscriptions ss
  JOIN premium_tiers pt ON ss.tier_id = pt.id
  WHERE ss.supplier_id = supplier_uuid
    AND ss.status = 'active'
    AND (ss.ends_at IS NULL OR ss.ends_at > now())
  ORDER BY pt.display_order DESC
  LIMIT 1;
  
  RETURN COALESCE(has_feature, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_premium_tiers_updated_at
  BEFORE UPDATE ON premium_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_subscriptions_updated_at
  BEFORE UPDATE ON supplier_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
