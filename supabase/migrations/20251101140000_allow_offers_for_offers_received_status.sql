/*
  # Autoriser les offres pour les commandes avec statut 'offers-received'

  1. Problème
    - La politique RLS n'autorise que les offres pour les commandes en 'pending-offers'
    - Après la première offre, le statut passe à 'offers-received'
    - Les autres fournisseurs ne peuvent plus envoyer d'offres

  2. Solution
    - Modifier la politique INSERT pour accepter aussi 'offers-received'
    - Permet à plusieurs fournisseurs de soumettre des offres

  3. Sécurité
    - Maintient toutes les autres vérifications
    - Fournisseur doit être approuvé
    - Commande doit être dans la zone du fournisseur
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Suppliers can create offers for zone orders" ON supplier_offers;

-- Create new policy allowing both pending-offers and offers-received
CREATE POLICY "Suppliers can create offers for zone orders"
  ON supplier_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be an approved supplier
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'supplier'
        AND profiles.is_approved = true
    )
    -- Supplier ID must match authenticated user
    AND supplier_id = auth.uid()
    -- Order must exist, be in pending-offers OR offers-received status, and be in supplier's zone
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
        AND orders.status IN ('pending-offers', 'offers-received')
        AND EXISTS (
          SELECT 1 FROM supplier_zones sz
          WHERE sz.zone_id = orders.zone_id
            AND sz.supplier_id = auth.uid()
        )
    )
  );
