# 🔧 CRÉER LES COMPTES DE TEST - GUIDE SIMPLIFIÉ

## ⚠️ PROBLÈME IDENTIFIÉ

Le formulaire d'inscription actuel est complexe avec beaucoup de champs obligatoires. Voici **3 solutions simples** pour créer les comptes de test.

---

## ✅ SOLUTION 1 : Via Supabase SQL Editor (RECOMMANDÉE - 5 minutes)

### Étape 1 : Ouvrir Supabase Dashboard
1. Aller sur : https://0ec90b57d6e95fcbda19832f.supabase.co
2. Cliquer sur **SQL Editor** (icône </>)

### Étape 2 : Exécuter ce script SQL

Copier-coller et exécuter ce script :

```sql
-- ========================================
-- SCRIPT DE CRÉATION DES COMPTES DE TEST
-- ========================================

-- 1. ADMIN
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Créer l'utilisateur dans auth.users
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
    role
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@distri-night.ci',
    crypt('Admin@2025!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Kouassi Administrateur","role":"admin"}',
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO user_id;

  -- Créer le profil
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
    user_id,
    'admin',
    'Kouassi Administrateur',
    '+225 07 00 00 00 01',
    'Siège DISTRI-NIGHT, Plateau, Abidjan',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    true,
    true,
    'approved',
    now()
  );

  RAISE NOTICE 'Admin créé: admin@distri-night.ci';
END $$;

-- 2. CLIENT 1
DO $$
DECLARE
  user_id uuid;
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'client1@test.ci', crypt('Client@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}',
    '{"name":"Jean-Marc Yao","role":"client"}', 'authenticated', 'authenticated'
  ) RETURNING id INTO user_id;

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    user_id, 'client', 'Jean-Marc Yao', '+225 07 11 22 33 44',
    'Maquis Chez Fatou, Cocody Riviera',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Maquis Chez Fatou', '18:00 - 06:00', 'Jean-Marc Yao',
    true, true, 'approved', now()
  );

  RAISE NOTICE 'Client 1 créé: client1@test.ci';
END $$;

-- 3. CLIENT 2
DO $$
DECLARE
  user_id uuid;
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'client2@test.ci', crypt('Client@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}',
    '{"name":"Adjoua Marie","role":"client"}', 'authenticated', 'authenticated'
  ) RETURNING id INTO user_id;

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    user_id, 'client', 'Adjoua Marie', '+225 07 22 33 44 55',
    'Bar Le Griot d''Or, Marcory Zone 4',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Le Griot d''Or', '17:00 - 03:00', 'Adjoua Marie',
    true, true, 'approved', now()
  );

  RAISE NOTICE 'Client 2 créé: client2@test.ci';
END $$;

-- 4. CLIENT 3
DO $$
DECLARE
  user_id uuid;
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'client3@test.ci', crypt('Client@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}',
    '{"name":"Koffi Patrick","role":"client"}', 'authenticated', 'authenticated'
  ) RETURNING id INTO user_id;

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    user_id, 'client', 'Koffi Patrick', '+225 07 33 44 55 66',
    'Restaurant La Terrasse, Plateau',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Restaurant La Terrasse', '19:00 - 02:00', 'Koffi Patrick',
    true, true, 'approved', now()
  );

  RAISE NOTICE 'Client 3 créé: client3@test.ci';
END $$;

-- 5. SUPPLIER 1
DO $$
DECLARE
  user_id uuid;
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'supplier1@test.ci', crypt('Supplier@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}',
    '{"name":"Moussa Traoré","role":"supplier"}', 'authenticated', 'authenticated'
  ) RETURNING id INTO user_id;

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    coverage_zone, delivery_capacity,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    user_id, 'supplier', 'Moussa Traoré', '+225 07 44 55 66 77',
    'Dépôt du Plateau, Avenue Franchet d''Esperey',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Dépôt Traoré & Fils', '18:00 - 08:00', 'Moussa Traoré',
    'Plateau, Marcory, Treichville', 'truck',
    true, true, 'approved', now()
  );

  RAISE NOTICE 'Supplier 1 créé: supplier1@test.ci';
END $$;

-- 6. SUPPLIER 2
DO $$
DECLARE
  user_id uuid;
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'supplier2@test.ci', crypt('Supplier@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}',
    '{"name":"Ibrahim Koné","role":"supplier"}', 'authenticated', 'authenticated'
  ) RETURNING id INTO user_id;

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    coverage_zone, delivery_capacity,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    user_id, 'supplier', 'Ibrahim Koné', '+225 07 55 66 77 88',
    'Dépôt Cocody, Riviera Palmeraie',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Dépôt Express Cocody', '17:00 - 07:00', 'Ibrahim Koné',
    'Cocody, Angré, Riviera', 'tricycle',
    true, true, 'approved', now()
  );

  RAISE NOTICE 'Supplier 2 créé: supplier2@test.ci';
END $$;

-- 7. SUPPLIER 3
DO $$
DECLARE
  user_id uuid;
BEGIN
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    aud, role
  ) VALUES (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
    'supplier3@test.ci', crypt('Supplier@2025!', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}',
    '{"name":"Sékou Diaby","role":"supplier"}', 'authenticated', 'authenticated'
  ) RETURNING id INTO user_id;

  INSERT INTO profiles (
    id, role, name, phone, address, coordinates,
    business_name, business_hours, responsible_person,
    coverage_zone, delivery_capacity,
    is_active, is_approved, approval_status, approved_at
  ) VALUES (
    user_id, 'supplier', 'Sékou Diaby', '+225 07 66 77 88 99',
    'Dépôt Yopougon, Sideci',
    ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
    'Dépôt Rapid''Yop', '18:00 - 06:00', 'Sékou Diaby',
    'Yopougon, Abobo, Adjamé', 'motorcycle',
    true, true, 'approved', now()
  );

  RAISE NOTICE 'Supplier 3 créé: supplier3@test.ci';
END $$;

-- Vérification
SELECT
  'Comptes créés: ' || COUNT(*) as message,
  string_agg(email, ', ') as emails
FROM auth.users
WHERE email LIKE '%@test.ci' OR email LIKE '%@distri-night.ci';
```

### Étape 3 : Vérifier
Vous devriez voir le message : "Comptes créés: 7"

---

## ✅ SOLUTION 2 : Via l'Interface Web (Version Simplifiée)

Si vous préférez utiliser l'interface, voici la **version minimale** à remplir :

### Champs OBLIGATOIRES UNIQUEMENT :

1. **Type de compte** : Client ou Fournisseur
2. **Email** : (voir CREDENTIALS.txt)
3. **Téléphone** : +225 07 XX XX XX XX
4. **Mot de passe** : (voir CREDENTIALS.txt)
5. **Confirmer mot de passe** : (même que ci-dessus)
6. **Nom du commerce** : Ex: Maquis Chez Fatou
7. **Responsable** : Ex: Jean-Marc Yao
8. **Adresse** : Ex: Cocody Riviera
9. **Horaires** : Ex: 18:00 - 06:00
10. **Au moins 1 moyen de paiement** : Cocher "Orange Money"

**Pour les suppliers**, ajouter :
- **Zone de couverture** : Ex: Plateau, Marcory
- **Au moins 1 produit** : Cocher "Solibra"
- **Capacité** : Choisir Moto/Tricycle/Camion

---

## ✅ SOLUTION 3 : Via Supabase Auth UI

### Étape 1 : Dashboard Supabase
1. Aller sur : https://0ec90b57d6e95fcbda19832f.supabase.co
2. Cliquer sur **Authentication** > **Users**
3. Cliquer **Add User** > **Create new user**

### Étape 2 : Pour chaque compte
```
Email: admin@distri-night.ci
Password: Admin@2025!
✅ Auto Confirm User
```

### Étape 3 : Créer le profil manuellement

Une fois l'utilisateur créé, noter son UUID, puis aller dans **SQL Editor** et exécuter :

```sql
INSERT INTO profiles (
  id,
  role,
  name,
  phone,
  address,
  coordinates,
  is_active,
  is_approved,
  approval_status
) VALUES (
  'UUID_FROM_AUTH_USER',
  'admin',
  'Kouassi Administrateur',
  '+225 07 00 00 00 01',
  'Plateau, Abidjan',
  ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
  true,
  true,
  'approved'
);
```

Répéter pour chaque utilisateur (voir CREDENTIALS.txt pour les infos).

---

## 🎯 APRÈS CRÉATION DES COMPTES

### Test de Connexion :

1. Lancer l'app : `npm run dev`
2. Ouvrir : http://localhost:5173
3. Essayer de se connecter avec :
   - Email: `admin@distri-night.ci`
   - Password: `Admin@2025!`

Si ça marche, **TOUS LES COMPTES SONT PRÊTS !** 🎉

---

## 📊 RÉCAPITULATIF DES IDENTIFIANTS

| Type | Email | Mot de passe | Nom |
|------|-------|--------------|-----|
| Admin | admin@distri-night.ci | Admin@2025! | Kouassi Administrateur |
| Client | client1@test.ci | Client@2025! | Jean-Marc Yao |
| Client | client2@test.ci | Client@2025! | Adjoua Marie |
| Client | client3@test.ci | Client@2025! | Koffi Patrick |
| Supplier | supplier1@test.ci | Supplier@2025! | Moussa Traoré |
| Supplier | supplier2@test.ci | Supplier@2025! | Ibrahim Koné |
| Supplier | supplier3@test.ci | Supplier@2025! | Sékou Diaby |

---

## ❓ QUESTIONS FRÉQUENTES

**Q: Le script SQL ne fonctionne pas ?**
R: Vérifiez que vous êtes bien dans le SQL Editor de Supabase et que vous avez les droits admin.

**Q: "User already exists" ?**
R: Les comptes existent déjà ! Essayez de vous connecter directement.

**Q: L'inscription web demande trop de champs ?**
R: Utilisez la Solution 1 (SQL) qui est la plus rapide et simple.

**Q: Je ne vois pas les comptes créés ?**
R: Aller dans Authentication > Users dans Supabase Dashboard.

---

**Recommandation : Utiliser la SOLUTION 1 (SQL) - C'est la plus rapide ! ⚡**
