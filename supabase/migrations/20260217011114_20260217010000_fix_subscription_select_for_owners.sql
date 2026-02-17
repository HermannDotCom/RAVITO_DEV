/*
  # Correction de la politique SELECT pour les propriétaires d'organisations

  1. Problème Identifié
    - L'INSERT fonctionne (propriétaires peuvent créer des abonnements)
    - Mais le SELECT échoue immédiatement après car la politique SELECT ne vérifie que organization_members
    - Les propriétaires qui ne sont pas dans organization_members ne peuvent pas lire leurs propres abonnements
    - Erreur 403 sur: /rest/v1/subscriptions?select=*%2Csubscription_plans%28*%29

  2. Solution
    - Recréer la politique SELECT pour inclure les propriétaires d'organisations
    - Vérifier owner_id OU membership dans organization_members

  3. Sécurité
    - Les utilisateurs peuvent voir uniquement les abonnements de leur organisation
    - Propriétaires ET membres actifs peuvent voir les abonnements
*/

-- Supprimer l'ancienne politique SELECT
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;

-- Recréer la politique SELECT avec support des propriétaires
CREATE POLICY "subscriptions_select_own"
ON subscriptions
FOR SELECT
TO authenticated
USING (
  -- L'utilisateur est le propriétaire de l'organisation
  EXISTS (
    SELECT 1
    FROM organizations
    WHERE organizations.id = subscriptions.organization_id
    AND organizations.owner_id = auth.uid()
  )
  OR
  -- OU l'utilisateur est un membre de l'organisation (actif ou non pour la lecture)
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_members.organization_id = subscriptions.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Log de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration fix_subscription_select_for_owners appliquée';
  RAISE NOTICE 'Politique subscriptions_select_own recréée avec support propriétaires';
END $$;
