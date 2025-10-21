/*
  # Ajouter la politique de suppression pour les demandes d'inscription aux zones

  ## Description
  Permet aux fournisseurs de supprimer (annuler) leurs propres demandes d'inscription
  lorsque celles-ci sont en statut "pending".

  ## Modifications
  - Ajout d'une politique DELETE pour zone_registration_requests
*/

-- Policy to allow suppliers to delete their own pending requests
CREATE POLICY "Suppliers can delete own pending requests"
  ON zone_registration_requests FOR DELETE
  TO authenticated
  USING (
    supplier_id = auth.uid() AND
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
      AND profiles.approval_status = 'approved'
    )
  );
