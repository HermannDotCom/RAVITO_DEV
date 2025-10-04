-- ========================================
-- DISTRI-NIGHT - CRÉATION DES COMPTES DE TEST
-- ========================================
-- Ce script crée 7 comptes de test:
-- - 1 Admin
-- - 3 Clients
-- - 3 Suppliers
-- ========================================
-- INSTRUCTIONS:
-- 1. Ouvrir Supabase Dashboard
-- 2. Aller dans SQL Editor
-- 3. Copier-coller ce script COMPLET
-- 4. Cliquer sur "Run"
-- 5. Vérifier les messages de succès
-- ========================================

-- 1. ADMIN ACCOUNT
DO $$
DECLARE
  admin_user_id uuid := gen_random_uuid();
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    confirmation_token,
    email_change_token_current,
    email_change_token_new
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@distri-night.ci',
    crypt('Admin@2025!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Kouassi Administrateur","role":"admin"}'::jsonb,
    'authenticated',
    'authenticated',
    '',
    '',
    ''
  );

  -- Create profile
  INSERT INTO profiles (
    id,
    role,
    name,
    phone,
    address,
    coordinates,
    is_active,
    is_approved,
    approval_status,
    approved_at
  ) VALUES (
    admin_user_id,
    'admin',
    'Kouassi Administrateur',
    '+225 07 00 00 00 01',
    'Siège DISTRI-NIGHT, Plateau, Abidjan',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    true,
    true,
    'approved',
    now()
  )
  

  RAISE NOTICE '✅ Admin créé: admin@distri-night.ci / Admin@2025!';
END $$;

-- 2. CLIENT 1 - Maquis Chez Fatou
DO $$
DECLARE
  client1_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role, confirmation_token, email_change_token_current, email_change_token_new
  ) VALUES (
    client1_user_id, '00000000-0000-0000-0000-000000000000',
    'client1@test.ci', crypt('Client@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Jean-Marc Yao","role":"client"}'::jsonb,
    'authenticated', 'authenticated', '', '', ''
  )
  

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    client1_user_id, 'client', 'Jean-Marc Yao', '+225 07 11 22 33 44',
    'Maquis Chez Fatou, Cocody Riviera',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Maquis Chez Fatou', '18:00 - 06:00', 'Jean-Marc Yao',
    true, true, 'approved', now()
  )
  

  RAISE NOTICE '✅ Client 1 créé: client1@test.ci / Client@2025!';
END $$;

-- 3. CLIENT 2 - Le Griot d'Or
DO $$
DECLARE
  client2_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role, confirmation_token, email_change_token_current, email_change_token_new
  ) VALUES (
    client2_user_id, '00000000-0000-0000-0000-000000000000',
    'client2@test.ci', crypt('Client@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Adjoua Marie","role":"client"}'::jsonb,
    'authenticated', 'authenticated', '', '', ''
  )
  

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    client2_user_id, 'client', 'Adjoua Marie', '+225 07 22 33 44 55',
    'Bar Le Griot d''Or, Marcory Zone 4',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Le Griot d''Or', '17:00 - 03:00', 'Adjoua Marie',
    true, true, 'approved', now()
  )
  

  RAISE NOTICE '✅ Client 2 créé: client2@test.ci / Client@2025!';
END $$;

-- 4. CLIENT 3 - Restaurant La Terrasse
DO $$
DECLARE
  client3_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role, confirmation_token, email_change_token_current, email_change_token_new
  ) VALUES (
    client3_user_id, '00000000-0000-0000-0000-000000000000',
    'client3@test.ci', crypt('Client@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Koffi Patrick","role":"client"}'::jsonb,
    'authenticated', 'authenticated', '', '', ''
  )
  

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    client3_user_id, 'client', 'Koffi Patrick', '+225 07 33 44 55 66',
    'Restaurant La Terrasse, Plateau',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Restaurant La Terrasse', '19:00 - 02:00', 'Koffi Patrick',
    true, true, 'approved', now()
  )
  

  RAISE NOTICE '✅ Client 3 créé: client3@test.ci / Client@2025!';
END $$;

-- 5. SUPPLIER 1 - Dépôt Traoré & Fils
DO $$
DECLARE
  supplier1_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role, confirmation_token, email_change_token_current, email_change_token_new
  ) VALUES (
    supplier1_user_id, '00000000-0000-0000-0000-000000000000',
    'supplier1@test.ci', crypt('Supplier@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Moussa Traoré","role":"supplier"}'::jsonb,
    'authenticated', 'authenticated', '', '', ''
  )
  

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    coverage_zone, delivery_capacity,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    supplier1_user_id, 'supplier', 'Moussa Traoré', '+225 07 44 55 66 77',
    'Dépôt du Plateau, Avenue Franchet d''Esperey',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Dépôt Traoré & Fils', '18:00 - 08:00', 'Moussa Traoré',
    'Plateau, Marcory, Treichville', 'truck',
    true, true, 'approved', now()
  )
  

  RAISE NOTICE '✅ Supplier 1 créé: supplier1@test.ci / Supplier@2025!';
END $$;

-- 6. SUPPLIER 2 - Dépôt Express Cocody
DO $$
DECLARE
  supplier2_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role, confirmation_token, email_change_token_current, email_change_token_new
  ) VALUES (
    supplier2_user_id, '00000000-0000-0000-0000-000000000000',
    'supplier2@test.ci', crypt('Supplier@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Ibrahim Koné","role":"supplier"}'::jsonb,
    'authenticated', 'authenticated', '', '', ''
  )
  

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    coverage_zone, delivery_capacity,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    supplier2_user_id, 'supplier', 'Ibrahim Koné', '+225 07 55 66 77 88',
    'Dépôt Cocody, Riviera Palmeraie',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Dépôt Express Cocody', '17:00 - 07:00', 'Ibrahim Koné',
    'Cocody, Angré, Riviera', 'tricycle',
    true, true, 'approved', now()
  )
  

  RAISE NOTICE '✅ Supplier 2 créé: supplier2@test.ci / Supplier@2025!';
END $$;

-- 7. SUPPLIER 3 - Dépôt Rapid'Yop
DO $$
DECLARE
  supplier3_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role, confirmation_token, email_change_token_current, email_change_token_new
  ) VALUES (
    supplier3_user_id, '00000000-0000-0000-0000-000000000000',
    'supplier3@test.ci', crypt('Supplier@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Sékou Diaby","role":"supplier"}'::jsonb,
    'authenticated', 'authenticated', '', '', ''
  )
  

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    coverage_zone, delivery_capacity,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    supplier3_user_id, 'supplier', 'Sékou Diaby', '+225 07 66 77 88 99',
    'Dépôt Yopougon, Sideci',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Dépôt Rapid''Yop', '18:00 - 06:00', 'Sékou Diaby',
    'Yopougon, Abobo, Adjamé', 'motorcycle',
    true, true, 'approved', now()
  )
  

  RAISE NOTICE '✅ Supplier 3 créé: supplier3@test.ci / Supplier@2025!';
END $$;

-- VÉRIFICATION FINALE
SELECT
  '🎉 SUCCÈS! Comptes créés: ' || COUNT(*) as message,
  string_agg(email, ', ' ORDER BY email) as emails
FROM auth.users
WHERE email LIKE '%@test.ci' OR email LIKE '%@distri-night.ci';

-- Afficher les détails des profils créés
SELECT
  p.role,
  p.name,
  p.business_name,
  p.phone,
  p.is_approved,
  p.approval_status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email LIKE '%@test.ci' OR u.email LIKE '%@distri-night.ci'
ORDER BY p.role, p.name;
