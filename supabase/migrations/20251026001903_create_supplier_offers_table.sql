/*
  # Table supplier_offers

  1. Table
    - `supplier_offers` : Offres des fournisseurs
      - Fournisseurs peuvent modifier les quantités
      - Client voit les offres sans identité du fournisseur (avant paiement)
      - Une seule offre peut être acceptée par commande

  2. Sécurité
    - RLS avec masquage des identités
    - Politiques pour création, lecture et mise à jour
*/

-- Créer le type pour le statut des offres
DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table des offres fournisseurs
CREATE TABLE IF NOT EXISTS supplier_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status offer_status NOT NULL DEFAULT 'pending',
  modified_items jsonb NOT NULL,
  total_amount integer NOT NULL,
  consigne_total integer DEFAULT 0,
  supplier_commission integer DEFAULT 0,
  net_supplier_amount integer NOT NULL,
  supplier_message text,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  rejected_at timestamptz,
  UNIQUE(order_id, supplier_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_supplier_offers_order_id ON supplier_offers(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_offers_supplier_id ON supplier_offers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_offers_status ON supplier_offers(status);

-- RLS sur supplier_offers
ALTER TABLE supplier_offers ENABLE ROW LEVEL SECURITY;

-- Fournisseurs peuvent créer des offres pour les commandes de leur zone
CREATE POLICY "Suppliers can create offers for zone orders"
  ON supplier_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'supplier'
        AND profiles.is_approved = true
    )
    AND supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders
      JOIN supplier_zones sz ON sz.zone_id = orders.zone_id
      WHERE orders.id = supplier_offers.order_id
        AND sz.supplier_id = auth.uid()
        AND orders.status = 'pending-offers'
    )
  );

-- Fournisseurs peuvent voir leurs propres offres
CREATE POLICY "Suppliers can view own offers"
  ON supplier_offers
  FOR SELECT
  TO authenticated
  USING (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'supplier'
        AND profiles.is_approved = true
    )
  );

-- Clients peuvent voir les offres pour leurs commandes (identité masquée)
CREATE POLICY "Clients can view offers for their orders"
  ON supplier_offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = supplier_offers.order_id
        AND orders.client_id = auth.uid()
        AND orders.status IN ('offers-received', 'awaiting-payment', 'paid', 'preparing', 'delivering', 'delivered', 'awaiting-rating')
    )
  );

-- Clients peuvent mettre à jour le statut des offres (accepter/refuser)
CREATE POLICY "Clients can update offer status"
  ON supplier_offers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = supplier_offers.order_id
        AND orders.client_id = auth.uid()
        AND orders.status = 'offers-received'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = supplier_offers.order_id
        AND orders.client_id = auth.uid()
    )
  );

-- Admins peuvent tout voir et modifier
CREATE POLICY "Admins can manage all offers"
  ON supplier_offers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Fonction pour vérifier si un utilisateur a des évaluations en attente
CREATE OR REPLACE FUNCTION has_pending_ratings(user_id uuid)
RETURNS boolean AS $$
DECLARE
  has_pending boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.status = 'awaiting-rating'
      AND (
        (o.client_id = user_id AND NOT EXISTS (
          SELECT 1 FROM ratings r WHERE r.order_id = o.id AND r.from_user_id = user_id
        ))
        OR
        (o.supplier_id = user_id AND NOT EXISTS (
          SELECT 1 FROM ratings r WHERE r.order_id = o.id AND r.from_user_id = user_id
        ))
      )
  ) INTO has_pending;
  
  RETURN has_pending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;