/*
  # Fix RLS policy for supplier_offers to allow multiple suppliers to submit offers
  
  1. Changes
    - Update INSERT policy to be less restrictive on approval_status
    - Add trigger to enforce single accepted offer per order at database level
  
  2. Security
    - Suppliers must be approved users
    - Suppliers must be active in the order's zone
    - Only one offer can be accepted per order (enforced by trigger)
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Suppliers can create offers for zone orders" ON supplier_offers;

-- Create new more permissive policy
CREATE POLICY "Suppliers can create offers for zone orders"
  ON supplier_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Le supplier_id doit correspondre à l'utilisateur connecté
    supplier_id = auth.uid()
    -- L'utilisateur doit être un fournisseur approuvé (dans profiles)
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'supplier'
        AND p.is_approved = true
    )
    -- La commande doit être dans un statut acceptant les offres
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND o.status IN ('pending-offers', 'offers-received')
    )
    -- Le fournisseur doit avoir une entrée active dans supplier_zones pour cette zone
    AND EXISTS (
      SELECT 1 FROM orders o
      JOIN supplier_zones sz ON sz.zone_id = o.zone_id
      WHERE o.id = order_id
        AND sz.supplier_id = auth.uid()
        AND COALESCE(sz.is_active, true) = true
    )
  );

-- Fonction pour garantir qu'une seule offre peut être acceptée par commande
CREATE OR REPLACE FUNCTION check_single_accepted_offer()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier seulement quand le statut passe à 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Vérifier s'il existe déjà une offre acceptée pour cette commande
    IF EXISTS (
      SELECT 1 FROM supplier_offers
      WHERE order_id = NEW.order_id
        AND status = 'accepted'
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Une seule offre peut être acceptée par commande. Cette commande a déjà une offre acceptée.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS enforce_single_accepted_offer ON supplier_offers;

-- Créer le trigger pour appliquer la contrainte
CREATE TRIGGER enforce_single_accepted_offer
  BEFORE INSERT OR UPDATE ON supplier_offers
  FOR EACH ROW
  EXECUTE FUNCTION check_single_accepted_offer();

-- Commentaire explicatif
COMMENT ON FUNCTION check_single_accepted_offer() IS 
  'Garantit qu une seule offre peut être acceptée par commande. Empêche les conditions de course.';
