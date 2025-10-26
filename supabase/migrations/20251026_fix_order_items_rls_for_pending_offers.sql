/*
  # Correction politique RLS order_items pour pending-offers

  1. Problème
    - Les fournisseurs ne peuvent pas voir les order_items des commandes pending-offers
    - La politique existante vérifie `orders.supplier_id = auth.uid()`
    - Mais les pending-offers n'ont PAS encore de supplier_id!

  2. Solution
    - Ajouter une politique permettant aux fournisseurs de voir les items des commandes
      dans leurs zones approuvées, même sans supplier_id assigné

  3. Sécurité
    - Vérifie que le fournisseur est approuvé
    - Vérifie que la zone est approuvée pour ce fournisseur
    - Limite aux commandes pending-offers et offers-received
*/

-- Supprimer l'ancienne politique fournisseur
DROP POLICY IF EXISTS "Suppliers can view order items of assigned orders" ON order_items;

-- Nouvelle politique: Fournisseurs voient items des commandes assignées OU dans leurs zones
CREATE POLICY "Suppliers can view order items of their zone orders"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders o
      JOIN profiles p ON p.id = auth.uid()
      WHERE o.id = order_items.order_id
        AND p.role = 'supplier'
        AND p.is_approved = true
        AND (
          -- Commande assignée au fournisseur
          o.supplier_id = auth.uid()
          OR
          -- Commande dans une zone approuvée du fournisseur (pending-offers, offers-received)
          (
            o.status IN ('pending-offers', 'offers-received')
            AND o.zone_id IN (
              SELECT sz.zone_id
              FROM supplier_zones sz
              WHERE sz.supplier_id = auth.uid()
                AND sz.approval_status = 'approved'
            )
          )
        )
    )
  );
