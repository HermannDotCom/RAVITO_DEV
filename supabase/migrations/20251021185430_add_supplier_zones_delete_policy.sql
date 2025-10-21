/*
  # Ajouter la politique de suppression pour les demandes de zones

  1. Politique
    - Permet aux fournisseurs de supprimer leurs propres demandes en attente
    - Vérifie que le fournisseur est approuvé
    - Vérifie que la demande est en statut 'pending'
  
  2. Sécurité
    - Seul le propriétaire de la demande peut la supprimer
    - Seulement les demandes 'pending' peuvent être supprimées
*/

CREATE POLICY "Suppliers can delete own pending zone requests"
  ON supplier_zones
  FOR DELETE
  TO authenticated
  USING (
    supplier_id = auth.uid() 
    AND is_approved(auth.uid())
    AND approval_status = 'pending'
  );