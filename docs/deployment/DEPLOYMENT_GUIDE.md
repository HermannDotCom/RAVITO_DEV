# 🚀 Guide de Déploiement RAVITO Gestion

**Version :** v1.6.3  
**Date :** 14 février 2026  
**Environnement :** Production

---

## 📋 Prérequis

- Accès au repository GitHub `HermannDotCom/RAVITO_DEV`
- Accès au dashboard Supabase
- Accès au dashboard hébergeur (Vercel/Netlify)
- CLI Supabase installé (`npm install -g supabase`)
- Node.js v18+ installé

---

## 📅 Planning Déploiement

| Étape | Horaire | Durée | Responsable |
|-------|---------|-------|-------------|
| Backup DB | 08:00 | 15 min | Hermann |
| Gel des commits | 08:15 | - | Hermann |
| Déploiement Edge Functions | 08:30 | 15 min | Hermann |
| Déploiement Application | 08:45 | 15 min | Hermann |
| Tests de fumée | 09:00 | 30 min | Hermann |
| Validation finale | 09:30 | 15 min | Hermann |
| Annonce MEP | 10:00 | - | Hermann |

---

## Étape 1 : Préparation (J-1)

### 1.1 Vérifier la branche

```bash
git checkout RAVITO_Gestion
git pull origin RAVITO_Gestion
git log --oneline -5  # Vérifier les derniers commits
```

### 1.2 Vérifier le build

```bash
npm ci  # Installation propre des dépendances
npm run build
```

✅ Le build doit passer sans erreur.

### 1.3 Vérifier les variables d'environnement

Fichier `.env.production` :

```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
VITE_APP_URL=https://ravito.ci
VITE_SENTRY_DSN=[sentry-dsn]
```

### 1.4 Backup Supabase

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner le projet RAVITO
3. Settings → Database → Backups
4. Créer un backup manuel
5. **Noter l'heure du backup : ___________**

---

## Étape 2 : Déploiement Edge Functions

### 2.1 Se connecter à Supabase CLI

```bash
supabase login
supabase link --project-ref [project-id]
```

### 2.2 Déployer les fonctions

```bash
# Déployer send-email
supabase functions deploy send-email

# Déployer send-notification (si existe)
supabase functions deploy send-notification
```

### 2.3 Vérifier les secrets

```bash
supabase secrets list
```

Secrets requis :
- `RESEND_API_KEY`

Si manquant :
```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
```

---

## Étape 3 : Déploiement Application

### Option A : Vercel

```bash
# Installation CLI si nécessaire
npm install -g vercel

# Déploiement production
vercel --prod
```

### Option B : Netlify

```bash
# Installation CLI si nécessaire
npm install -g netlify-cli

# Déploiement production
netlify deploy --prod
```

### Option C : Autre hébergeur

Suivre la documentation spécifique de l'hébergeur.

---

## Étape 4 : Vérification Post-Déploiement

### 4.1 Vérifier que le site répond

```bash
curl -I https://ravito.ci
# Doit retourner HTTP/2 200
```

### 4.2 Tests de fumée (Smoke Tests)

| Test | URL/Action | Résultat attendu |
|------|------------|------------------|
| Page d'accueil | https://ravito.ci | Page landing s'affiche |
| Page connexion | https://ravito.ci/login | Formulaire s'affiche |
| Inscription | Créer un compte test | Email reçu |
| Connexion | Se connecter | Redirection dashboard |
| Gestion Activité | Créer feuille | Feuille créée |

### 4.3 Vérifier Sentry

1. Aller sur [Sentry Dashboard](https://sentry.io)
2. Vérifier qu'aucune erreur n'est remontée
3. Tester en provoquant une erreur (optionnel)

### 4.4 Vérifier les emails

1. Créer un compte test
2. Vérifier la réception de l'email de bienvenue
3. Vérifier le contenu et le formatage

---

## Étape 5 : Validation Finale

### Checklist post-déploiement

- [ ] Site accessible sur https://ravito.ci
- [ ] SSL valide (cadenas vert)
- [ ] Inscription fonctionne
- [ ] Email de bienvenue reçu
- [ ] Connexion fonctionne
- [ ] Gestion Activité accessible
- [ ] Aucune erreur dans Sentry
- [ ] Aucune erreur dans la console navigateur

### Si tout est OK

✅ **MEP validée !**

Annoncer sur les canaux appropriés.

### Si problème détecté

⚠️ Suivre le [Plan de Rollback](./ROLLBACK_PLAN.md)

---

## 📞 Contacts d'Urgence

| Rôle | Nom | Contact |
|------|-----|---------|
| Lead Dev | Hermann | [À compléter] |
| Support Supabase | - | support@supabase.io |
| Support Vercel | - | support@vercel.com |
| Support Netlify | - | support@netlify.com |

---

## 📝 Journal de Déploiement

| Heure | Action | Résultat | Notes |
|-------|--------|----------|-------|
| ___:___ | Backup DB | ⬜ OK / ⬜ KO | |
| ___:___ | Deploy Edge Functions | ⬜ OK / ⬜ KO | |
| ___:___ | Deploy App | ⬜ OK / ⬜ KO | |
| ___:___ | Tests fumée | ⬜ OK / ⬜ KO | |
| ___:___ | Validation | ⬜ OK / ⬜ KO | |
