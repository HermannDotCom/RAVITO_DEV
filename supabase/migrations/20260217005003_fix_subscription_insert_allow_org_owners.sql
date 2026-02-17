/*
  # Correction de la politique INSERT pour les abonnements

  1. Problème
    - Erreur 403 lors de la création d'abonnements
    - La politique actuelle `subscriptions_insert_own` est trop restrictive ou mal configurée
    
  2. Solution
    - Supprimer et recréer la politique INSERT avec une logique simplifiée
    - Permettre aux propriétaires d'organisations de créer des abonnements
    - Permettre aussi aux membres actifs de créer des abonnements
    
  3. Sécurité
    - Vérifie que l'utilisateur est bien propriétaire de l'organisation
    - OU que l'utilisateur est un membre actif de l'organisation
*/

-- Supprimer l'ancienne politique INSERT
DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;

-- Recréer la politique INSERT avec une logique plus simple et des logs
CREATE POLICY "subscriptions_insert_own" 
ON subscriptions 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- L'utilisateur est le propriétaire de l'organisation
  EXISTS (
    SELECT 1 
    FROM organizations 
    WHERE organizations.id = subscriptions.organization_id
    AND organizations.owner_id = auth.uid()
  )
  OR
  -- OU l'utilisateur est un membre actif de l'organisation
  EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_members.organization_id = subscriptions.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
);

-- Ajouter une politique UPDATE pour permettre aux users de mettre à jour leur abonnement
DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions;

CREATE POLICY "subscriptions_update_own"
ON subscriptions
FOR UPDATE
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
  -- OU l'utilisateur est un membre actif de l'organisation  
  EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_members.organization_id = subscriptions.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
)
WITH CHECK (
  -- Même vérification pour WITH CHECK
  EXISTS (
    SELECT 1 
    FROM organizations 
    WHERE organizations.id = subscriptions.organization_id
    AND organizations.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE organization_members.organization_id = subscriptions.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
);

-- Log de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration fix_subscription_insert_allow_org_owners appliquée';
  RAISE NOTICE 'Politiques subscriptions_insert_own et subscriptions_update_own recréées';
END $$;
