/*
  # Ajout de la gestion des stocks aux grilles fournisseur
  
  ## Modifications
  Ajoute les colonnes nécessaires pour le suivi des stocks et des quantités vendues
  dans la table supplier_price_grids pour permettre la gestion quotidienne des inventaires.
  
  ## Nouvelles colonnes
  - initial_stock: Stock initial saisi par le fournisseur
  - sold_quantity: Quantité vendue cumulée (mise à jour automatiquement)
  - last_reset_at: Date/heure de la dernière réinitialisation des quantités
*/

-- Ajouter les colonnes de gestion des stocks
ALTER TABLE supplier_price_grids
ADD COLUMN IF NOT EXISTS initial_stock integer DEFAULT 0 CHECK (initial_stock >= 0),
ADD COLUMN IF NOT EXISTS sold_quantity integer DEFAULT 0 CHECK (sold_quantity >= 0),
ADD COLUMN IF NOT EXISTS last_reset_at timestamptz DEFAULT now();

-- Index pour les requêtes sur le stock
CREATE INDEX IF NOT EXISTS idx_supplier_price_grids_stock ON supplier_price_grids(supplier_id, initial_stock, sold_quantity);

-- Commentaires
COMMENT ON COLUMN supplier_price_grids.initial_stock IS 'Stock initial saisi par le fournisseur au début du cycle';
COMMENT ON COLUMN supplier_price_grids.sold_quantity IS 'Quantité vendue cumulée depuis la dernière réinitialisation';
COMMENT ON COLUMN supplier_price_grids.last_reset_at IS 'Date et heure de la dernière réinitialisation des quantités vendues';

-- ============================================================================
-- FONCTION: Réinitialiser les quantités vendues pour un fournisseur
-- ============================================================================
CREATE OR REPLACE FUNCTION reset_supplier_sold_quantities(
  p_supplier_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE supplier_price_grids
  SET 
    sold_quantity = 0,
    last_reset_at = now()
  WHERE supplier_id = p_supplier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire sur la fonction
COMMENT ON FUNCTION reset_supplier_sold_quantities IS 'Réinitialise toutes les quantités vendues à zéro pour un fournisseur donné';

-- ============================================================================
-- FONCTION: Mettre à jour les quantités vendues lors d'une commande
-- ============================================================================
CREATE OR REPLACE FUNCTION update_sold_quantities_on_order()
RETURNS trigger AS $$
BEGIN
  -- Mettre à jour les quantités vendues pour chaque produit de la commande
  -- Uniquement pour les commandes livrées
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Incrémenter sold_quantity pour chaque produit dans order_items
    UPDATE supplier_price_grids spg
    SET sold_quantity = sold_quantity + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = spg.product_id
      AND spg.supplier_id = NEW.supplier_id
      AND spg.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table orders
DROP TRIGGER IF EXISTS trigger_update_sold_quantities ON orders;
CREATE TRIGGER trigger_update_sold_quantities
  AFTER INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.supplier_id IS NOT NULL)
  EXECUTE FUNCTION update_sold_quantities_on_order();

-- Commentaire sur le trigger
COMMENT ON FUNCTION update_sold_quantities_on_order IS 'Mise à jour automatique des quantités vendues lorsqu''une commande est livrée';
