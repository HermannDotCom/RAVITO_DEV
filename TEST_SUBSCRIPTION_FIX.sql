-- Test de Diagnostic pour les Abonnements
-- Exécuter ce script dans la console SQL de Supabase

-- 1. Vérifier l'utilisateur et son organisation
-- Remplacer USER_EMAIL par l'email de l'utilisateur qui teste
\set user_email 'julesguede@test.com'

-- Voir les informations de l'utilisateur
SELECT
  p.id as user_id,
  p.name,
  p.email,
  p.role,
  p.approval_status,
  o.id as organization_id,
  o.name as organization_name
FROM profiles p
LEFT JOIN organizations o ON o.owner_id = p.id
WHERE p.email = :'user_email';

-- 2. Vérifier les politiques RLS sur subscriptions
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'subscriptions'
ORDER BY cmd, policyname;

-- 3. Tester si l'utilisateur peut voir les plans
SELECT id, name, billing_cycle, price
FROM subscription_plans
WHERE is_active = true;

-- 4. Vérifier les abonnements existants pour cette organisation
-- Remplacer ORG_ID par l'ID de l'organisation
SELECT
  s.id,
  s.organization_id,
  s.status,
  s.trial_start_date,
  s.trial_end_date,
  sp.name as plan_name
FROM subscriptions s
LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.organization_id = (
  SELECT o.id
  FROM organizations o
  JOIN profiles p ON o.owner_id = p.id
  WHERE p.email = :'user_email'
);

-- 5. Test d'insertion (simulé)
-- NE PAS EXECUTER - Juste pour référence
/*
INSERT INTO subscriptions (
  organization_id,
  plan_id,
  status,
  is_first_subscription,
  trial_start_date,
  trial_end_date
)
SELECT
  o.id,
  (SELECT id FROM subscription_plans WHERE billing_cycle = 'monthly' LIMIT 1),
  'trial',
  true,
  now(),
  now() + interval '30 days'
FROM organizations o
JOIN profiles p ON o.owner_id = p.id
WHERE p.email = :'user_email'
RETURNING *;
*/
