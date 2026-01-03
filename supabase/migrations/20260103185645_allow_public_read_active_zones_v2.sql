/*
  # Autoriser la lecture publique des zones actives
  
  1. Problème
    - Les utilisateurs non authentifiés ne peuvent pas voir les zones lors de l'inscription
    - La politique RLS actuelle requiert l'authentification
  
  2. Solution
    - Ajouter une politique SELECT pour le rôle 'anon' (utilisateurs publics)
    - Limiter l'accès aux zones actives uniquement
    - Ne concerne que la lecture, pas les modifications
  
  3. Sécurité
    - Lecture seule des zones actives
    - Aucun accès en écriture pour les utilisateurs non authentifiés
    - Les politiques admin restent inchangées
*/

-- Supprimer la politique si elle existe déjà
DROP POLICY IF EXISTS "zones_select_public_active" ON zones;

-- Créer la politique pour permettre aux utilisateurs non authentifiés (anon) de lire les zones actives
CREATE POLICY "zones_select_public_active"
  ON zones
  FOR SELECT
  TO anon
  USING (is_active = true);
