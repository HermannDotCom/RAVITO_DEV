/*
  # Recréer orders_with_coords avec security_invoker et packaging_snapshot
  
  1. Problème
    - La vue orders_with_coords n'a pas security_invoker = true
    - Les politiques RLS de la table orders ne s'appliquent pas automatiquement
  
  2. Solution
    - Recréer la vue avec security_invoker = true
    - S'assurer que packaging_snapshot est inclus
*/

-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS orders_with_coords CASCADE;

-- Recréer avec security_invoker = true
CREATE VIEW orders_with_coords
WITH (security_invoker = true)
AS
SELECT
  o.*,
  CASE 
    WHEN o.delivery_latitude IS NOT NULL AND o.delivery_longitude IS NOT NULL THEN
      o.delivery_latitude::double precision
    ELSE NULL
  END AS lat,
  CASE 
    WHEN o.delivery_latitude IS NOT NULL AND o.delivery_longitude IS NOT NULL THEN
      o.delivery_longitude::double precision
    ELSE NULL
  END AS lng
FROM orders o;

COMMENT ON VIEW orders_with_coords IS 'Vue des commandes avec coordonnées géographiques et packaging_snapshot. Utilise security_invoker pour hériter des politiques RLS de la table orders.';
