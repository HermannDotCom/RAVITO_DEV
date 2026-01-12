-- ============================================
-- Fonction pour synchroniser les types d''emballages
-- ============================================

CREATE OR REPLACE FUNCTION sync_daily_packaging_types(p_daily_sheet_id UUID)
RETURNS void AS $$
DECLARE
  v_crate_type RECORD;
BEGIN
  -- Pour chaque type consignable actif dans crate_types
  FOR v_crate_type IN 
    SELECT code 
    FROM crate_types 
    WHERE is_consignable = true AND is_active = true
  LOOP
    -- Ajouter le type s'il n'existe pas déjà dans daily_packaging
    INSERT INTO daily_packaging (
      daily_sheet_id, 
      crate_type, 
      qty_full_start, 
      qty_empty_start, 
      qty_received, 
      qty_returned, 
      qty_consignes_paid, 
      notes
    )
    VALUES (
      p_daily_sheet_id, 
      v_crate_type.code, 
      0, 
      0, 
      0, 
      0, 
      0, 
      NULL
    )
    ON CONFLICT (daily_sheet_id, crate_type) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_daily_packaging_types(UUID) TO authenticated;

COMMENT ON FUNCTION sync_daily_packaging_types IS 'Synchronise les types d''emballages consignables avec la feuille journalière';

-- ============================================
-- Mise à jour de create_daily_sheet_with_carryover
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
  v_crate_type RECORD;
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
    
    -- Ajouter les nouveaux types consignables qui n'étaient pas dans J-1
    FOR v_crate_type IN 
      SELECT code FROM crate_types 
      WHERE is_consignable = true AND is_active = true
      AND code NOT IN (SELECT crate_type FROM daily_packaging WHERE daily_sheet_id = v_sheet_id)
    LOOP
      INSERT INTO daily_packaging (daily_sheet_id, crate_type, qty_full_start, qty_empty_start, qty_received, qty_returned, qty_consignes_paid, notes)
      VALUES (v_sheet_id, v_crate_type.code, 0, 0, 0, 0, 0, NULL);
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
    -- Jour 1 : créer avec TOUS les types consignables depuis crate_types
    FOR v_crate_type IN 
      SELECT code FROM crate_types 
      WHERE is_consignable = true AND is_active = true
      ORDER BY display_order
    LOOP
      INSERT INTO daily_packaging (daily_sheet_id, crate_type, qty_full_start, qty_empty_start, qty_received, qty_returned, qty_consignes_paid, notes)
      VALUES (v_sheet_id, v_crate_type.code, 0, 0, 0, 0, 0, NULL);
    END LOOP;
      
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_daily_sheet_with_carryover(UUID, DATE) TO authenticated;

COMMENT ON FUNCTION create_daily_sheet_with_carryover IS 'Crée une nouvelle feuille journalière avec report des données de J-1 et synchronisation des types d''emballages';
