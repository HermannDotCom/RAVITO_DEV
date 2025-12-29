# 📦 Guide d'Installation RAVITO

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** 18+ ([télécharger](https://nodejs.org/))
- **npm** ou **yarn** (inclus avec Node.js)
- **Git** ([télécharger](https://git-scm.com/))
- **Compte Supabase** ([créer un compte](https://supabase.com))

---

## Installation Locale

### 1. Cloner le Repository

```bash
git clone https://github.com/HermannDotCom/RAVITO_DEV.git
cd RAVITO_DEV
```

### 2. Installer les Dépendances

```bash
npm install
```

### 3. Configuration de l'Environnement

Créez un fichier `.env.local` à la racine du projet :

```bash
cp .env.example .env.local
```

Éditez `.env.local` avec vos clés Supabase :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anon
VITE_RESEND_API_KEY=votre_clé_resend (optionnel)
VITE_SENTRY_DSN=votre_dsn_sentry (optionnel)
```

**Obtenir vos clés Supabase :**
1. Connectez-vous à [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez l'URL et la clé `anon/public`

### 4. Configuration de la Base de Données

Si vous utilisez un nouveau projet Supabase, appliquez les migrations :

```bash
# Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier votre projet
supabase link --project-ref votre-ref-projet

# Appliquer les migrations
supabase db push
```

### 5. Lancer l'Application

```bash
npm run dev
```

L'application sera disponible sur **http://localhost:5173**

---

## Premiers Pas

### Créer le Compte Administrateur

1. Ouvrez http://localhost:5173
2. Cliquez sur "S'inscrire"
3. Créez un compte avec le rôle "Admin"
4. Dans Supabase Dashboard :
   - Allez dans **Authentication** → **Users**
   - Trouvez votre utilisateur
   - Dans **Table Editor** → **profiles**, définissez `is_approved = true`

### Créer des Comptes de Test

Consultez la documentation complète des comptes de test : [test-accounts.md](./test-accounts.md)

---

## Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarre le serveur de développement |
| `npm run build` | Compile l'application pour la production |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm test` | Lance les tests unitaires |
| `npm run test:ui` | Interface graphique des tests |
| `npm run test:coverage` | Génère le rapport de couverture |
| `npm run test:e2e` | Lance les tests end-to-end |

---

## Configuration Supabase

### Tables Principales

L'application utilise les tables suivantes :

- `profiles` - Informations utilisateur
- `orders` - Commandes
- `supplier_offers` - Offres des fournisseurs
- `products` - Catalogue de produits
- `delivery_zones` - Zones de livraison
- `organizations` - Organisations/équipes
- `organization_members` - Membres des équipes
- `role_permissions` - Permissions par rôle
- `ratings` - Évaluations

### Edge Functions

Les Edge Functions sont situées dans `supabase/functions/` :

- `send-notification` - Envoi de notifications email

Pour déployer les Edge Functions :

```bash
supabase functions deploy send-notification
```

### Row Level Security (RLS)

Toutes les tables ont des politiques RLS activées pour sécuriser l'accès aux données.

---

## Dépannage

### Erreur : "Invalid API Key"

→ Vérifiez que vos clés Supabase sont correctes dans `.env.local`

### Erreur : "Failed to fetch"

→ Vérifiez que l'URL Supabase est correcte et accessible

### Erreur de migration

→ Assurez-vous que toutes les migrations sont appliquées :
```bash
supabase db push
```

### L'application ne démarre pas

→ Supprimez `node_modules` et réinstallez :
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Support

Pour toute aide supplémentaire :

- 📧 Email : support@ravito.ci
- 📚 Documentation : [docs/](../)
- 🐛 Issues : [GitHub Issues](https://github.com/HermannDotCom/RAVITO_DEV/issues)

---

**Prêt à commencer !** 🚀
