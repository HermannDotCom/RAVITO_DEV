-- Ajouter le champ delivery_confirmation_code à la table orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmation_code VARCHAR(4);

-- Ajouter un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_orders_delivery_confirmation_code 
ON orders(delivery_confirmation_code);

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN orders.delivery_confirmation_code IS 'Code de confirmation à 4 chiffres généré quand la commande passe au statut "delivering" et utilisé pour confirmer la livraison';
