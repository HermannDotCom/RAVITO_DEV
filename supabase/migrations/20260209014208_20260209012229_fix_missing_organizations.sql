/*
  # Rattrapage : Créer les organisations manquantes
  
  Ce script crée les organisations pour les utilisateurs qui n'en ont pas
  (inscrits pendant que l'Edge Function échouait).
*/

-- Créer les organisations manquantes pour les clients et compter
WITH inserted_clients AS (
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
  )
  RETURNING id
)
SELECT COUNT(*) AS client_count FROM inserted_clients;

-- Créer les organisations manquantes pour les fournisseurs et compter
WITH inserted_suppliers AS (
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
  )
  RETURNING id
)
SELECT COUNT(*) AS supplier_count FROM inserted_suppliers;