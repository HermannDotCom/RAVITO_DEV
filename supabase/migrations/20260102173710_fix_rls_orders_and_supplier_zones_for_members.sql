/*
  # Correction des policies RLS pour les commandes et zones fournisseurs

  1. Problème
    Les membres d'organisation ne peuvent pas voir les commandes disponibles dans leurs zones
    car plusieurs policies n'ont pas été mises à jour pour utiliser user_has_org_access()
    
  2. Tables corrigées
    - orders: Correction de orders_select_supplier_zone
    - order_items: Correction de order_items_select_supplier_zone
    - supplier_offers: Correction de supplier_offers_delete
    - supplier_zones: Nettoyage des policies dupliquées et suppression de la policy dangereuse
    
  3. Objectif
    Les membres doivent pouvoir voir les mêmes commandes disponibles que le propriétaire
*/

-- ============================================
-- ORDERS: Correction policy pour commandes disponibles
-- ============================================

DROP POLICY IF EXISTS "orders_select_supplier_zone" ON orders;

CREATE POLICY "orders_select_supplier_zone"
ON orders FOR SELECT
TO authenticated
USING (
  status IN ('pending-offers', 'offers-received')
  AND zone_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM supplier_zones sz
    WHERE sz.zone_id = orders.zone_id
    AND (
      sz.supplier_id = auth.uid()
      OR user_has_org_access(sz.supplier_id)
    )
    AND sz.approval_status = 'approved'
    AND sz.is_active = true
  )
);

-- ============================================
-- ORDER_ITEMS: Correction policy pour items des commandes disponibles
-- ============================================

DROP POLICY IF EXISTS "order_items_select_supplier_zone" ON order_items;

CREATE POLICY "order_items_select_supplier_zone"
ON order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN supplier_zones sz ON sz.zone_id = o.zone_id
    WHERE o.id = order_items.order_id
    AND o.status IN ('pending-offers', 'offers-received')
    AND o.zone_id IS NOT NULL
    AND (
      sz.supplier_id = auth.uid()
      OR user_has_org_access(sz.supplier_id)
    )
    AND sz.approval_status = 'approved'
    AND sz.is_active = true
  )
);

-- ============================================
-- SUPPLIER_OFFERS: Correction policy delete
-- ============================================

DROP POLICY IF EXISTS "supplier_offers_delete" ON supplier_offers;

CREATE POLICY "supplier_offers_delete"
ON supplier_offers FOR DELETE
TO authenticated
USING (
  (
    supplier_id = auth.uid()
    OR user_has_org_access(supplier_id)
  )
  AND status != 'accepted'
);

-- ============================================
-- SUPPLIER_ZONES: Nettoyage des policies dupliquées
-- ============================================

-- Supprimer les anciennes policies dupliquées
DROP POLICY IF EXISTS "supplier_zones_select_own" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_select_admin" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_insert_own" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_update_own" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_delete_own" ON supplier_zones;

-- DANGER: Supprimer la policy qui permet à tout le monde de voir toutes les zones
DROP POLICY IF EXISTS "supplier_zones_select_all" ON supplier_zones;

-- Les bonnes policies sont déjà en place:
-- supplier_zones_select, supplier_zones_insert, supplier_zones_update, supplier_zones_delete

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON POLICY "orders_select_supplier_zone" ON orders IS 
'Les fournisseurs (propriétaires et membres) peuvent voir les commandes disponibles dans leurs zones approuvées';

COMMENT ON POLICY "order_items_select_supplier_zone" ON order_items IS 
'Les fournisseurs (propriétaires et membres) peuvent voir les items des commandes disponibles dans leurs zones';

COMMENT ON POLICY "supplier_offers_delete" ON supplier_offers IS 
'Les fournisseurs (propriétaires et membres) peuvent supprimer leurs propres offres non acceptées';
