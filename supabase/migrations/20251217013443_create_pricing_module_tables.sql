/*
  # Module de Tarification Dynamique - Tables & RLS
  
  ## Vue d'ensemble
  Ce migration crée l'infrastructure complète pour le module de tarification dynamique RAVITO.
  Il permet la gestion centralisée des prix de référence (admin) et des grilles tarifaires (fournisseurs).
  
  ## Tables créées
  1. pricing_categories - Catégories de produits pour la tarification
  2. products_catalog - Catalogue centralisé RAVITO (référence)
  3. reference_prices - Prix de référence par produit/zone (Admin)
  4. supplier_price_grids - Grilles tarifaires fournisseur
  5. supplier_price_grid_history - Audit trail des modifications
  6. order_pricing_snapshot - Snapshot des prix lors de la commande
  7. price_analytics - Statistiques & market intelligence
  
  ## Sécurité (RLS)
  - Admin: accès complet aux prix de référence
  - Fournisseur: accès uniquement à ses propres grilles
  - Client: lecture seule des prix de référence
*/

-- ============================================================================
-- 1. PRICING_CATEGORIES - Catégories de produits
-- ============================================================================
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

-- Index pour les requêtes fréquentes
CREATE INDEX idx_pricing_categories_active ON pricing_categories(is_active);
CREATE INDEX idx_pricing_categories_parent ON pricing_categories(parent_category_id);

-- ============================================================================
-- 2. PRODUCTS_CATALOG - Catalogue centralisé RAVITO
-- ============================================================================
-- Note: Réutilise la table 'products' existante
-- On ajoute juste un commentaire pour clarifier l'usage
COMMENT ON TABLE products IS 'Catalogue centralisé RAVITO - utilisé pour les prix de référence';

-- ============================================================================
-- 3. REFERENCE_PRICES - Prix de référence par produit/zone (Admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reference_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES zones(id) ON DELETE CASCADE,
  category_id uuid REFERENCES pricing_categories(id) ON DELETE SET NULL,
  
  -- Prix de référence RAVITO
  reference_unit_price integer NOT NULL CHECK (reference_unit_price >= 0),
  reference_crate_price integer NOT NULL CHECK (reference_crate_price >= 0),
  reference_consign_price integer NOT NULL CHECK (reference_consign_price >= 0),
  
  -- Métadonnées
  effective_from timestamptz DEFAULT now(),
  effective_to timestamptz,
  is_active boolean DEFAULT true,
  
  -- Audit
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contrainte: une seule référence active par produit/zone
  CONSTRAINT unique_active_reference_price 
    UNIQUE (product_id, zone_id, is_active)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_reference_prices_product ON reference_prices(product_id);
CREATE INDEX idx_reference_prices_zone ON reference_prices(zone_id);
CREATE INDEX idx_reference_prices_active ON reference_prices(is_active);
CREATE INDEX idx_reference_prices_effective ON reference_prices(effective_from, effective_to);

-- ============================================================================
-- 4. SUPPLIER_PRICE_GRIDS - Grilles tarifaires fournisseur
-- ============================================================================
CREATE TABLE IF NOT EXISTS supplier_price_grids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES zones(id) ON DELETE CASCADE,
  
  -- Prix fournisseur
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  crate_price integer NOT NULL CHECK (crate_price >= 0),
  consign_price integer NOT NULL CHECK (consign_price >= 0),
  
  -- Conditions commerciales
  minimum_order_quantity integer DEFAULT 1,
  maximum_order_quantity integer,
  discount_percentage numeric(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  
  -- Métadonnées
  effective_from timestamptz DEFAULT now(),
  effective_to timestamptz,
  is_active boolean DEFAULT true,
  notes text,
  
  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Contrainte: une seule grille active par fournisseur/produit/zone
  CONSTRAINT unique_active_supplier_grid 
    UNIQUE (supplier_id, product_id, zone_id, is_active)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_supplier_price_grids_supplier ON supplier_price_grids(supplier_id);
CREATE INDEX idx_supplier_price_grids_product ON supplier_price_grids(product_id);
CREATE INDEX idx_supplier_price_grids_zone ON supplier_price_grids(zone_id);
CREATE INDEX idx_supplier_price_grids_active ON supplier_price_grids(is_active);
CREATE INDEX idx_supplier_price_grids_effective ON supplier_price_grids(effective_from, effective_to);

-- ============================================================================
-- 5. SUPPLIER_PRICE_GRID_HISTORY - Audit trail des modifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS supplier_price_grid_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_id uuid NOT NULL REFERENCES supplier_price_grids(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Anciens et nouveaux prix
  old_unit_price integer,
  new_unit_price integer,
  old_crate_price integer,
  new_crate_price integer,
  old_consign_price integer,
  new_consign_price integer,
  
  -- Métadonnées de changement
  change_type text NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted', 'activated', 'deactivated')),
  change_reason text,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now(),
  
  -- Snapshot complet pour audit
  grid_snapshot jsonb
);

-- Index pour l'historique
CREATE INDEX idx_supplier_price_grid_history_grid ON supplier_price_grid_history(grid_id);
CREATE INDEX idx_supplier_price_grid_history_supplier ON supplier_price_grid_history(supplier_id);
CREATE INDEX idx_supplier_price_grid_history_date ON supplier_price_grid_history(changed_at);

-- ============================================================================
-- 6. ORDER_PRICING_SNAPSHOT - Snapshot des prix lors de la commande
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_pricing_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Prix au moment de la commande
  reference_unit_price integer,
  reference_crate_price integer,
  reference_consign_price integer,
  
  -- Prix appliqués (fournisseur)
  applied_unit_price integer NOT NULL,
  applied_crate_price integer NOT NULL,
  applied_consign_price integer NOT NULL,
  
  -- Variance par rapport au référence
  variance_percentage numeric(5,2),
  
  -- Source du prix
  price_source text CHECK (price_source IN ('reference', 'supplier_grid', 'negotiated', 'manual')),
  supplier_grid_id uuid REFERENCES supplier_price_grids(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now(),
  
  -- Contrainte: un seul snapshot par commande/produit
  CONSTRAINT unique_order_product_snapshot UNIQUE (order_id, product_id)
);

-- Index pour les requêtes
CREATE INDEX idx_order_pricing_snapshot_order ON order_pricing_snapshot(order_id);
CREATE INDEX idx_order_pricing_snapshot_product ON order_pricing_snapshot(product_id);

-- ============================================================================
-- 7. PRICE_ANALYTICS - Statistiques & market intelligence
-- ============================================================================
CREATE TABLE IF NOT EXISTS price_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES zones(id) ON DELETE CASCADE,
  
  -- Période d'analyse
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  -- Statistiques des prix
  reference_price_avg integer,
  supplier_price_min integer,
  supplier_price_max integer,
  supplier_price_avg integer,
  supplier_price_median integer,
  
  -- Statistiques de variance
  avg_variance_percentage numeric(5,2),
  max_variance_percentage numeric(5,2),
  
  -- Statistiques de volume
  total_orders integer DEFAULT 0,
  total_quantity integer DEFAULT 0,
  total_suppliers integer DEFAULT 0,
  
  -- Métadonnées
  calculated_at timestamptz DEFAULT now(),
  is_current boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now()
);

-- Index pour les analytics
CREATE INDEX idx_price_analytics_product ON price_analytics(product_id);
CREATE INDEX idx_price_analytics_zone ON price_analytics(zone_id);
CREATE INDEX idx_price_analytics_period ON price_analytics(period_start, period_end);
CREATE INDEX idx_price_analytics_current ON price_analytics(is_current);

-- ============================================================================
-- TRIGGERS - Mise à jour automatique des timestamps
-- ============================================================================

-- Trigger pour pricing_categories
CREATE OR REPLACE FUNCTION update_pricing_categories_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_pricing_categories_updated_at
  BEFORE UPDATE ON pricing_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_categories_updated_at();

-- Trigger pour reference_prices
CREATE OR REPLACE FUNCTION update_reference_prices_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_reference_prices_updated_at
  BEFORE UPDATE ON reference_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_reference_prices_updated_at();

-- Trigger pour supplier_price_grids
CREATE OR REPLACE FUNCTION update_supplier_price_grids_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_supplier_price_grids_updated_at
  BEFORE UPDATE ON supplier_price_grids
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_price_grids_updated_at();

-- ============================================================================
-- TRIGGER - Historique automatique des modifications de grilles fournisseur
-- ============================================================================
CREATE OR REPLACE FUNCTION log_supplier_price_grid_changes()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO supplier_price_grid_history (
      grid_id, supplier_id, product_id,
      new_unit_price, new_crate_price, new_consign_price,
      change_type, changed_by, grid_snapshot
    ) VALUES (
      NEW.id, NEW.supplier_id, NEW.product_id,
      NEW.unit_price, NEW.crate_price, NEW.consign_price,
      'created', NEW.supplier_id, row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO supplier_price_grid_history (
      grid_id, supplier_id, product_id,
      old_unit_price, new_unit_price,
      old_crate_price, new_crate_price,
      old_consign_price, new_consign_price,
      change_type, changed_by, grid_snapshot
    ) VALUES (
      NEW.id, NEW.supplier_id, NEW.product_id,
      OLD.unit_price, NEW.unit_price,
      OLD.crate_price, NEW.crate_price,
      OLD.consign_price, NEW.consign_price,
      'updated', NEW.supplier_id, row_to_json(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO supplier_price_grid_history (
      grid_id, supplier_id, product_id,
      old_unit_price, old_crate_price, old_consign_price,
      change_type, changed_by, grid_snapshot
    ) VALUES (
      OLD.id, OLD.supplier_id, OLD.product_id,
      OLD.unit_price, OLD.crate_price, OLD.consign_price,
      'deleted', OLD.supplier_id, row_to_json(OLD)
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_supplier_price_grid_changes
  AFTER INSERT OR UPDATE OR DELETE ON supplier_price_grids
  FOR EACH ROW
  EXECUTE FUNCTION log_supplier_price_grid_changes();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE pricing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_price_grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_price_grid_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_pricing_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: pricing_categories
-- ============================================================================

-- Admin: accès complet
CREATE POLICY "Admin full access to pricing_categories"
  ON pricing_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Tous: lecture des catégories actives
CREATE POLICY "Read active pricing_categories"
  ON pricing_categories
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- POLICIES: reference_prices
-- ============================================================================

-- Admin: accès complet aux prix de référence
CREATE POLICY "Admin full access to reference_prices"
  ON reference_prices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Tous les utilisateurs authentifiés: lecture des prix de référence actifs
CREATE POLICY "Read active reference_prices"
  ON reference_prices
  FOR SELECT
  USING (
    is_active = true
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- POLICIES: supplier_price_grids
-- ============================================================================

-- Fournisseur: accès complet à SES propres grilles
CREATE POLICY "Supplier full access to own price_grids"
  ON supplier_price_grids
  FOR ALL
  USING (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
    )
  );

-- Admin: lecture de toutes les grilles
CREATE POLICY "Admin read all supplier_price_grids"
  ON supplier_price_grids
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Client: lecture des grilles actives pour voir les offres
CREATE POLICY "Client read active supplier_price_grids"
  ON supplier_price_grids
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'client'
    )
  );

-- ============================================================================
-- POLICIES: supplier_price_grid_history
-- ============================================================================

-- Fournisseur: lecture de SON propre historique
CREATE POLICY "Supplier read own price_grid_history"
  ON supplier_price_grid_history
  FOR SELECT
  USING (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
    )
  );

-- Admin: lecture de tout l'historique
CREATE POLICY "Admin read all price_grid_history"
  ON supplier_price_grid_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES: order_pricing_snapshot
-- ============================================================================

-- Admin: accès complet
CREATE POLICY "Admin full access to order_pricing_snapshot"
  ON order_pricing_snapshot
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Client/Fournisseur: lecture des snapshots de LEURS commandes
CREATE POLICY "User read own order_pricing_snapshot"
  ON order_pricing_snapshot
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_pricing_snapshot.order_id
      AND (orders.client_id = auth.uid() OR orders.supplier_id = auth.uid())
    )
  );

-- Système: insertion lors de la création de commande
CREATE POLICY "System insert order_pricing_snapshot"
  ON order_pricing_snapshot
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ============================================================================
-- POLICIES: price_analytics
-- ============================================================================

-- Admin: accès complet
CREATE POLICY "Admin full access to price_analytics"
  ON price_analytics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Fournisseur: lecture des analytics actuelles
CREATE POLICY "Supplier read current price_analytics"
  ON price_analytics
  FOR SELECT
  USING (
    is_current = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
    )
  );

-- ============================================================================
-- FONCTIONS HELPER
-- ============================================================================

-- Fonction pour obtenir le prix de référence d'un produit
CREATE OR REPLACE FUNCTION get_reference_price(
  p_product_id uuid,
  p_zone_id uuid DEFAULT NULL
)
RETURNS TABLE (
  unit_price integer,
  crate_price integer,
  consign_price integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.reference_unit_price,
    rp.reference_crate_price,
    rp.reference_consign_price
  FROM reference_prices rp
  WHERE rp.product_id = p_product_id
    AND (p_zone_id IS NULL OR rp.zone_id = p_zone_id)
    AND rp.is_active = true
    AND (rp.effective_to IS NULL OR rp.effective_to > now())
  ORDER BY rp.zone_id NULLS LAST, rp.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir la grille tarifaire d'un fournisseur
CREATE OR REPLACE FUNCTION get_supplier_price_grid(
  p_supplier_id uuid,
  p_product_id uuid,
  p_zone_id uuid DEFAULT NULL
)
RETURNS TABLE (
  unit_price integer,
  crate_price integer,
  consign_price integer,
  discount_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    spg.unit_price,
    spg.crate_price,
    spg.consign_price,
    spg.discount_percentage
  FROM supplier_price_grids spg
  WHERE spg.supplier_id = p_supplier_id
    AND spg.product_id = p_product_id
    AND (p_zone_id IS NULL OR spg.zone_id = p_zone_id)
    AND spg.is_active = true
    AND (spg.effective_to IS NULL OR spg.effective_to > now())
  ORDER BY spg.zone_id NULLS LAST, spg.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE pricing_categories IS 'Catégories de produits pour la tarification hiérarchique';
COMMENT ON TABLE reference_prices IS 'Prix de référence RAVITO gérés par les administrateurs';
COMMENT ON TABLE supplier_price_grids IS 'Grilles tarifaires personnalisées des fournisseurs';
COMMENT ON TABLE supplier_price_grid_history IS 'Historique complet des modifications de grilles tarifaires';
COMMENT ON TABLE order_pricing_snapshot IS 'Snapshot des prix appliqués lors de chaque commande';
COMMENT ON TABLE price_analytics IS 'Analytics et statistiques de marché pour l''intelligence tarifaire';
