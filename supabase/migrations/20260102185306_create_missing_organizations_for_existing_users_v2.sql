/*
  # Créer les organisations manquantes pour les utilisateurs existants

  1. Problème
    Plusieurs utilisateurs approuvés n'ont pas d'organisation, ce qui empêche
    l'affichage du menu Sidebar car useAllowedPages retourne un tableau vide
    
  2. Solution
    Créer automatiquement une organisation pour chaque utilisateur approuvé
    qui n'en a pas encore une
    
  3. Actions
    - Créer une organisation pour chaque utilisateur sans organisation
    - Le nom de l'organisation sera basé sur le nom de l'utilisateur
    - max_members par défaut: 5
*/

-- Créer les organisations manquantes pour tous les utilisateurs approuvés
INSERT INTO organizations (owner_id, name, type, max_members)
SELECT 
  p.id,
  CASE 
    WHEN p.role = 'client' THEN COALESCE(p.name, 'Mon Organisation') || ' (Client)'
    WHEN p.role = 'supplier' THEN COALESCE(p.name, 'Mon Dépôt')
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
ON CONFLICT (owner_id) DO NOTHING;
