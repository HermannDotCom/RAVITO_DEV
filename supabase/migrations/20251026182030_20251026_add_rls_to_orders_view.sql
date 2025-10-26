/*
  # Ajouter politiques RLS à la vue orders_with_coords

  1. Problème
    - Les vues PostgreSQL n'héritent PAS automatiquement des politiques RLS des tables
    - La vue orders_with_coords n'a pas de politiques RLS
    - Les fournisseurs ne peuvent pas lire depuis cette vue

  2. Solution
    - Activer RLS sur la vue orders_with_coords
    - Créer des politiques miroir de celles de la table orders

  3. Sécurité
    - Clients voient leurs propres commandes
    - Fournisseurs voient commandes de leurs zones approuvées
    - Admins voient tout
*/

-- Activer RLS sur la vue
ALTER VIEW orders_with_coords SET (security_invoker = true);

-- Alternative: Recréer la vue avec security_invoker
DROP VIEW IF EXISTS orders_with_coords;

CREATE VIEW orders_with_coords
WITH (security_invoker = true)
AS
SELECT
  orders.*,
  ST_Y(coordinates::geometry) as lat,
  ST_X(coordinates::geometry) as lng
FROM orders;