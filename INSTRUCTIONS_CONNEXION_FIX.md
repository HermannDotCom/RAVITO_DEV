# Instructions pour corriger le problème de connexion

## Problème identifié

Les utilisateurs ne peuvent pas se connecter car leurs profils ne sont pas créés dans la table `profiles` à cause des politiques RLS (Row Level Security) trop restrictives.

## Solution à appliquer

### Option 1 : Configuration automatique via Trigger (RECOMMANDÉ)

1. **Ouvrez votre Dashboard Supabase** :
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Accédez au SQL Editor** :
   - Cliquez sur "SQL Editor" dans le menu de gauche

3. **Exécutez le script** :
   - Ouvrez le fichier `SETUP_AUTO_PROFILE_CREATION.sql` dans votre éditeur
   - Copiez tout son contenu
   - Collez-le dans le SQL Editor
   - Cliquez sur "Run" ou appuyez sur Ctrl+Entrée

4. **Vérification** :
   - Vous devriez voir un message de succès
   - Le trigger créera automatiquement un profil pour chaque nouvel utilisateur

### Option 2 : Correction manuelle simple (ALTERNATIVE)

Si la première option ne fonctionne pas, essayez celle-ci :

1. **Ouvrez le SQL Editor** comme ci-dessus

2. **Exécutez cette commande simple** :
```sql
-- Rendre la politique INSERT plus permissive
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

3. **Redémarrez votre application**

## Correction des utilisateurs existants

Pour les utilisateurs qui existent déjà dans auth.users mais n'ont pas de profil (comme `toto@freelance.fr`) :

### Solution 1 : Créer le profil manuellement

```sql
-- Remplacez les valeurs par les bonnes informations
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
  'ae6796de-c53c-4c1a-a594-cf0dc8f7722d', -- L'ID de l'utilisateur depuis auth.users
  'client',
  'Toto',
  '',
  '',
  ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326),
  true,
  false,
  'pending'
);
```

### Solution 2 : Supprimer et recréer le compte

1. Allez dans Authentication > Users
2. Trouvez l'utilisateur `toto@freelance.fr`
3. Supprimez-le
4. Créez un nouveau compte via le formulaire d'inscription

## Test

Après avoir appliqué l'une de ces solutions :

1. Rechargez votre application (`npm run dev`)
2. Essayez de créer un nouveau compte
3. Vérifiez la console du navigateur pour les logs
4. Essayez de vous connecter

## Modifications apportées au code

Le code frontend a été mis à jour pour :

1. **Retry logic** : Tente de créer le profil plusieurs fois avec des délais
2. **Meilleurs logs** : Messages détaillés dans la console
3. **Gestion d'erreurs robuste** : Ne bloque plus indéfiniment sur "Connexion en cours..."
4. **Timeout de sécurité** : Déconnexion automatique si le profil n'est pas trouvé après 8 tentatives

## Logs à surveiller

Dans la console du navigateur, vous devriez voir :

✅ Connexion réussie :
```
Starting registration for: user@example.com
Auth user created, waiting for profile to be available...
Profile check attempt 1/8...
Profile created successfully
User set successfully: user@example.com
```

❌ Échec :
```
Starting registration for: user@example.com
Profile creation error: {...}
Failed to create or find profile after multiple attempts
```

## Support

Si le problème persiste après avoir appliqué ces solutions :

1. Vérifiez que les politiques RLS sont bien mises à jour
2. Regardez les logs détaillés dans la console
3. Vérifiez que la table `profiles` existe bien
4. Assurez-vous que l'extension PostGIS est activée pour les coordonnées géographiques
