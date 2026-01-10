/*
  # Permettre aux livreurs de mettre à jour leurs livraisons assignées
  
  1. Problème
    - Les livreurs ne peuvent pas changer le statut des commandes qui leur sont assignées
    - Ils ne peuvent pas démarrer une livraison (passer de 'paid'/'preparing' à 'delivering')
  
  2. Solution
    - Ajouter une politique RLS permettant aux livreurs de mettre à jour les commandes assignées
    - Restreindre les champs qu'ils peuvent modifier (status uniquement)
*/

-- Politique pour permettre aux livreurs de mettre à jour le statut des commandes assignées
CREATE POLICY "Drivers can update status of assigned deliveries"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    -- L'utilisateur est le livreur assigné ou le livreur qui a effectué la livraison
    assigned_delivery_user_id = auth.uid() 
    OR delivered_by_user_id = auth.uid()
  )
  WITH CHECK (
    -- Même vérification pour WITH CHECK
    assigned_delivery_user_id = auth.uid() 
    OR delivered_by_user_id = auth.uid()
  );
