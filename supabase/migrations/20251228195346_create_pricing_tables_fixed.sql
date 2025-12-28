/*
  # Create Pricing Tables - Fixed Version
  
  ## Problem
  Frontend is trying to access reference_prices and price_analytics tables that don't exist
  
  ## Solution
  Create minimal versions of these tables with correct references to delivery_zones
*/

-- Create pricing_categories
CREATE TABLE IF NOT EXISTS pricing_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  parent_category_id uuid REFERENCES pricing_categories(id) ON DELETE SET NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reference_prices (with delivery_zones reference)
CREATE TABLE IF NOT EXISTS reference_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES delivery_zones(id) ON DELETE CASCADE,
  category_id uuid REFERENCES pricing_categories(id) ON DELETE SET NULL,
  
  reference_unit_price integer NOT NULL CHECK (reference_unit_price >= 0),
  reference_crate_price integer NOT NULL CHECK (reference_crate_price >= 0),
  reference_consign_price integer NOT NULL CHECK (reference_consign_price >= 0),
  
  effective_from timestamptz DEFAULT now(),
  effective_to timestamptz,
  is_active boolean DEFAULT true,
  
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create price_analytics (with delivery_zones reference)
CREATE TABLE IF NOT EXISTS price_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES delivery_zones(id) ON DELETE CASCADE,
  
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  reference_price_avg integer,
  supplier_price_min integer,
  supplier_price_max integer,
  supplier_price_avg integer,
  supplier_price_median integer,
  
  avg_variance_percentage numeric(5,2),
  max_variance_percentage numeric(5,2),
  
  total_orders integer DEFAULT 0,
  total_quantity integer DEFAULT 0,
  total_suppliers integer DEFAULT 0,
  
  calculated_at timestamptz DEFAULT now(),
  is_current boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pricing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for pricing_categories
DROP POLICY IF EXISTS "Admin full access to pricing_categories" ON pricing_categories;
CREATE POLICY "Admin full access to pricing_categories"
  ON pricing_categories FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Read active pricing_categories" ON pricing_categories;
CREATE POLICY "Read active pricing_categories"
  ON pricing_categories FOR SELECT
  USING (is_active = true);

-- Policies for reference_prices
DROP POLICY IF EXISTS "Admin full access to reference_prices" ON reference_prices;
CREATE POLICY "Admin full access to reference_prices"
  ON reference_prices FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Read active reference_prices" ON reference_prices;
CREATE POLICY "Read active reference_prices"
  ON reference_prices FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Policies for price_analytics  
DROP POLICY IF EXISTS "Admin full access to price_analytics" ON price_analytics;
CREATE POLICY "Admin full access to price_analytics"
  ON price_analytics FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Supplier read current price_analytics" ON price_analytics;
CREATE POLICY "Supplier read current price_analytics"
  ON price_analytics FOR SELECT
  USING (
    is_current = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reference_prices_product ON reference_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_reference_prices_zone ON reference_prices(zone_id);
CREATE INDEX IF NOT EXISTS idx_reference_prices_active ON reference_prices(is_active);

CREATE INDEX IF NOT EXISTS idx_price_analytics_product ON price_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_price_analytics_zone ON price_analytics(zone_id);
CREATE INDEX IF NOT EXISTS idx_price_analytics_current ON price_analytics(is_current);
