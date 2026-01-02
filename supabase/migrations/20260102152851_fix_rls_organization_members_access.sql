/*
  # Correction RLS pour accès membres d'organisation

  1. Fonctions Helper
    - `get_user_org_owner_id()` - Retourne l'ID du propriétaire de l'organisation de l'utilisateur connecté
    - `user_has_org_access(target_user_id)` - Vérifie si l'utilisateur connecté peut accéder aux données d'un autre utilisateur
    
  2. Mise à jour des Policies RLS
    - Mise à jour des policies pour `orders` pour inclure les membres d'organisation
    - Mise à jour des policies pour `order_items` pour inclure les membres d'organisation
    - Mise à jour des policies pour `supplier_zones` pour inclure les membres d'organisation
    - Mise à jour des policies pour `supplier_offers` pour inclure les membres d'organisation
    
  3. Sécurité
    - Les fonctions sont SECURITY DEFINER avec search_path sécurisé
    - Les membres actifs uniquement ont accès
    - Le propriétaire et les membres voient les mêmes données

  Notes importantes:
    - Cette migration corrige le bug où les membres d'équipe ne voient pas les données de leur organisation
    - Les policies vérifient maintenant si l'utilisateur est soit le propriétaire, soit un membre actif
*/

-- =======================
-- ÉTAPE 1: FONCTIONS HELPER
-- =======================

-- Fonction pour obtenir l'ID du propriétaire de l'organisation de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_user_org_owner_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Vérifier si l'utilisateur est propriétaire d'une organisation
  SELECT owner_id INTO v_owner_id
  FROM organizations
  WHERE owner_id = auth.uid()
  LIMIT 1;
  
  IF v_owner_id IS NOT NULL THEN
    RETURN v_owner_id;
  END IF;
  
  -- Sinon, vérifier si l'utilisateur est membre d'une organisation
  SELECT o.owner_id INTO v_owner_id
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.user_id = auth.uid()
    AND om.status = 'active'
  LIMIT 1;
  
  IF v_owner_id IS NOT NULL THEN
    RETURN v_owner_id;
  END IF;
  
  -- Fallback: retourner l'ID de l'utilisateur
  RETURN auth.uid();
END;
$$;

-- Fonction pour vérifier si l'utilisateur connecté a accès aux données d'un autre utilisateur
CREATE OR REPLACE FUNCTION user_has_org_access(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_current_org_id uuid;
  v_target_org_id uuid;
BEGIN
  -- Si c'est le même utilisateur, accès autorisé
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Obtenir l'organisation de l'utilisateur connecté
  SELECT organization_id INTO v_current_org_id
  FROM organization_members
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;
  
  -- Si pas d'organisation, vérifier si l'utilisateur est propriétaire
  IF v_current_org_id IS NULL THEN
    SELECT id INTO v_current_org_id
    FROM organizations
    WHERE owner_id = auth.uid()
    LIMIT 1;
  END IF;
  
  -- Obtenir l'organisation de l'utilisateur cible
  SELECT organization_id INTO v_target_org_id
  FROM organization_members
  WHERE user_id = target_user_id AND status = 'active'
  LIMIT 1;
  
  -- Si pas d'organisation, vérifier si l'utilisateur cible est propriétaire
  IF v_target_org_id IS NULL THEN
    SELECT id INTO v_target_org_id
    FROM organizations
    WHERE owner_id = target_user_id
    LIMIT 1;
  END IF;
  
  -- Vérifier si les deux utilisateurs sont dans la même organisation
  RETURN v_current_org_id IS NOT NULL 
    AND v_target_org_id IS NOT NULL 
    AND v_current_org_id = v_target_org_id;
END;
$$;

-- =======================
-- ÉTAPE 2: MISE À JOUR DES POLICIES ORDERS
-- =======================

-- Drop et recréer les policies pour orders
DROP POLICY IF EXISTS "orders_select_client" ON orders;
DROP POLICY IF EXISTS "orders_select_supplier" ON orders;
DROP POLICY IF EXISTS "orders_update_client" ON orders;
DROP POLICY IF EXISTS "orders_update_supplier" ON orders;

-- Policy SELECT pour clients (owner ou membre)
CREATE POLICY "orders_select_client"
ON orders FOR SELECT
TO authenticated
USING (
  client_id = auth.uid() 
  OR user_has_org_access(client_id)
);

-- Policy SELECT pour suppliers (owner ou membre)
CREATE POLICY "orders_select_supplier"
ON orders FOR SELECT
TO authenticated
USING (
  supplier_id = auth.uid() 
  OR user_has_org_access(supplier_id)
);

-- Policy UPDATE pour clients (owner ou membre)
CREATE POLICY "orders_update_client"
ON orders FOR UPDATE
TO authenticated
USING (
  client_id = auth.uid() 
  OR user_has_org_access(client_id)
)
WITH CHECK (
  client_id = auth.uid() 
  OR user_has_org_access(client_id)
);

-- Policy UPDATE pour suppliers (owner ou membre)
CREATE POLICY "orders_update_supplier"
ON orders FOR UPDATE
TO authenticated
USING (
  supplier_id = auth.uid() 
  OR user_has_org_access(supplier_id)
)
WITH CHECK (
  supplier_id = auth.uid() 
  OR user_has_org_access(supplier_id)
);

-- =======================
-- ÉTAPE 3: MISE À JOUR DES POLICIES ORDER_ITEMS
-- =======================

-- Drop et recréer les policies pour order_items
DROP POLICY IF EXISTS "order_items_select_client" ON order_items;
DROP POLICY IF EXISTS "order_items_select_supplier_in_zone" ON order_items;

-- Policy SELECT pour clients (via orders)
CREATE POLICY "order_items_select_client"
ON order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (
      orders.client_id = auth.uid()
      OR user_has_org_access(orders.client_id)
    )
  )
);

-- Policy SELECT pour suppliers (via orders et zones)
CREATE POLICY "order_items_select_supplier_in_zone"
ON order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
    AND (
      -- Supplier assigné
      (
        o.supplier_id = auth.uid()
        OR user_has_org_access(o.supplier_id)
      )
      OR
      -- Supplier dans la zone pour commandes en attente d'offres
      (
        o.status IN ('pending-offers', 'offers-received')
        AND o.zone_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM supplier_zones sz
          WHERE sz.zone_id = o.zone_id
          AND (
            sz.supplier_id = auth.uid()
            OR user_has_org_access(sz.supplier_id)
          )
          AND sz.approval_status = 'approved'
          AND sz.is_active = true
        )
      )
    )
  )
);

-- =======================
-- ÉTAPE 4: MISE À JOUR DES POLICIES SUPPLIER_ZONES
-- =======================

-- Drop et recréer les policies pour supplier_zones
DROP POLICY IF EXISTS "supplier_zones_select" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_insert" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_update" ON supplier_zones;
DROP POLICY IF EXISTS "supplier_zones_delete" ON supplier_zones;

CREATE POLICY "supplier_zones_select"
ON supplier_zones FOR SELECT
TO authenticated
USING (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
  OR is_admin()
);

CREATE POLICY "supplier_zones_insert"
ON supplier_zones FOR INSERT
TO authenticated
WITH CHECK (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
);

CREATE POLICY "supplier_zones_update"
ON supplier_zones FOR UPDATE
TO authenticated
USING (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
  OR is_admin()
)
WITH CHECK (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
  OR is_admin()
);

CREATE POLICY "supplier_zones_delete"
ON supplier_zones FOR DELETE
TO authenticated
USING (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
  OR is_admin()
);

-- =======================
-- ÉTAPE 5: MISE À JOUR DES POLICIES SUPPLIER_OFFERS
-- =======================

-- Drop et recréer les policies pour supplier_offers
DROP POLICY IF EXISTS "supplier_offers_select_client" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_select_supplier" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_insert" ON supplier_offers;
DROP POLICY IF EXISTS "supplier_offers_update_supplier" ON supplier_offers;

CREATE POLICY "supplier_offers_select_client"
ON supplier_offers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = supplier_offers.order_id
    AND (
      orders.client_id = auth.uid()
      OR user_has_org_access(orders.client_id)
    )
  )
);

CREATE POLICY "supplier_offers_select_supplier"
ON supplier_offers FOR SELECT
TO authenticated
USING (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
);

CREATE POLICY "supplier_offers_insert"
ON supplier_offers FOR INSERT
TO authenticated
WITH CHECK (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
);

CREATE POLICY "supplier_offers_update_supplier"
ON supplier_offers FOR UPDATE
TO authenticated
USING (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
)
WITH CHECK (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
);

-- =======================
-- ÉTAPE 6: COMMENTAIRES
-- =======================

COMMENT ON FUNCTION get_user_org_owner_id() IS 'Retourne l''ID du propriétaire de l''organisation de l''utilisateur connecté, ou son propre ID s''il est propriétaire';
COMMENT ON FUNCTION user_has_org_access(uuid) IS 'Vérifie si l''utilisateur connecté a accès aux données d''un autre utilisateur via leur organisation commune';
