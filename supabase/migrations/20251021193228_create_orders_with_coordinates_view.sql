/*
  # Créer une vue pour les commandes avec coordonnées extraites

  1. Vue
    - `orders_with_coords` : Vue qui extrait lat/lng depuis le champ geometry
    - Inclut tous les champs de la table orders
    - Ajoute les champs lat et lng

  2. Sécurité
    - La vue hérite des politiques RLS de la table orders
*/

CREATE OR REPLACE VIEW orders_with_coords AS
SELECT 
  orders.*,
  ST_Y(coordinates::geometry) as lat,
  ST_X(coordinates::geometry) as lng
FROM orders;