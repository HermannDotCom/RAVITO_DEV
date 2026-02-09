/*
  # Fix: Ajouter les propriétaires comme membres de leurs organisations
  
  1. Problème identifié
    - Les organisations ont été créées avec un owner_id
    - Mais les propriétaires ne sont pas enregistrés dans organization_members
    - Cela empêche la création d'abonnements (erreur RLS)
  
  2. Solution
    - Insérer tous les propriétaires dans organization_members avec le rôle 'owner'
    - Statut 'active' par défaut
  
  3. Sécurité
    - Utilise IF NOT EXISTS pour éviter les doublons
*/

-- Ajouter les propriétaires comme membres actifs de leurs organisations
INSERT INTO organization_members (
  organization_id,
  user_id,
  email,
  role,
  status,
  invited_at,
  accepted_at,
  is_active,
  created_at,
  updated_at
)
SELECT 
  o.id as organization_id,
  o.owner_id as user_id,
  (SELECT email FROM auth.users WHERE id = o.owner_id) as email,
  'owner' as role,
  'active' as status,
  o.created_at as invited_at,
  o.created_at as accepted_at,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 
  FROM organization_members om 
  WHERE om.organization_id = o.id 
  AND om.user_id = o.owner_id
)
ON CONFLICT (organization_id, user_id) DO NOTHING;