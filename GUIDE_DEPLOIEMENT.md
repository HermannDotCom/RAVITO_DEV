# 🚀 GUIDE DE DÉPLOIEMENT - DISTRI-NIGHT

**Procédures de Déploiement Zero-Downtime**  
**Version:** 1.0.0  
**Date:** Novembre 2025  
**Classification:** Documentation Technique - DevOps

---

## 📑 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Environnements](#environnements)
3. [Prérequis](#prérequis)
4. [Procédure de Déploiement](#procédure-de-déploiement)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Rollback et Recovery](#rollback-et-recovery)
7. [Tests de Déploiement](#tests-de-déploiement)
8. [Monitoring Post-Déploiement](#monitoring-post-déploiement)
9. [Troubleshooting](#troubleshooting)
10. [Checklists](#checklists)

---

## Vue d'Ensemble

### 🎯 Objectifs de Déploiement

| Objectif | Valeur Cible | Méthode |
|----------|--------------|---------|
| **Zero Downtime** | 0 seconde d'indisponibilité | Blue-Green Deployment |
| **Rollback Rapide** | < 2 minutes | Automatique |
| **Validation Pré-Prod** | 100% tests passés | CI/CD Gates |
| **Temps Déploiement** | < 10 minutes | Pipeline optimisé |
| **Fréquence Déploiements** | 2-3 par semaine | Continuous Deployment |

### 🏗️ Architecture de Déploiement

```
┌───────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE DE DÉPLOIEMENT                │
└───────────────────────────────────────────────────────────┘

DÉVELOPPEMENT
     │
     │ git push
     ▼
┌─────────────┐
│   GitHub    │  ← Repository Source
│ Repository  │
└──────┬──────┘
       │
       │ Webhook
       ▼
┌──────────────────────────────────────────────────────┐
│           GITHUB ACTIONS (CI/CD)                      │
├──────────────────────────────────────────────────────┤
│  1. Tests Unitaires                                   │
│  2. Tests d'Intégration                              │
│  3. Linting & Type Check                             │
│  4. Security Scan                                     │
│  5. Build Application                                 │
│  6. Run E2E Tests (Staging)                          │
└──────┬───────────────────────────────────────────────┘
       │
       │ Deploy
       ▼
┌──────────────────────────────────────────────────────┐
│              ENVIRONNEMENTS CIBLES                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  STAGING   │  │  PREVIEW   │  │ PRODUCTION   │  │
│  │  (develop) │  │ (PR-based) │  │    (main)    │  │
│  └────────────┘  └────────────┘  └──────────────┘  │
│       │               │                  │          │
│       ▼               ▼                  ▼          │
│  ┌──────────────────────────────────────────────┐  │
│  │         VERCEL/NETLIFY PLATFORM              │  │
│  │  • Auto-scaling                              │  │
│  │  • Global CDN                                │  │
│  │  • SSL Certificates                          │  │
│  │  • Health Monitoring                         │  │
│  └──────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

---

## Environnements

### 🔧 Configuration des Environnements

#### 1. Développement Local (DEV)

```bash
ENVIRONNEMENT: Development
URL: http://localhost:5173
BASE DE DONNÉES: Supabase Dev Project
OBJECTIF: Développement features & debugging

VARIABLES D'ENVIRONNEMENT (.env.local):
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
VITE_ENV=development
VITE_API_DEBUG=true

CARACTÉRISTIQUES:
✓ Hot Module Replacement (HMR)
✓ Source maps complets
✓ Logs détaillés
✓ Mock data disponible
✗ Pas de cache
✗ Pas de minification
```

#### 2. Preview (PR-based)

```bash
ENVIRONNEMENT: Preview
URL: https://distri-night-pr-123.vercel.app
BASE DE DONNÉES: Supabase Staging
OBJECTIF: Review code & validation features

VARIABLES D'ENVIRONNEMENT (.env.preview):
VITE_SUPABASE_URL=https://staging-xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
VITE_ENV=preview
VITE_API_DEBUG=false

CARACTÉRISTIQUES:
✓ Déploiement automatique par PR
✓ Isolation complète
✓ URL unique persistante
✓ Destruction auto après merge
✓ Environnement production-like
```

#### 3. Staging (Pré-Production)

```bash
ENVIRONNEMENT: Staging
URL: https://staging.distri-night.ci
BASE DE DONNÉES: Supabase Staging
OBJECTIF: Tests finaux avant production

VARIABLES D'ENVIRONNEMENT (.env.staging):
VITE_SUPABASE_URL=https://staging-xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
VITE_ENV=staging
VITE_API_DEBUG=false
VITE_ENABLE_ANALYTICS=false

CARACTÉRISTIQUES:
✓ Clone production
✓ Tests E2E automatisés
✓ Data anonymisées
✓ Performance monitoring
✓ Security scanning
```

#### 4. Production

```bash
ENVIRONNEMENT: Production
URL: https://app.distri-night.ci
BASE DE DONNÉES: Supabase Production
OBJECTIF: Application finale utilisateurs

VARIABLES D'ENVIRONNEMENT (.env.production):
VITE_SUPABASE_URL=https://prod-xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
VITE_ENV=production
VITE_API_DEBUG=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_MONITORING=true

CARACTÉRISTIQUES:
✓ Code minifié & optimisé
✓ CDN global (140+ PoPs)
✓ Auto-scaling
✓ Monitoring 24/7
✓ Backups automatiques
✓ SSL/TLS strict
```

### 🔀 Stratégie de Branches

```
┌─────────────────────────────────────────────────────┐
│              GIT BRANCHING STRATEGY                  │
│                  (GitHub Flow)                       │
└─────────────────────────────────────────────────────┘

main (protected)
 │
 ├─ Production déployée
 │  Merge uniquement via PR approved
 │  Require: Tests passés + 1 review min
 │
 └──┬─ develop (protected)
    │
    ├─ Staging déployée
    │  Merge des features terminées
    │  Tests continus
    │
    └──┬─ feature/xxx
       ├─ feature/yyy
       └─ feature/zzz
          
          Preview déployé automatiquement
          Tests sur chaque commit
          Review par pairs

WORKFLOW:
1. feature/new-feature ← Développement
2. PR → develop ← Review + Tests
3. Merge → develop ← Deploy Staging
4. Tests Staging OK
5. PR → main ← Review + Approval
6. Merge → main ← Deploy Production
```

---

## Prérequis

### 👨‍💻 Accès Requis

```
PERMISSIONS NÉCESSAIRES DÉPLOIEMENT:

☐ Accès GitHub Repository (Write)
☐ Accès Vercel/Netlify (Admin)
☐ Accès Supabase Dashboard (Admin)
☐ Accès Secrets Management
☐ Accès Monitoring (Sentry, DataDog)
☐ Accès DNS Management (Cloudflare)
☐ Numéro téléphone astreinte (urgences)
☐ Accès VPN (si infrastructure privée)
```

### 🛠️ Outils Nécessaires

```bash
# Vérification environnement développeur
node --version    # v18.0.0 ou supérieur
npm --version     # v9.0.0 ou supérieur
git --version     # v2.30.0 ou supérieur

# Installation dépendances globales
npm install -g vercel    # CLI Vercel
npm install -g supabase  # CLI Supabase (si migrations)

# Vérification accès
vercel whoami           # Confirme authentification
git remote -v           # Confirme accès repo
```

### 📋 Checklist Pré-Déploiement

```
AVANT CHAQUE DÉPLOIEMENT:

VALIDATIONS TECHNIQUES:
☐ Tous tests unitaires passent (npm test)
☐ Tous tests E2E passent (npm run test:e2e)
☐ Linting sans erreur (npm run lint)
☐ Type check sans erreur (npm run type-check)
☐ Build réussit localement (npm run build)
☐ Performance acceptable (Lighthouse > 90)
☐ Pas de dépendances vulnérables (npm audit)
☐ Documentation à jour

VALIDATIONS BUSINESS:
☐ Feature validée par Product Owner
☐ Tests acceptation passés
☐ Pas d'impact breaking changes
☐ Données migration préparée (si applicable)
☐ Communication équipe effectuée
☐ Fenêtre de déploiement confirmée
☐ Plan rollback documenté

VALIDATIONS OPÉRATIONNELLES:
☐ Équipe support notifiée
☐ Monitoring configuré
☐ Alertes configurées
☐ Backup récent validé (< 24h)
☐ Capacité serveurs suffisante
☐ Pas de déploiement concurrent
```

---

## Procédure de Déploiement

### 🚀 Déploiement Automatique (Recommandé)

#### Déploiement vers Staging

```bash
# Méthode 1: Via GitHub (Automatique)
git checkout develop
git pull origin develop
git merge feature/ma-feature
git push origin develop

# ✅ GitHub Actions détecte le push
# ✅ Pipeline CI/CD démarre automatiquement
# ✅ Tests passés → Déploiement Staging
# ✅ Notification Slack

# Méthode 2: Via CLI Vercel (Manuel)
vercel --prod=false --scope=distri-night

# Temps total: ~3-5 minutes
```

#### Déploiement vers Production

```bash
# IMPORTANT: Utiliser TOUJOURS via Pull Request

# 1. Créer PR develop → main
gh pr create \
  --base main \
  --head develop \
  --title "Release v1.2.0" \
  --body "$(cat CHANGELOG.md)"

# 2. Attendre reviews (minimum 1 required)
# 3. Attendre validation CI/CD
# 4. Merger PR (via GitHub interface)
# 5. Production déployée automatiquement

# Temps total: ~5-8 minutes
# Downtime: 0 seconde (Blue-Green)
```

### 🔧 Déploiement Manuel (Urgence)

```bash
# ⚠️  URGENCE UNIQUEMENT (Si CI/CD défaillant)

# 1. Vérifications préalables
npm run lint
npm run type-check
npm test
npm run build

# 2. Déploiement Vercel
vercel --prod --confirm

# 3. Validation santé
curl https://app.distri-night.ci/health
# Expected: {"status":"ok","version":"1.2.0"}

# 4. Monitoring intensif (15 minutes)
# - Logs en temps réel
# - Métriques erreurs
# - Feedback utilisateurs

# 5. Documentation post-déploiement
# Créer incident report expliquant déploiement manuel
```

### 🗃️ Déploiement Base de Données (Migrations)

```bash
# MIGRATIONS SUPABASE

# 1. Créer migration (Dev)
supabase migration new add_new_column

# 2. Écrire SQL migration
# supabase/migrations/YYYYMMDD_add_new_column.sql

# 3. Tester localement
supabase db reset
npm test

# 4. Pousser vers Staging
supabase db push --db-url $STAGING_DATABASE_URL

# 5. Valider Staging
npm run test:e2e -- --env=staging

# 6. Backup Production (CRITIQUE)
# Via Supabase Dashboard: Projects → Backups → Create Backup

# 7. Déployer Production
supabase db push --db-url $PRODUCTION_DATABASE_URL

# 8. Validation Production
# Tests smoke sur endpoints critiques
curl -X GET https://api.distri-night.ci/orders
curl -X GET https://api.distri-night.ci/products

# ⚠️  IMPORTANT: Migrations irréversibles nécessitent:
#    - Approval CTO
#    - Backup validé
#    - Plan rollback documenté
#    - Fenêtre maintenance (si downtime)
```

---

## CI/CD Pipeline

### 🤖 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Deploy DISTRI-NIGHT

on:
  push:
    branches:
      - main        # Production
      - develop     # Staging
  pull_request:
    branches:
      - main
      - develop

jobs:
  
  # ═══════════════════════════════════════
  # JOB 1: VALIDATION & TESTS
  # ═══════════════════════════════════════
  test:
    name: Tests & Validation
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Lint Code
        run: npm run lint
        
      - name: Type Check
        run: npm run type-check
        
      - name: Unit Tests
        run: npm test -- --coverage
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
  
  # ═══════════════════════════════════════
  # JOB 2: SECURITY SCAN
  # ═══════════════════════════════════════
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    timeout-minutes: 5
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        
      - name: Run npm audit
        run: npm audit --audit-level=high
        
      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  
  # ═══════════════════════════════════════
  # JOB 3: BUILD APPLICATION
  # ═══════════════════════════════════════
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [test, security]
    timeout-minutes: 10
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
          retention-days: 7
  
  # ═══════════════════════════════════════
  # JOB 4: DEPLOY TO STAGING
  # ═══════════════════════════════════════
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.distri-night.ci
    timeout-minutes: 10
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod=false'
          
      - name: Run Smoke Tests
        run: |
          curl -f https://staging.distri-night.ci/health || exit 1
          
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployed successfully! 🚀'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  
  # ═══════════════════════════════════════
  # JOB 5: DEPLOY TO PRODUCTION
  # ═══════════════════════════════════════
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://app.distri-night.ci
    timeout-minutes: 15
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          
      - name: Health Check
        run: |
          sleep 30  # Attente stabilisation
          curl -f https://app.distri-night.ci/health || exit 1
          
      - name: Run Critical Tests
        run: npm run test:smoke:production
        
      - name: Notify Team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '🎉 Production deployed! Version ${{ github.sha }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### ⏱️ Durées Pipeline

```
TIMELINE DÉPLOIEMENT (Production):

00:00 - Push vers main branch
00:15 - GitHub Actions démarre
00:30 - Tests unitaires (3 min)
03:30 - Security scan (2 min)
05:30 - Build application (3 min)
08:30 - Deploy Vercel (2 min)
10:30 - Health checks (1 min)
11:30 - Smoke tests (30 sec)
12:00 - Notification équipe ✅

TOTAL: ~12 minutes
DOWNTIME: 0 seconde
```

---

## Rollback et Recovery

### ⏮️ Procédure de Rollback

#### Rollback Rapide (< 2 minutes)

```bash
# MÉTHODE 1: Via Vercel Dashboard (Plus rapide)
# 1. Aller sur dashboard.vercel.com
# 2. Sélectionner projet "distri-night"
# 3. Onglet "Deployments"
# 4. Trouver dernier déploiement stable
# 5. Cliquer "..." → "Promote to Production"
# 6. Confirmer

# Temps: ~30 secondes

# MÉTHODE 2: Via Vercel CLI
vercel rollback https://app.distri-night.ci

# Temps: ~1 minute

# MÉTHODE 3: Via Git (Si autres méthodes échouent)
git revert HEAD
git push origin main
# GitHub Actions redéploiera version précédente
# Temps: ~5 minutes
```

#### Rollback Database (Plus Complexe)

```bash
# ⚠️  CRITIQUE: Coordination avec équipe technique requise

# 1. Évaluer impact
# - Nouvelles colonnes? → Migration down possible
# - Données migrées? → Backup restore nécessaire
# - Breaking changes? → Rollback code + DB ensemble

# 2. Stopper nouvelles écritures (si nécessaire)
# - Activer mode maintenance
# - Rediriger trafic vers page statique

# 3. Restaurer backup (Si nécessaire)
# Via Supabase Dashboard:
# Projects → Database → Backups → Restore

# 4. Appliquer migration down (Si disponible)
supabase db reset --db-url $PRODUCTION_DATABASE_URL

# 5. Valider cohérence données
npm run test:data-integrity

# 6. Réactiver application
# - Rollback code applicatif
# - Désactiver mode maintenance

# Temps: 15-30 minutes
# Impact: Possible courte indisponibilité
```

### 🆘 Disaster Recovery

```
┌─────────────────────────────────────────────────────────┐
│           PLAN DE DISASTER RECOVERY (DR)                │
└─────────────────────────────────────────────────────────┘

SCÉNARIO 1: Panne Totale Application
─────────────────────────────────────
RTO (Recovery Time Objective): 15 minutes
RPO (Recovery Point Objective): 1 heure

Actions:
1. Activer page maintenance statique (CloudFlare)
2. Investiguer cause (logs, monitoring)
3. Rollback dernière version stable
4. Si échec: Redéploiement complet
5. Validation santé système
6. Communication utilisateurs (email + SMS)

SCÉNARIO 2: Corruption Base de Données
───────────────────────────────────────
RTO: 30 minutes
RPO: 24 heures (backup quotidien)

Actions:
1. Isolation database (read-only)
2. Évaluation étendue corruption
3. Restore dernier backup sain
4. Rejeu transactions depuis backup (si logs disponibles)
5. Validation intégrité (checksum)
6. Réactivation write
7. Post-mortem incident

SCÉNARIO 3: Compromission Sécurité
───────────────────────────────────
RTO: Immédiat (isolation)
RPO: N/A

Actions:
1. ISOLATION IMMÉDIATE (couper accès externes)
2. Notification équipe sécurité + management
3. Forensics (préserver logs)
4. Identification vulnérabilité
5. Patch sécurité
6. Rotation credentials
7. Audit complet
8. Communication légale (RGPD si breach données)

SCÉNARIO 4: Panne Fournisseur (Supabase/Vercel)
────────────────────────────────────────────────
RTO: 2 heures (migration)
RPO: 1 heure

Actions:
1. Vérifier status page fournisseur
2. Évaluer durée estimée panne
3. Si > 1h: Activer plan contingence
   - Backup sur infrastructure secondaire
   - Redirection DNS
4. Communication transparente utilisateurs
5. Post-incident: Négociation compensations SLA
```

---

## Tests de Déploiement

### 🧪 Tests Pre-Production

```bash
# SUITE DE TESTS COMPLÈTE AVANT PRODUCTION

# 1. Tests Unitaires (Obligatoire)
npm test
# Couverture minimale: 80%

# 2. Tests d'Intégration (Obligatoire)
npm run test:integration
# Vérifie APIs, DB, Auth

# 3. Tests E2E (Obligatoire)
npm run test:e2e
# Scénarios utilisateurs critiques

# 4. Tests de Performance (Recommandé)
npm run test:performance
# Lighthouse CI score > 90

# 5. Tests de Sécurité (Obligatoire)
npm audit
npm run test:security

# 6. Tests de Charge (Avant releases majeures)
npm run test:load
# Simule 1000+ utilisateurs concurrent
```

### ✅ Tests Post-Déploiement (Smoke Tests)

```bash
# VALIDATION RAPIDE POST-DÉPLOIEMENT

# Health Check Endpoint
curl -f https://app.distri-night.ci/health
# ✅ Expected: {"status":"ok","version":"1.2.0"}

# Authentication Flow
curl -X POST https://app.distri-night.ci/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.ci","password":"Test123!"}'
# ✅ Expected: 200 OK with JWT token

# List Products (Public)
curl https://app.distri-night.ci/api/products
# ✅ Expected: 200 OK with products array

# Create Order (Protected)
curl -X POST https://app.distri-night.ci/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":"xxx","quantity":1}]}'
# ✅ Expected: 201 Created

# Realtime Connection
wscat -c wss://app.distri-night.ci/realtime
# ✅ Expected: WebSocket connection established

# Static Assets
curl -I https://app.distri-night.ci/assets/logo.svg
# ✅ Expected: 200 OK, Cache-Control header présent
```

---

## Monitoring Post-Déploiement

### 📊 Métriques à Surveiller

```
┌──────────────────────────────────────────────────────┐
│       DASHBOARD MONITORING POST-DÉPLOIEMENT          │
│         (15 premières minutes critiques)             │
└──────────────────────────────────────────────────────┘

MÉTRIQUES FRONTEND:
├─ Error Rate              < 1%     [████████░░] 0.3%
├─ Page Load Time          < 2s     [█████████░] 1.8s
├─ First Contentful Paint  < 1.5s   [██████████] 1.2s
├─ Time to Interactive     < 3s     [████████░░] 2.5s
└─ Bounce Rate             < 5%     [█████████░] 4.1%

MÉTRIQUES BACKEND:
├─ API Response Time       < 200ms  [████████░░] 150ms
├─ Database Connections    < 50     [███░░░░░░░] 15
├─ Edge Functions Cold     < 100ms  [████████░░] 85ms
├─ Realtime Connections    ~200     [███████░░░] ~180
└─ Error Rate API          < 0.5%   [██████████] 0.1%

MÉTRIQUES BUSINESS:
├─ Utilisateurs Actifs     Stable   [██████████] ✅
├─ Nouvelles Commandes     Normal   [██████████] ✅
├─ Taux Conversion         > 15%    [████████░░] 16%
└─ Satisfaction (ratings)  > 4.0    [████████░░] 4.5

ALERTES DÉCLENCHÉES:       0        🟢 ALL GOOD
```

### 🔔 Alertes Critiques Post-Déploiement

```
ALERTES À SURVEILLER (T+0 à T+1h):

🔴 CRITIQUE (Action immédiate):
├─ Error rate > 5% → ROLLBACK IMMÉDIAT
├─ API response time > 1s → Investigation + Rollback
├─ Database connections > 80% → Scale up ou rollback
└─ Utilisateurs actifs chute > 50% → Rollback

🟠 HAUTE (Investigation rapide):
├─ Error rate > 2% → Analyse logs + préparation rollback
├─ Performance dégradée > 30% → Investigation
├─ Nouvelles erreurs types → Analyse stack traces
└─ Feedback négatif utilisateurs → Évaluation impact

🟡 MOYENNE (Suivi):
├─ Légère hausse erreurs (< 2%) → Logs + monitoring
├─ Performance variable → Attendre stabilisation
└─ Comportement inattendu non-bloquant → Documentation

PROCÉDURE:
Si 2+ alertes CRITIQUES → ROLLBACK AUTOMATIQUE
Si alertes HAUTE persistent > 15min → Décision rollback
```

---

## Troubleshooting

### 🔍 Problèmes Courants

#### 1. Déploiement Échoue (Build Error)

```bash
SYMPTÔME: GitHub Actions fail, build errors

DIAGNOSTIC:
# Vérifier logs GitHub Actions
# Section "Build Application"

CAUSES FRÉQUENTES:
• Dépendance manquante (package.json)
  ➜ Solution: npm install, commit package-lock.json
  
• Variable environnement manquante
  ➜ Solution: Ajouter dans GitHub Secrets
  
• TypeScript errors
  ➜ Solution: Corriger erreurs localement
  ➜ npm run type-check
  
• Import invalide
  ➜ Solution: Vérifier chemins imports
  ➜ Build local pour reproduire

RÉSOLUTION:
1. Fix erreur localement
2. Commit + push
3. Pipeline redemarre automatiquement
```

#### 2. Application Déployée Mais Inaccessible

```bash
SYMPTÔME: 404 ou 502 Bad Gateway

DIAGNOSTIC:
curl -I https://app.distri-night.ci
# Analyser response code

CAUSES FRÉQUENTES:
• DNS pas encore propagé
  ➜ Solution: Attendre 5-10 minutes
  ➜ Vérifier: dig app.distri-night.ci
  
• Certificat SSL invalide
  ➜ Solution: Vercel auto-renewal, vérifier dashboard
  
• Déploiement partiel
  ➜ Solution: Vérifier Vercel deployment status
  
• CDN cache obsolète
  ➜ Solution: Purge cache CloudFlare

RÉSOLUTION:
1. Vérifier Vercel deployment status
2. Si "Ready", tester direct: xxx.vercel.app
3. Si fonctionne: Problème DNS/CDN
4. Purge cache + wait propagation
```

#### 3. Performance Dégradée Post-Déploiement

```bash
SYMPTÔME: Application lente, timeouts

DIAGNOSTIC:
# Vérifier métriques Vercel
# Analyser logs Edge Functions
# Vérifier Supabase Dashboard (connections, queries)

CAUSES FRÉQUENTES:
• Cold start Edge Functions
  ➜ Solution: Normal 1ère requête, puis cache
  
• Requête DB non-optimisée
  ➜ Solution: Analyser query plan
  ➜ EXPLAIN ANALYZE [query]
  
• Trop de données chargées
  ➜ Solution: Pagination, lazy loading
  
• Assets non-optimisés
  ➜ Solution: Vérifier bundle size, images

RÉSOLUTION:
1. Identifier goulot (frontend vs backend)
2. Si backend: Optimiser queries
3. Si frontend: Code splitting, optimization
4. Si persistant: Rollback + investigation approfondie
```

---

## Checklists

### ✅ Checklist Déploiement Production

```
AVANT DÉPLOIEMENT:
☐ Tous tests passent (unit + integration + E2E)
☐ Code review approuvé (minimum 1 reviewer)
☐ Pas de security vulnerabilities
☐ Documentation mise à jour
☐ CHANGELOG.md mis à jour
☐ Version bumped (package.json)
☐ Backup database récent (< 24h)
☐ Équipe notifiée (Slack)
☐ Plan rollback documenté

PENDANT DÉPLOIEMENT:
☐ Monitoring dashboard ouvert
☐ Logs en temps réel activés
☐ Équipe support alertée
☐ Communication préparée (si incident)

APRÈS DÉPLOIEMENT:
☐ Health checks passés
☐ Smoke tests passés
☐ Métriques normales (15 min observation)
☐ Pas d'alertes critiques
☐ Feedback utilisateurs OK
☐ Documentation interne mise à jour
☐ Annonce déploiement (Slack, clients si feature majeure)
☐ Post-mortem si incident (dans les 24h)
```

### ✅ Checklist Rollback

```
DÉCISION ROLLBACK:
☐ Critères rollback rencontrés? (voir matrice alertes)
☐ Manager/CTO notifié?
☐ Équipe technique mobilisée?

EXÉCUTION ROLLBACK:
☐ Méthode choisie (Vercel Dashboard / CLI / Git)
☐ Rollback code effectué
☐ Rollback database si nécessaire
☐ Health checks post-rollback
☐ Métriques revenues à la normale?

POST-ROLLBACK:
☐ Communication utilisateurs (si impact visible)
☐ Investigation cause racine
☐ Documentation incident
☐ Post-mortem planifié (24-48h)
☐ Correctifs appliqués
☐ Tests additionnels avant re-tentative
```

---

## 📞 Contacts Déploiement

```
ÉQUIPE DEVOPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lead DevOps:         +225 XX XX XX XX XX
Tech Lead:           +225 XX XX XX XX XX
CTO:                 +225 XX XX XX XX XX

ASTREINTE DÉPLOIEMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Semaine en cours:    +225 XX XX XX XX XX

SUPPORT FOURNISSEURS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vercel Support:      support@vercel.com
Supabase Support:    support@supabase.io
GitHub Support:      support@github.com
```

---

**Document maintenu par:** Équipe DevOps DISTRI-NIGHT  
**Dernière mise à jour:** Novembre 2025  
**Prochaine révision:** Janvier 2026

---

*Ce guide de déploiement garantit des mises à jour fiables, rapides et sans interruption de service pour la plateforme DISTRI-NIGHT.*

**🚀 DISTRI-NIGHT - Déploiement Continue de Classe Mondiale**
