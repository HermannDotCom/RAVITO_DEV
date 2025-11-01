/*
  # Corriger la visibilité des commandes pending-offers pour les fournisseurs

  1. Problème
    - Les commandes sont créées avec le statut 'pending-offers'
    - Mais les politiques RLS vérifient seulement status = 'pending'
    - Les fournisseurs ne peuvent donc pas voir les nouvelles commandes

  2. Solution
    - Mettre à jour la politique de lecture pour inclure 'pending-offers'
    - Mettre à jour la politique d'acceptation pour inclure 'pending-offers'

  3. Sécurité
    - Maintenir les vérifications de zones approuvées
    - Maintenir les vérifications d'approbation fournisseur
*/

-- Supprimer l'ancienne politique de lecture
DROP POLICY IF EXISTS "Approved suppliers can view pending orders in their zones" ON orders;

-- Créer la nouvelle politique de lecture avec pending-offers
CREATE POLICY "Approved suppliers can view pending orders in their zones"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    status IN ('pending', 'pending-offers')
    AND supplier_id IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
      AND profiles.is_approved = true
    )
    AND EXISTS (
      SELECT 1 FROM supplier_zones
      WHERE supplier_zones.supplier_id = auth.uid()
      AND supplier_zones.zone_id = orders.zone_id
      AND supplier_zones.approval_status = 'approved'
      AND supplier_zones.is_active = true
    )
  );

-- Supprimer l'ancienne politique d'acceptation
DROP POLICY IF EXISTS "Approved suppliers can accept pending orders in their zones" ON orders;

-- Créer la nouvelle politique d'acceptation avec pending-offers
CREATE POLICY "Approved suppliers can accept pending orders in their zones"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    status IN ('pending', 'pending-offers')
    AND supplier_id IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
      AND profiles.is_approved = true
    )
    AND EXISTS (
      SELECT 1 FROM supplier_zones
      WHERE supplier_zones.supplier_id = auth.uid()
      AND supplier_zones.zone_id = orders.zone_id
      AND supplier_zones.approval_status = 'approved'
      AND supplier_zones.is_active = true
    )
  )
  WITH CHECK (
    supplier_id = auth.uid()
    AND status IN ('accepted', 'preparing', 'delivering')
  );

-- Ajouter un commentaire pour documentation
COMMENT ON POLICY "Approved suppliers can view pending orders in their zones" ON orders IS 'Permet aux fournisseurs approuvés de voir les commandes en attente d''offres dans leurs zones approuvées';