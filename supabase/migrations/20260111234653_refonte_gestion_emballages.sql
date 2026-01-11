-- ============================================
-- DISTRI-NIGHT Activity Management Module
-- Migration: Refonte Gestion Emballages
-- ============================================

-- ============================================
-- 1. Add new columns to daily_packaging
-- ============================================
ALTER TABLE daily_packaging 
ADD COLUMN IF NOT EXISTS qty_consignes_paid INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN daily_packaging.qty_consignes_paid IS 'Nombre de casiers dont la consigne a été payée (explique un écart positif)';
COMMENT ON COLUMN daily_packaging.notes IS 'Observations libres (casse, vol, perte, etc.)';

-- ============================================
-- 2. Update create_daily_sheet_with_carryover function
-- ============================================
CREATE OR REPLACE FUNCTION create_daily_sheet_with_carryover(
  p_organization_id UUID,
  p_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_sheet_id UUID;
  v_previous_sheet_id UUID;
  v_crate RECORD;
BEGIN
  -- Créer la nouvelle sheet
  INSERT INTO daily_sheets (organization_id, sheet_date, status)
  VALUES (p_organization_id, p_date, 'open')
  RETURNING id INTO v_sheet_id;

  -- Récupérer la sheet de J-1
  SELECT id INTO v_previous_sheet_id
  FROM daily_sheets
  WHERE organization_id = p_organization_id
    AND sheet_date = p_date - INTERVAL '1 day';

  -- Reporter les emballages de J-1
  IF v_previous_sheet_id IS NOT NULL THEN
    FOR v_crate IN 
      SELECT crate_type, 
             COALESCE(qty_full_end, qty_full_start) as full_start,
             COALESCE(qty_empty_end, qty_empty_start) as empty_start
      FROM daily_packaging 
      WHERE daily_sheet_id = v_previous_sheet_id
    LOOP
      INSERT INTO daily_packaging (daily_sheet_id, crate_type, qty_full_start, qty_empty_start, qty_received, qty_returned, qty_consignes_paid, notes)
      VALUES (v_sheet_id, v_crate.crate_type, v_crate.full_start, v_crate.empty_start, 0, 0, 0, NULL);
    END LOOP;
    
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
  ELSE
    -- Jour 1 : créer avec les nouveaux types consignables
    INSERT INTO daily_packaging (daily_sheet_id, crate_type, qty_full_start, qty_empty_start, qty_received, qty_returned, qty_consignes_paid, notes)
    VALUES 
      (v_sheet_id, 'B33', 0, 0, 0, 0, 0, NULL),
      (v_sheet_id, 'B65', 0, 0, 0, 0, 0, NULL),
      (v_sheet_id, 'B100', 0, 0, 0, 0, 0, NULL),
      (v_sheet_id, 'B50V', 0, 0, 0, 0, 0, NULL),
      (v_sheet_id, 'B100V', 0, 0, 0, 0, 0, NULL);
      
    -- Initialize with all active establishment products
    INSERT INTO daily_stock_lines (daily_sheet_id, product_id, initial_stock, ravito_supply, external_supply)
    SELECT 
      v_sheet_id,
      product_id,
      0,
      0,
      0
    FROM establishment_products
    WHERE organization_id = p_organization_id AND is_active = true;
  END IF;

  RETURN v_sheet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Update sync_ravito_deliveries_to_daily_sheet function
-- ============================================
CREATE OR REPLACE FUNCTION sync_ravito_deliveries_to_daily_sheet(
  p_sheet_id UUID
)
RETURNS void AS $$
DECLARE
  v_organization_id UUID;
  v_sheet_date DATE;
BEGIN
  -- Get sheet info
  SELECT organization_id, sheet_date INTO v_organization_id, v_sheet_date
  FROM daily_sheets
  WHERE id = p_sheet_id;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'Daily sheet not found';
  END IF;

  -- Reset ravito_supply and qty_received/qty_returned to recalculate
  UPDATE daily_stock_lines SET ravito_supply = 0 WHERE daily_sheet_id = p_sheet_id;
  UPDATE daily_packaging SET qty_received = 0, qty_returned = 0 WHERE daily_sheet_id = p_sheet_id;

  -- Update stock lines from delivered orders
  UPDATE daily_stock_lines dsl
  SET ravito_supply = ravito_supply + sub.total_qty
  FROM (
    SELECT oi.product_id, SUM(oi.quantity) as total_qty
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.client_id IN (
      SELECT owner_id FROM organizations WHERE id = v_organization_id
      UNION
      SELECT user_id FROM organization_members WHERE organization_id = v_organization_id AND status = 'active'
    )
    AND DATE(o.delivered_at) = v_sheet_date
    AND o.status = 'delivered'
    GROUP BY oi.product_id
  ) sub
  WHERE dsl.daily_sheet_id = p_sheet_id
    AND dsl.product_id = sub.product_id;

  -- Update qty_received (ALL consignable crates delivered)
  UPDATE daily_packaging dp
  SET qty_received = sub.total_qty
  FROM (
    SELECT 
      CASE 
        WHEN p.crate_type IN ('C24') THEN 'B33'
        WHEN p.crate_type IN ('C12') THEN 'B65'
        ELSE p.crate_type
      END as mapped_crate_type,
      SUM(oi.quantity) as total_qty
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.client_id IN (
      SELECT owner_id FROM organizations WHERE id = v_organization_id
      UNION
      SELECT user_id FROM organization_members WHERE organization_id = v_organization_id AND status = 'active'
    )
    AND DATE(o.delivered_at) = v_sheet_date
    AND o.status = 'delivered'
    AND p.consign_price > 0
    AND p.crate_type NOT LIKE 'CARTON%'
    AND p.crate_type NOT LIKE 'PACK%'
    GROUP BY mapped_crate_type
  ) sub
  WHERE dp.daily_sheet_id = p_sheet_id
    AND dp.crate_type = sub.mapped_crate_type;

  -- Update qty_returned (only crates WITHOUT consigne paid = withConsigne = false)
  UPDATE daily_packaging dp
  SET qty_returned = sub.total_qty
  FROM (
    SELECT 
      CASE 
        WHEN p.crate_type IN ('C24') THEN 'B33'
        WHEN p.crate_type IN ('C12') THEN 'B65'
        ELSE p.crate_type
      END as mapped_crate_type,
      SUM(oi.quantity) as total_qty
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.client_id IN (
      SELECT owner_id FROM organizations WHERE id = v_organization_id
      UNION
      SELECT user_id FROM organization_members WHERE organization_id = v_organization_id AND status = 'active'
    )
    AND DATE(o.delivered_at) = v_sheet_date
    AND o.status = 'delivered'
    AND p.consign_price > 0
    AND p.crate_type NOT LIKE 'CARTON%'
    AND p.crate_type NOT LIKE 'PACK%'
    AND oi.with_consigne = false  -- SEULEMENT SANS CONSIGNE PAYÉE
    GROUP BY mapped_crate_type
  ) sub
  WHERE dp.daily_sheet_id = p_sheet_id
    AND dp.crate_type = sub.mapped_crate_type;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_daily_sheet_with_carryover(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_ravito_deliveries_to_daily_sheet(UUID) TO authenticated;
