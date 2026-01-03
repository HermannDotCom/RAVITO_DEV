/*
  # Création de l'Organisation Administration
  
  1. Objectif
    - Créer une organisation "Administration" pour le super admin
    - Permettre la gestion d'une équipe d'admins secondaires
    - Activer la fonctionnalité "Mon Équipe" pour les admins
  
  2. Actions
    - Créer l'organisation "Administration" si elle n'existe pas
    - Assigner Hermann (hnguessan@hotmail.com) comme propriétaire
    - Configuration pour max 40 membres (équipe administrative)
  
  3. Sécurité
    - RLS déjà en place sur la table organizations
    - Pas de modification des politiques existantes
*/

-- Créer l'organisation Administration pour le super admin
DO $$
DECLARE
  v_hermann_id uuid;
  v_existing_org_id uuid;
BEGIN
  -- Récupérer l'ID de Hermann
  SELECT id INTO v_hermann_id
  FROM profiles
  WHERE email = 'hnguessan@hotmail.com'
  LIMIT 1;

  IF v_hermann_id IS NULL THEN
    RAISE EXCEPTION 'Super admin Hermann not found';
  END IF;

  -- Vérifier si une organisation admin existe déjà pour Hermann
  SELECT id INTO v_existing_org_id
  FROM organizations
  WHERE owner_id = v_hermann_id AND type = 'admin'
  LIMIT 1;

  -- Créer l'organisation seulement si elle n'existe pas
  IF v_existing_org_id IS NULL THEN
    INSERT INTO organizations (
      name,
      type,
      owner_id,
      max_members,
      settings,
      created_at,
      updated_at
    ) VALUES (
      'Administration RAVITO',
      'admin',
      v_hermann_id,
      40,
      jsonb_build_object(
        'description', 'Organisation principale pour la gestion administrative de la plateforme RAVITO',
        'created_by', 'system_migration'
      ),
      now(),
      now()
    );
    
    RAISE NOTICE 'Organisation Administration créée avec succès pour Hermann';
  ELSE
    RAISE NOTICE 'Organisation admin existe déjà pour Hermann (ID: %)', v_existing_org_id;
  END IF;
END $$;
