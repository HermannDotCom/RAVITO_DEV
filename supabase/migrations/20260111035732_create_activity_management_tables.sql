-- ============================================
-- DISTRI-NIGHT Activity Management Module
-- Migration: Create activity management tables for CHR daily tracking
-- ============================================

-- ============================================
-- 1. ESTABLISHMENT PRODUCTS TABLE
-- Stores selling prices to final customers (different from RAVITO purchase prices)
-- ============================================
CREATE TABLE IF NOT EXISTS establishment_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  selling_price INTEGER NOT NULL CHECK (selling_price > 0), -- Prix de vente au client final (FCFA)
  is_active BOOLEAN DEFAULT true,
  min_stock_alert INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, product_id)
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_establishment_products_org ON establishment_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_establishment_products_product ON establishment_products(product_id);
CREATE INDEX IF NOT EXISTS idx_establishment_products_active ON establishment_products(is_active);

-- ============================================
-- 2. DAILY SHEETS TABLE
-- Daily tracking sheet (one per day per establishment)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sheet_date DATE NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opening_cash INTEGER DEFAULT 0, -- Fond de caisse matin (FCFA)
  closing_cash INTEGER, -- Montant compté le soir (FCFA)
  theoretical_revenue INTEGER DEFAULT 0, -- CA théorique calculé
  cash_difference INTEGER, -- Écart de caisse
  expenses_total INTEGER DEFAULT 0,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, sheet_date)
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_sheets_org ON daily_sheets(organization_id);
CREATE INDEX IF NOT EXISTS idx_daily_sheets_date ON daily_sheets(sheet_date);
CREATE INDEX IF NOT EXISTS idx_daily_sheets_status ON daily_sheets(status);
CREATE INDEX IF NOT EXISTS idx_daily_sheets_org_date ON daily_sheets(organization_id, sheet_date);

-- ============================================
-- 3. DAILY STOCK LINES TABLE
-- Beverage stock lines per day
-- ============================================
CREATE TABLE IF NOT EXISTS daily_stock_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_sheet_id UUID NOT NULL REFERENCES daily_sheets(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  initial_stock INTEGER DEFAULT 0, -- Auto-reporté de J-1
  ravito_supply INTEGER DEFAULT 0, -- Auto: commandes RAVITO livrées ce jour
  external_supply INTEGER DEFAULT 0, -- Manuel: achats hors RAVITO
  final_stock INTEGER, -- Saisie manuelle le soir
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(daily_sheet_id, product_id)
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_stock_lines_sheet ON daily_stock_lines(daily_sheet_id);
CREATE INDEX IF NOT EXISTS idx_daily_stock_lines_product ON daily_stock_lines(product_id);

-- ============================================
-- 4. DAILY PACKAGING TABLE
-- Crate/packaging tracking by type
-- ============================================
CREATE TABLE IF NOT EXISTS daily_packaging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_sheet_id UUID NOT NULL REFERENCES daily_sheets(id) ON DELETE CASCADE,
  crate_type TEXT NOT NULL, -- C12, C24, C12V (same values as products.crate_type)
  qty_full_start INTEGER DEFAULT 0, -- Casiers pleins matin
  qty_empty_start INTEGER DEFAULT 0, -- Casiers vides matin
  qty_received INTEGER DEFAULT 0, -- Casiers reçus (livraisons RAVITO)
  qty_returned INTEGER DEFAULT 0, -- Casiers rendus aux fournisseurs
  qty_full_end INTEGER, -- Casiers pleins soir
  qty_empty_end INTEGER, -- Casiers vides soir
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(daily_sheet_id, crate_type)
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_packaging_sheet ON daily_packaging(daily_sheet_id);
CREATE INDEX IF NOT EXISTS idx_daily_packaging_type ON daily_packaging(crate_type);

-- ============================================
-- 5. DAILY EXPENSES TABLE
-- Daily expenses tracking
-- ============================================
CREATE TABLE IF NOT EXISTS daily_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_sheet_id UUID NOT NULL REFERENCES daily_sheets(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- "Glaçons", "Taxi", etc.
  amount INTEGER NOT NULL CHECK (amount > 0), -- Montant en FCFA
  category TEXT DEFAULT 'other' CHECK (category IN ('food', 'transport', 'utilities', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_expenses_sheet ON daily_expenses(daily_sheet_id);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_category ON daily_expenses(category);

-- ============================================
-- TRIGGERS - updated_at auto-update
-- ============================================

-- Trigger for establishment_products
CREATE OR REPLACE FUNCTION update_establishment_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER establishment_products_updated_at
BEFORE UPDATE ON establishment_products
FOR EACH ROW
EXECUTE FUNCTION update_establishment_products_updated_at();

-- Trigger for daily_sheets
CREATE OR REPLACE FUNCTION update_daily_sheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_sheets_updated_at
BEFORE UPDATE ON daily_sheets
FOR EACH ROW
EXECUTE FUNCTION update_daily_sheets_updated_at();

-- Trigger for daily_stock_lines
CREATE OR REPLACE FUNCTION update_daily_stock_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_stock_lines_updated_at
BEFORE UPDATE ON daily_stock_lines
FOR EACH ROW
EXECUTE FUNCTION update_daily_stock_lines_updated_at();

-- Trigger for daily_packaging
CREATE OR REPLACE FUNCTION update_daily_packaging_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_packaging_updated_at
BEFORE UPDATE ON daily_packaging
FOR EACH ROW
EXECUTE FUNCTION update_daily_packaging_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE establishment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stock_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_packaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policy for establishment_products
CREATE POLICY "Users can manage their organization establishment products"
  ON establishment_products
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policy for daily_sheets
CREATE POLICY "Users can manage their organization daily sheets"
  ON daily_sheets
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policy for daily_stock_lines
CREATE POLICY "Users can manage their organization daily stock lines"
  ON daily_stock_lines
  FOR ALL
  USING (
    daily_sheet_id IN (
      SELECT id FROM daily_sheets WHERE organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
        UNION
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- RLS Policy for daily_packaging
CREATE POLICY "Users can manage their organization daily packaging"
  ON daily_packaging
  FOR ALL
  USING (
    daily_sheet_id IN (
      SELECT id FROM daily_sheets WHERE organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
        UNION
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- RLS Policy for daily_expenses
CREATE POLICY "Users can manage their organization daily expenses"
  ON daily_expenses
  FOR ALL
  USING (
    daily_sheet_id IN (
      SELECT id FROM daily_sheets WHERE organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
        UNION
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- ============================================
-- SQL FUNCTIONS
-- ============================================

-- Function to create daily sheet with carryover from previous day
CREATE OR REPLACE FUNCTION create_daily_sheet_with_carryover(
  p_organization_id UUID,
  p_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_sheet_id UUID;
  v_previous_date DATE;
  v_previous_sheet_id UUID;
BEGIN
  -- Check if sheet already exists for this date
  SELECT id INTO v_sheet_id
  FROM daily_sheets
  WHERE organization_id = p_organization_id AND sheet_date = p_date;

  IF v_sheet_id IS NOT NULL THEN
    RETURN v_sheet_id;
  END IF;

  -- Create new daily sheet
  INSERT INTO daily_sheets (organization_id, sheet_date, status)
  VALUES (p_organization_id, p_date, 'open')
  RETURNING id INTO v_sheet_id;

  -- Find previous day's sheet
  v_previous_date := p_date - INTERVAL '1 day';
  SELECT id INTO v_previous_sheet_id
  FROM daily_sheets
  WHERE organization_id = p_organization_id AND sheet_date = v_previous_date;

  -- If previous day exists, carry over final stock as initial stock
  IF v_previous_sheet_id IS NOT NULL THEN
    -- Carry over stock lines
    INSERT INTO daily_stock_lines (daily_sheet_id, product_id, initial_stock, ravito_supply, external_supply)
    SELECT 
      v_sheet_id,
      product_id,
      COALESCE(final_stock, 0),
      0,
      0
    FROM daily_stock_lines
    WHERE daily_sheet_id = v_previous_sheet_id
      AND final_stock IS NOT NULL;

    -- Carry over packaging
    INSERT INTO daily_packaging (daily_sheet_id, crate_type, qty_full_start, qty_empty_start, qty_received, qty_returned)
    SELECT 
      v_sheet_id,
      crate_type,
      COALESCE(qty_full_end, 0),
      COALESCE(qty_empty_end, 0),
      0,
      0
    FROM daily_packaging
    WHERE daily_sheet_id = v_previous_sheet_id
      AND qty_full_end IS NOT NULL
      AND qty_empty_end IS NOT NULL;
  ELSE
    -- No previous day, initialize with all active establishment products
    INSERT INTO daily_stock_lines (daily_sheet_id, product_id, initial_stock, ravito_supply, external_supply)
    SELECT 
      v_sheet_id,
      product_id,
      0,
      0,
      0
    FROM establishment_products
    WHERE organization_id = p_organization_id AND is_active = true;

    -- Initialize common crate types
    INSERT INTO daily_packaging (daily_sheet_id, crate_type, qty_full_start, qty_empty_start, qty_received, qty_returned)
    VALUES 
      (v_sheet_id, 'C12', 0, 0, 0, 0),
      (v_sheet_id, 'C24', 0, 0, 0, 0),
      (v_sheet_id, 'C12V', 0, 0, 0, 0),
      (v_sheet_id, 'C6', 0, 0, 0, 0),
      (v_sheet_id, 'C20', 0, 0, 0, 0);
  END IF;

  RETURN v_sheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync RAVITO deliveries to daily sheet
CREATE OR REPLACE FUNCTION sync_ravito_deliveries_to_daily_sheet(
  p_sheet_id UUID
)
RETURNS void AS $$
DECLARE
  v_organization_id UUID;
  v_sheet_date DATE;
  v_order_record RECORD;
BEGIN
  -- Get sheet info
  SELECT organization_id, sheet_date INTO v_organization_id, v_sheet_date
  FROM daily_sheets
  WHERE id = p_sheet_id;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Daily sheet not found';
  END IF;

  -- Update ravito_supply from delivered orders on this date
  -- Loop through orders delivered on sheet_date for this organization
  FOR v_order_record IN
    SELECT o.id, o.packaging_snapshot
    FROM orders o
    WHERE o.client_id IN (
      SELECT owner_id FROM organizations WHERE id = v_organization_id
      UNION
      SELECT user_id FROM organization_members WHERE organization_id = v_organization_id AND status = 'active'
    )
    AND DATE(o.delivered_at) = v_sheet_date
    AND o.status = 'delivered'
  LOOP
    -- Update stock lines from order items
    UPDATE daily_stock_lines dsl
    SET ravito_supply = ravito_supply + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = v_order_record.id
      AND oi.product_id = dsl.product_id
      AND dsl.daily_sheet_id = p_sheet_id;

    -- Update packaging from order packaging_snapshot if available
    IF v_order_record.packaging_snapshot IS NOT NULL THEN
      UPDATE daily_packaging dp
      SET qty_received = qty_received + COALESCE((v_order_record.packaging_snapshot->>dp.crate_type)::INTEGER, 0)
      WHERE dp.daily_sheet_id = p_sheet_id
        AND v_order_record.packaging_snapshot ? dp.crate_type;
    END IF;
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_daily_sheet_with_carryover(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_ravito_deliveries_to_daily_sheet(UUID) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE establishment_products IS 'Stores selling prices to final customers (different from RAVITO purchase prices)';
COMMENT ON TABLE daily_sheets IS 'Daily tracking sheet (one per day per establishment)';
COMMENT ON TABLE daily_stock_lines IS 'Beverage stock lines per day';
COMMENT ON TABLE daily_packaging IS 'Crate/packaging tracking by type';
COMMENT ON TABLE daily_expenses IS 'Daily expenses tracking';

COMMENT ON FUNCTION create_daily_sheet_with_carryover IS 'Creates a new daily sheet and carries over final stock from previous day as initial stock';
COMMENT ON FUNCTION sync_ravito_deliveries_to_daily_sheet IS 'Syncs RAVITO deliveries to daily sheet ravito_supply and qty_received';
