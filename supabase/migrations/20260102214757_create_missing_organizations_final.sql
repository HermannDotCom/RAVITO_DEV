/*
  # Créer les organisations manquantes pour les utilisateurs existants
  
  1. Corrections
    - Crée automatiquement des organisations pour tous les utilisateurs approuvés sans organisation
    - Utilise business_name pour les fournisseurs, name pour les clients
    - Assure que tous les utilisateurs peuvent accéder à leur interface
*/

-- Créer les organisations manquantes
INSERT INTO organizations (owner_id, name, type, max_members)
SELECT 
  p.id,
  CASE 
    WHEN p.role = 'client' THEN COALESCE(p.name, 'Mon Organisation') || ' (Client)'
    WHEN p.role = 'supplier' THEN COALESCE(p.business_name, p.name, 'Mon Dépôt')
    WHEN p.role = 'admin' THEN COALESCE(p.name, 'Administration')
    ELSE p.name
  END as name,
  p.role::text as type,
  5 as max_members
FROM profiles p
LEFT JOIN organizations o ON o.owner_id = p.id
WHERE o.id IS NULL
  AND p.is_approved = true
  AND p.is_active = true
  AND p.role IN ('client', 'supplier')
ON CONFLICT (owner_id) DO NOTHING;
