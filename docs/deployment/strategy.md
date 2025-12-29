# 🚀 Stratégie de Déploiement RAVITO

> Document de référence pour la gestion des environnements et le déploiement de l'application RAVITO.

**Dernière mise à jour :** 23 Décembre 2025  
**Version :** 1.0  
**Auteur :** Équipe RAVITO

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Multi-Environnements](#architecture-multi-environnements)
3. [Projets Supabase](#projets-supabase)
4. [Branches GitHub](#branches-github)
5. [Variables d'Environnement](#variables-denvironnement)
6. [Workflow de Déploiement](#workflow-de-déploiement)
7. [Gestion des Migrations](#gestion-des-migrations)
8. [Roadmap des Versions](#roadmap-des-versions)
9. [Procédures de Rollback](#procédures-de-rollback)
10. [Checklist MEP](#checklist-mep)

---

## Vue d'Ensemble

RAVITO utilise une architecture **multi-environnements** avec des projets Supabase séparés pour garantir : 

- ✅ **Isolation totale** entre développement, test et production
- ✅ **Sécurité des données** clients en production
- ✅ **Liberté d'expérimentation** en développement
- ✅ **Validation QA** avant mise en production
- ✅ **Coûts maîtrisés** (pas de facturation horaire de branches)

---

## Architecture Multi-Environnements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE RAVITO                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DÉVELOPPEMENT            STAGING                  PRODUCTION               │
│   ─────────────            ───────                  ──────────               │
│                                                                              │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│   │ ravito-dev  │         │ravito-staging│        │ravito-prod  │          │
│   │  (Supabase) │         │  (Supabase)  │        │ (Supabase)  │          │
│   └─────────────┘         └─────────────┘         └─────────────┘          │
│         │                       │                       │                   │
│         ▼                       ▼                       ▼                   │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│   │   Vercel    │         │   Vercel    │         │   Vercel    │          │
│   │ Preview/Dev │         │   Staging   │         │ Production  │          │
│   └─────────────┘         └─────────────┘         └─────────────┘          │
│         │                       │                       │                   │
│         ▼                       ▼                       ▼                   │
│   feature/*              staging branch            main branch              │
│   develop branch              (GitHub)               (GitHub)               │
│     (GitHub)                                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Projets Supabase

### État Actuel (Pré-MVP)

| Projet | Statut | Plan | Usage |
|--------|--------|------|-------|
| **RAVITO_DEV** | ✅ Actif | Pro | Développement & Tests |
| ravito-staging | ⏳ À créer | Free/Pro | Pré-production |
| ravito-prod | ⏳ À créer | Pro | Production |

### Configuration des Projets

#### ravito-dev (Actuel)
```
Project Ref: byuwnxrfnfkxtmegyazj
Region: West EU (Paris)
Plan: Pro
URL: https://byuwnxrfnfkxtmegyazj.supabase.co
```

#### ravito-staging (À créer pour v1.7.0)
```
Project Ref: [À définir]
Region: West EU (Paris)
Plan: Free (suffisant pour tests)
URL: [À définir]
```

#### ravito-prod (À créer pour v1.7.0)
```
Project Ref: [À définir]
Region: West EU (Paris)
Plan: Pro (requis pour production)
URL: [À définir]
```

### Quand Créer les Projets ?

| Projet | Moment de Création | Raison |
|--------|-------------------|--------|
| ravito-staging | v1.6.x (avant MEP) | Tests finaux et validation QA |
| ravito-prod | v1.7.0 (MEP) | Lancement officiel |

---

## Branches GitHub

### Structure des Branches

```
main                    ← Production (protégée)
  │
  ├── staging           ← Pré-production (protégée)
  │     │
  │     └── develop     ← Développement actif
  │           │
  │           ├── feature/xxx    ← Nouvelles fonctionnalités
  │           ├── fix/xxx        ← Corrections de bugs
  │           └── hotfix/xxx     ← Corrections urgentes
  │
  └── release/v1.x. x    ← Branches de release
```

### Règles de Protection

| Branche | Protection | Qui peut merger |
|---------|------------|-----------------|
| `main` | ✅ Protégée | Après review + CI pass |
| `staging` | ✅ Protégée | Après tests QA |
| `develop` | ⚠️ Semi-protégée | Après review |
| `feature/*` | ❌ Non protégée | Développeurs |

---

## Variables d'Environnement

### Fichiers de Configuration

```
├── .env.development      # Environnement local → ravito-dev
├── .env.staging          # Environnement staging → ravito-staging  
├── .env.production       # Environnement production → ravito-prod
└── .env.example          # Template (sans secrets)
```

### Variables Requises

```bash
# . env.example (Template)

# Supabase
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]

# Push Notifications (optionnel)
VITE_VAPID_PUBLIC_KEY=[vapid-public-key]

# Sentry (monitoring)
VITE_SENTRY_DSN=[sentry-dsn]

# Environment
VITE_ENV=development|staging|production
```

### Exemple par Environnement

#### .env.development
```bash
VITE_SUPABASE_URL=https://byuwnxrfnfkxtmegyazj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... 
VITE_ENV=development
```

#### .env.staging
```bash
VITE_SUPABASE_URL=https://[staging-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[staging-anon-key]
VITE_ENV=staging
```

#### .env.production
```bash
VITE_SUPABASE_URL=https://[prod-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[prod-anon-key]
VITE_ENV=production
```

---

## Workflow de Déploiement

### Flux Standard (Feature → Production)

```
┌──────────────────────────────────────────────────────────────────┐
│                     WORKFLOW DE DÉPLOIEMENT                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. DÉVELOPPEMENT                                                 │
│     ─────────────                                                 │
│     feature/xxx → develop                                         │
│     • PR + Code Review                                            │
│     • Tests automatiques (CI)                                     │
│     • Deploy preview sur Vercel                                   │
│     • Tests manuels sur ravito-dev                                │
│                                                                   │
│  2. STAGING                                                       │
│     ───────                                                       │
│     develop → staging                                             │
│     • Déploiement automatique                                     │
│     • Migration BDD sur ravito-staging                            │
│     • Tests QA complets                                           │
│     • Validation fonctionnelle                                    │
│                                                                   │
│  3. PRODUCTION                                                    │
│     ──────────                                                    │
│     staging → main                                                │
│     • Release tag (v1.x.x)                                        │
│     • Migration BDD sur ravito-prod                               │
│     • Déploiement production                                      │
│     • Monitoring post-déploiement                                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Commandes de Déploiement

```bash
# Développement local
npm run dev

# Build staging
npm run build:staging

# Build production
npm run build:production

# Déploiement Vercel (automatique via GitHub)
git push origin staging   # → Déploie sur staging
git push origin main      # → Déploie sur production
```

---

## Gestion des Migrations

### Structure des Migrations

```
supabase/
├── migrations/           # Migrations SQL versionnées
│   ├── 20251223002051_create_module_permissions_system.sql
│   ├── 20251223020032_create_notification_system.sql
│   └── ... 
├── backups/              # Sauvegardes par version
│   └── v1.5.4/
│       └── SUPABASE_SYNC_REPORT_v1.5.4.md
└── seed. sql              # Données initiales (dev/staging)
```

### Appliquer les Migrations

#### Via Supabase CLI (Recommandé)

```bash
# Lier le projet
supabase link --project-ref [project-ref]

# Appliquer les migrations
supabase db push

# Vérifier le statut
supabase db status
```

#### Via SQL Editor (Manuel)

1. Dashboard Supabase → SQL Editor
2. Copier le contenu du fichier migration
3. Exécuter
4. Enregistrer dans schema_migrations si nécessaire

### Synchronisation entre Environnements

```bash
# 1. Développer et tester sur ravito-dev
supabase link --project-ref [dev-ref]
supabase db push

# 2. Appliquer sur ravito-staging
supabase link --project-ref [staging-ref]
supabase db push

# 3. Appliquer sur ravito-prod (après validation)
supabase link --project-ref [prod-ref]
supabase db push
```

---

## Roadmap des Versions

### Historique des Releases

| Version | Date | Description | PRs |
|---------|------|-------------|-----|
| v1.0.0-mvp-stable | 07/12/2025 | MVP Initial | - |
| v1.1.0-ravito | 09/12/2025 | Rebranding | - |
| v1.2.0-ravito-stable | 09/12/2025 | UX Fixes | - |
| v1.3.0-design-system-2 | 11/12/2025 | Design System 2.0 | - |
| v1.4.0 | 14/12/2025 | Commissions & Support | - |
| v1.4.1 | 15/12/2025 | Fix responsive | - |
| v1.5.0 | 15/12/2025 | Go-to-Market Sprint | - |
| v1.5.1 | 15/12/2025 | Sprint complet | - |
| v1.5.2 | 17/12/2025 | Pricing Module | - |
| v1.5.3 | 18/12/2025 | Identité Visuelle | #96 |
| **v1.5.4** | **23/12/2025** | **Permissions & Notifications** | #104-113 |

### Versions Futures

| Version | Objectif | Environnements |
|---------|----------|----------------|
| v1.5.x | Corrections mineures | ravito-dev |
| v1.6.0 | Fonctionnalité majeure | ravito-dev + ravito-staging |
| **v1.7.0** | **🚀 MEP MVP** | ravito-dev + ravito-staging + **ravito-prod** |

---

## Procédures de Rollback

### Rollback Code (GitHub)

```bash
# Revenir à une version spécifique
git checkout v1.5.4

# Créer une branche de hotfix si nécessaire
git checkout -b hotfix/rollback-from-v1.5.5

# Forcer le déploiement de l'ancienne version
git push origin main --force  # ⚠️ Avec précaution ! 
```

### Rollback Base de Données (Supabase)

#### Option 1 : Via Migrations Inverses

```sql
-- Créer une migration de rollback
-- supabase/migrations/20251224_rollback_to_v154.sql

-- Exemple:  Supprimer une table ajoutée par erreur
DROP TABLE IF EXISTS problematic_table;

-- Restaurer une colonne supprimée
ALTER TABLE orders ADD COLUMN old_column TEXT;
```

#### Option 2 : Via le Rapport de Backup

1. Consulter `supabase/backups/v1.5.4/SUPABASE_SYNC_REPORT_v1.5.4.md`
2. Identifier les tables/politiques de la version stable
3. Recréer manuellement si nécessaire

#### Option 3 :  PITR (Si Activé - Payant)

1. Dashboard → Database → Backups
2. Point in Time Recovery
3. Sélectionner la date/heure de la version stable

---

## Checklist MEP

### Pré-MEP (v1.6.x)

- [ ] Créer projet `ravito-staging` sur Supabase
- [ ] Configurer variables d'environnement staging
- [ ] Mettre en place CI/CD pour staging
- [ ] Tests de charge / performance
- [ ] Audit de sécurité RLS
- [ ] Documentation utilisateur

### MEP (v1.7.0)

- [ ] Créer projet `ravito-prod` sur Supabase (Plan Pro)
- [ ] Configurer variables d'environnement production
- [ ] Configurer domaine personnalisé
- [ ] Activer monitoring (Sentry)
- [ ] Configurer alertes
- [ ] Plan de communication lancement
- [ ] Backup initial production

### Post-MEP

- [ ] Monitoring 24h post-lancement
- [ ] Collecte feedback utilisateurs
- [ ] Corrections hotfix si nécessaire
- [ ] Rétrospective équipe

---

## 📞 Contacts & Ressources

### Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

### Support

- **Supabase** : https://supabase.com/dashboard/support
- **Vercel** :  https://vercel.com/support

---

## 📝 Historique des Modifications

| Date | Version | Auteur | Description |
|------|---------|--------|-------------|
| 23/12/2025 | 1.0 | Équipe RAVITO | Création initiale |

---

> **Note** : Ce document doit être mis à jour à chaque changement majeur dans la stratégie de déploiement. 