/*
  # Ajouter admin@test.com comme membre de l'organisation Administration
  
  1. Objectif
    - Démontrer le système de gestion d'équipe administrative
    - Configurer admin@test.com avec des permissions limitées
    - Assigner uniquement les pages non-exclusives du super admin
  
  2. Actions
    - Ajouter admin@test.com comme membre actif de l'organisation Administration
    - Lui attribuer les pages: analytics, users, orders, products, pricing, treasury, zones, tickets
    - Exclure les pages super admin exclusives: team, roles, settings, commissions, data
  
  3. Sécurité
    - RLS déjà en place sur organization_members
    - Membre actif avec statut 'active'
*/

-- Ajouter admin@test.com comme membre de l'organisation Administration
DO $$
DECLARE
  v_admin_test_id uuid;
  v_org_admin_id uuid;
  v_existing_member_id uuid;
BEGIN
  -- Récupérer l'ID de admin@test.com
  SELECT id INTO v_admin_test_id
  FROM profiles
  WHERE email = 'admin@test.com'
  LIMIT 1;

  IF v_admin_test_id IS NULL THEN
    RAISE NOTICE 'Admin test account not found';
    RETURN;
  END IF;

  -- Récupérer l'ID de l'organisation Administration
  SELECT id INTO v_org_admin_id
  FROM organizations
  WHERE type = 'admin'
  LIMIT 1;

  IF v_org_admin_id IS NULL THEN
    RAISE EXCEPTION 'Organisation Administration not found';
  END IF;

  -- Vérifier si le membre existe déjà
  SELECT id INTO v_existing_member_id
  FROM organization_members
  WHERE user_id = v_admin_test_id AND organization_id = v_org_admin_id
  LIMIT 1;

  -- Créer le membre seulement s'il n'existe pas
  IF v_existing_member_id IS NULL THEN
    INSERT INTO organization_members (
      organization_id,
      user_id,
      email,
      role,
      status,
      is_active,
      allowed_pages,
      invited_at,
      accepted_at,
      created_at,
      updated_at
    ) VALUES (
      v_org_admin_id,
      v_admin_test_id,
      'admin@test.com',
      'administrator',
      'active',
      true,
      ARRAY['analytics', 'users', 'orders', 'products', 'pricing', 'treasury', 'zones', 'tickets'],
      now(),
      now(),
      now(),
      now()
    );
    
    RAISE NOTICE 'Admin test ajouté comme membre de l''organisation Administration';
  ELSE
    -- Mettre à jour les permissions si le membre existe déjà
    UPDATE organization_members
    SET 
      allowed_pages = ARRAY['analytics', 'users', 'orders', 'products', 'pricing', 'treasury', 'zones', 'tickets'],
      status = 'active',
      is_active = true,
      updated_at = now()
    WHERE id = v_existing_member_id;
    
    RAISE NOTICE 'Permissions de admin test mises à jour';
  END IF;
END $$;
