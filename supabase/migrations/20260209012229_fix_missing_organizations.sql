/*
  # Rattrapage : Créer les organisations manquantes
  
  Ce script crée les organisations pour les utilisateurs qui n'en ont pas
  (inscrits pendant que l'Edge Function échouait).
*/

-- Créer les organisations manquantes pour les clients
INSERT INTO organizations (owner_id, name, type, max_members, created_at, updated_at)
SELECT 
  p.id as owner_id,
  COALESCE(NULLIF(p.business_name, ''), p.name || ' (Client)') as name,
  'client' as type,
  5 as max_members,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles p
WHERE p.role = 'client'
AND NOT EXISTS (
  SELECT 1 FROM organizations o WHERE o.owner_id = p.id
);

-- Créer les organisations manquantes pour les fournisseurs
INSERT INTO organizations (owner_id, name, type, max_members, created_at, updated_at)
SELECT 
  p.id as owner_id,
  COALESCE(NULLIF(p.business_name, ''), p.name) as name,
  'supplier' as type,
  5 as max_members,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles p
WHERE p.role = 'supplier'
AND NOT EXISTS (
  SELECT 1 FROM organizations o WHERE o.owner_id = p.id
);

-- Log du nombre d'organisations créées
DO $$
DECLARE
  client_count INTEGER;
  supplier_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO client_count FROM organizations WHERE type = 'client' AND created_at > NOW() - INTERVAL '1 minute';
  SELECT COUNT(*) INTO supplier_count FROM organizations WHERE type = 'supplier' AND created_at > NOW() - INTERVAL '1 minute';
  RAISE NOTICE 'Organisations créées - Clients: %, Fournisseurs: %', client_count, supplier_count;
END $$;
