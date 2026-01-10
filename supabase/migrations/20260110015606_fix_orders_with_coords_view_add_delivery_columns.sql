/*
  # Recréer la vue orders_with_coords avec toutes les colonnes
  
  1. Changements
    - Supprimer et recréer la vue orders_with_coords
    - Inclut assigned_delivery_user_id et autres colonnes de livraison
  
  2. Raison
    - La vue a été créée avant l'ajout des colonnes de livraison
    - Les vues PostgreSQL figent les colonnes au moment de leur création
    - Il faut la recréer pour voir les nouvelles colonnes
*/

-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS orders_with_coords;

-- Recréer la vue avec toutes les colonnes actuelles
CREATE VIEW orders_with_coords AS
SELECT 
  orders.*,
  ST_Y(coordinates::geometry) as lat,
  ST_X(coordinates::geometry) as lng
FROM orders;
