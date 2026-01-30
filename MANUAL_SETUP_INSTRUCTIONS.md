# Étapes de Configuration Manuelle Post-Migration

## 1. Créer le Bucket Supabase Storage

⚠️ **IMPORTANT** : Cette étape doit être effectuée **AVANT** d'appliquer la migration `20260127235700_create_storefront_images_storage_policies.sql`

### Via Dashboard Supabase :

1. Connectez-vous au Dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet RAVITO_DEV
3. Allez dans **Storage** dans le menu latéral
4. Cliquez sur **"New bucket"**
5. Configurez le bucket :
   - **Name** : `storefront-images`
   - **Public bucket** : ✅ Coché (pour permettre l'affichage des images)
   - **File size limit** : 1 MB (optionnel, mais recommandé)
   - **Allowed MIME types** : `image/jpeg, image/png, image/webp` (optionnel)
6. Cliquez sur **"Create bucket"**

### Via Supabase CLI (Alternative) :

```bash
# Assurez-vous d'être dans le répertoire du projet
cd /home/runner/work/RAVITO_DEV/RAVITO_DEV

# Créer le bucket
supabase storage buckets create storefront-images --public
```

## 2. Appliquer les Migrations

Une fois le bucket créé, appliquez les migrations dans l'ordre :

```bash
# Migration 1 : Créer la table sales_representatives
supabase migration up --file 20260127235500_create_sales_representatives_table.sql

# Migration 2 : Ajouter les colonnes au profil
supabase migration up --file 20260127235600_add_storefront_columns_to_profiles.sql

# Migration 3 : Créer les policies du bucket
supabase migration up --file 20260127235700_create_storefront_images_storage_policies.sql
```

## 3. Vérifier les Policies du Bucket

Allez dans **Storage > Policies** et vérifiez que les 4 policies suivantes sont créées pour `storefront-images` :

1. ✅ **Public read access** : Permet à tous de voir les images
2. ✅ **Authenticated users can upload** : Permet aux utilisateurs authentifiés d'uploader
3. ✅ **Users can update their own** : Permet aux utilisateurs de modifier leurs propres images
4. ✅ **Users can delete their own** : Permet aux utilisateurs de supprimer leurs propres images

## 4. Ajouter des Commerciaux (Données de Test)

Pour tester le sélecteur de commerciaux dans l'inscription, ajoutez quelques commerciaux de test :

```sql
-- Via SQL Editor dans Supabase Dashboard
INSERT INTO sales_representatives (name, phone, email, is_active) VALUES
  ('Kouamé Jean', '07 12 34 56 78', 'kouame.jean@ravito.ci', true),
  ('Diallo Mamadou', '07 23 45 67 89', 'diallo.mamadou@ravito.ci', true),
  ('Traoré Issa', '07 34 56 78 90', 'traore.issa@ravito.ci', true);
```

Si vous avez des zones définies, vous pouvez aussi les associer :

```sql
-- Exemple : Associer les commerciaux à des zones
UPDATE sales_representatives 
SET zone_id = (SELECT id FROM zones WHERE name = 'Port-Bouët' LIMIT 1)
WHERE name = 'Kouamé Jean';

UPDATE sales_representatives 
SET zone_id = (SELECT id FROM zones WHERE name = 'Koumassi' LIMIT 1)
WHERE name = 'Diallo Mamadou';

UPDATE sales_representatives 
SET zone_id = (SELECT id FROM zones WHERE name = 'Marcory' LIMIT 1)
WHERE name = 'Traoré Issa';
```

## 5. Vérifier l'Installation

### Vérifier le bucket :
```bash
# Via CLI
supabase storage ls

# Devrait afficher "storefront-images" dans la liste
```

### Vérifier la table :
```sql
-- Via SQL Editor
SELECT * FROM sales_representatives;

-- Devrait retourner les commerciaux créés
```

### Vérifier les colonnes du profil :
```sql
-- Via SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('registered_by_sales_rep_id', 'storefront_image_url');

-- Devrait retourner 2 lignes
```

## 6. Test de l'Application

### Test du sélecteur de commercial :

1. Ouvrez l'application en mode navigation privée
2. Cliquez sur "S'inscrire"
3. Après avoir choisi "Client" ou "Fournisseur", vous devriez voir le sélecteur "Commercial qui vous inscrit (optionnel)"
4. Le sélecteur devrait afficher :
   - "Inscription directe (sans commercial)" par défaut
   - Les commerciaux actifs listés avec leur zone

### Test de l'upload de photo :

1. Connectez-vous avec un compte Client ou Fournisseur
2. Allez dans "Mon Profil"
3. Descendez jusqu'à la section "📸 Photo de la devanture"
4. Testez :
   - Upload via "Prendre une photo" (sur mobile)
   - Upload via "Choisir un fichier"
   - Vérifiez que l'image est compressée (< 500KB)
   - Vérifiez que le format est WebP
   - Vérifiez que l'image s'affiche correctement

## 7. Troubleshooting

### Problème : "Bucket does not exist"
**Solution** : Vérifiez que le bucket `storefront-images` a bien été créé dans le Dashboard Storage.

### Problème : "Permission denied for bucket storefront-images"
**Solution** : Vérifiez que les policies ont bien été créées et activées via la migration 3.

### Problème : Le sélecteur de commercial ne s'affiche pas
**Solution** : Vérifiez qu'il y a au moins un commercial actif dans la table `sales_representatives`.

### Problème : L'upload échoue avec "File too large"
**Solution** : Le fichier dépasse probablement 1MB même après compression. Vérifiez que la compression fonctionne correctement.

## 8. Rollback (Si Nécessaire)

En cas de problème, vous pouvez annuler les migrations dans l'ordre inverse :

```sql
-- Supprimer les policies du bucket
DROP POLICY IF EXISTS "Public read access for storefront images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their storefront image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own storefront image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own storefront image" ON storage.objects;

-- Supprimer les colonnes du profil
ALTER TABLE profiles DROP COLUMN IF EXISTS storefront_image_url;
ALTER TABLE profiles DROP COLUMN IF EXISTS registered_by_sales_rep_id;

-- Supprimer la table sales_representatives
DROP TABLE IF EXISTS sales_representatives CASCADE;

-- Supprimer le bucket (via Dashboard uniquement)
```

## Support

Pour toute question ou problème, consultez :
- Documentation Supabase Storage : https://supabase.com/docs/guides/storage
- Documentation Supabase RLS : https://supabase.com/docs/guides/auth/row-level-security
