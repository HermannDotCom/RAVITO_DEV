# Dépannage des Problèmes d'Authentification

## Symptôme : "Connexion en cours..." qui ne se termine jamais

Si vous voyez "Connexion en cours..." pendant plus de 10 secondes sans résultat, suivez ce guide.

## Étapes de Diagnostic

### 1. Ouvrez la Console du Navigateur

**Sur Desktop :**
- Chrome/Edge : F12 ou Ctrl+Shift+I (Cmd+Option+I sur Mac)
- Firefox : F12 ou Ctrl+Shift+K (Cmd+Option+K sur Mac)
- Safari : Cmd+Option+C (activer d'abord le menu Développement dans Préférences)

**Sur Mobile :**
- Android Chrome : Connectez via USB et utilisez `chrome://inspect`
- iOS Safari : Activez "Inspecteur Web" dans Réglages > Safari > Avancé, puis connectez à un Mac

### 2. Exécutez les Diagnostics

Dans la console, tapez :
```javascript
await window.runAuthDiagnostics()
```

Cela affichera un tableau avec les résultats des tests.

### 3. Interprétez les Résultats

#### ✅ Tous les tests réussis
Si tous les tests affichent `success`, le problème n'est pas lié à la configuration.

#### ❌ "Environment Variables" en erreur
**Problème :** Les variables d'environnement Supabase ne sont pas définies.

**Solution :**
1. Vérifiez que le fichier `.env` existe à la racine du projet
2. Vérifiez qu'il contient :
   ```
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_clé_anonyme
   ```
3. Sur la plateforme de déploiement (Netlify/Vercel/etc), vérifiez que ces variables sont configurées
4. Redéployez l'application

#### ❌ "Database Connection" en erreur
**Problème :** Impossible de se connecter à Supabase.

**Causes possibles :**
- URL Supabase incorrecte
- Clé Supabase incorrecte
- Projet Supabase en pause ou supprimé
- Problème réseau/CORS

**Solution :**
1. Vérifiez les credentials dans le dashboard Supabase
2. Copiez à nouveau l'URL et la clé depuis Settings > API
3. Assurez-vous que le projet Supabase est actif

#### ❌ "Profile Access (RLS)" en erreur
**Problème :** Les Row Level Security policies bloquent l'accès au profil.

**Message :** "RLS policies may be blocking profile access"

**Solution :**
```sql
-- Vérifiez que ces policies existent dans votre base de données
-- Exécutez dans l'éditeur SQL Supabase :

-- 1. Vérifier que RLS est activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- 2. Lister les policies existantes
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 3. Si aucune policy pour SELECT, créez-la :
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

#### ❌ "Profile not found in database"
**Problème :** L'utilisateur existe dans auth.users mais pas dans la table profiles.

**Solution :**
```sql
-- Vérifiez si le profil existe
SELECT id, email FROM auth.users WHERE email = 'email@exemple.com';
SELECT id, role, name FROM profiles WHERE id = 'user_id_from_above';

-- Si le profil n'existe pas, créez-le manuellement :
INSERT INTO profiles (id, role, name, phone, address, is_approved, approval_status)
VALUES (
  'user_id_from_auth_users',
  'client', -- ou 'supplier' ou 'admin'
  'Nom de l''utilisateur',
  '+225XXXXXXXXXX',
  'Adresse',
  true,
  'approved'
);
```

### 4. Logs Détaillés

Lors d'une tentative de connexion, vous devriez voir dans la console :

```
=== LOGIN START ===
Attempting login for: user@example.com
Timestamp: 2024-...
Auth successful! User ID: xxxxx-xxxx-xxxx...
Session created: true
Now fetching profile...
Fetching profile for user: xxxxx-xxxx-xxxx...
Profile found: {id: "...", role: "client", email: "..."}
Profile fetch result: true
=== LOGIN END ===
```

**Si le processus s'arrête avant "Profile fetch result"**, le problème est dans `fetchUserProfile`.

**Erreurs possibles :**
- `Profile fetch timeout after 10s` → Problème réseau ou RLS bloquant
- `Error fetching profile` → Voir les détails de l'erreur PostgreSQL
- `Profile not found for user` → Le profil n'existe pas dans la base

## Solutions Rapides

### Reset complet de l'authentification

```javascript
// Dans la console du navigateur
await window.supabase.auth.signOut();
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Vérifier la configuration Supabase

```javascript
// Dans la console
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
```

### Test de connexion manuelle

```javascript
// Dans la console
const { data, error } = await window.supabase.auth.signInWithPassword({
  email: 'votre@email.com',
  password: 'votre_mot_de_passe'
});
console.log('Auth result:', { data, error });

// Puis tester l'accès au profil
const { data: profile, error: profileError } = await window.supabase
  .from('profiles')
  .select('*')
  .eq('id', data.user.id)
  .maybeSingle();
console.log('Profile result:', { profile, profileError });
```

## Problèmes Spécifiques Mobile

### Android Chrome
- Effacez le cache : Chrome > ⋮ > Historique > Effacer les données de navigation
- Vérifiez que les cookies tiers sont autorisés
- Désactivez "Économiseur de données"

### iOS Safari
- Réglages > Safari > Effacer historique et données de site
- Désactivez "Bloquer tous les cookies" si activé
- Désactivez "Empêcher le suivi" pour le site

### PWA (Application installée)
- Désinstallez l'application
- Effacez le cache du navigateur
- Réinstallez depuis le navigateur

## Contact Support

Si le problème persiste après avoir suivi ce guide :

1. Exécutez `await window.runAuthDiagnostics()` dans la console
2. Faites une capture d'écran des résultats
3. Copiez tous les logs de la console (filtrer sur "LOGIN" et "Profile")
4. Contactez : support@distri-night.ci

Informations à fournir :
- Email du compte concerné
- Navigateur et version (Desktop/Mobile)
- Résultats des diagnostics
- Logs de la console
- Capture d'écran du problème

## Pour les Développeurs

### Variables d'Environnement Requises

```bash
# .env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Migration RLS Profiles

Assurez-vous que la migration `20251213130700_20251213000001_restore_complete_rls_policies.sql` a été appliquée.

### Timeout Configuration

Le timeout de fetch du profil est configuré à 10 secondes dans `AuthContext.tsx`.
Pour l'ajuster :

```typescript
// src/context/AuthContext.tsx, ligne 62
setTimeout(() => reject(new Error('Profile fetch timeout after 10s')), 10000);
// Changez 10000 en la valeur souhaitée en millisecondes
```

### Logging Avancé

Pour activer plus de logs :

```javascript
// Dans la console
localStorage.setItem('supabase.debug', 'true');
location.reload();
```

## Historique des Changements

**2024-12-15** : Ajout du système de timeout (10s) et diagnostics améliorés
**2024-12-13** : Restauration complète des RLS policies
**2024-12-11** : Fix de la récursion infinie dans les policies profiles
