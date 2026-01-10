/*
  # Permettre aux livreurs de voir les profils des clients
  
  1. Problème
    - Les livreurs ne peuvent pas voir les informations des clients
    - Erreur 406 "Cannot coerce the result to a single JSON object"
  
  2. Solution
    - Ajouter une politique RLS permettant aux livreurs de voir le profil des clients
    - Uniquement pour les commandes qui leur sont assignées
*/

-- Politique pour permettre aux livreurs de voir les clients de leurs livraisons
CREATE POLICY "Drivers can view clients of their assigned deliveries"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- L'utilisateur est un livreur qui a cette personne comme client dans une commande assignée
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.client_id = profiles.id
      AND o.assigned_delivery_user_id = auth.uid()
    )
  );
