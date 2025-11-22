# 🔒 GUIDE DE SÉCURITÉ - DISTRI-NIGHT

**Politique de Sécurité et Audit Trail**  
**Version:** 1.0.0  
**Date:** Novembre 2025  
**Classification:** Confidentiel - Sécurité

---

## 📑 Table des Matières

1. [Politique de Sécurité](#politique-de-sécurité)
2. [Authentification et Autorisation](#authentification-et-autorisation)
3. [Sécurité des Données](#sécurité-des-données)
4. [Sécurité Réseau](#sécurité-réseau)
5. [Gestion des Secrets](#gestion-des-secrets)
6. [Audit et Logging](#audit-et-logging)
7. [Conformité RGPD](#conformité-rgpd)
8. [Incident Response](#incident-response)
9. [Tests de Sécurité](#tests-de-sécurité)
10. [Formation et Sensibilisation](#formation-et-sensibilisation)

---

## Politique de Sécurité

### 🎯 Objectifs de Sécurité

| Objectif | Description | Priorité |
|----------|-------------|----------|
| **Confidentialité** | Protection données sensibles utilisateurs | 🔴 Critique |
| **Intégrité** | Données fiables et non-altérées | 🔴 Critique |
| **Disponibilité** | Service accessible 99.9% du temps | 🟠 Haute |
| **Traçabilité** | Audit complet des actions | 🟠 Haute |
| **Non-répudiation** | Actions non-contestables | 🟡 Moyenne |

### 🛡️ Principes de Sécurité

```
┌────────────────────────────────────────────────────────┐
│         PRINCIPES FONDAMENTAUX SÉCURITÉ                │
└────────────────────────────────────────────────────────┘

1. DEFENSE IN DEPTH (Défense en Profondeur)
   ├─ Multiples couches de sécurité
   ├─ Pas de point unique de défaillance
   └─ Segmentation des accès

2. LEAST PRIVILEGE (Moindre Privilège)
   ├─ Accès minimum nécessaire
   ├─ Révision régulière permissions
   └─ Expiration automatique accès temporaires

3. SECURITY BY DESIGN (Sécurité dès la Conception)
   ├─ Sécurité intégrée dès le début
   ├─ Revue code sécurité obligatoire
   └─ Threat modeling pour nouvelles features

4. ZERO TRUST (Confiance Zéro)
   ├─ Vérifier chaque requête
   ├─ Ne jamais faire confiance implicitement
   └─ Authentification continue

5. FAIL SECURE (Échec Sécurisé)
   ├─ En cas d'erreur: bloquer, pas autoriser
   ├─ Logs détaillés des échecs
   └─ Alertes automatiques anomalies

6. SEPARATION OF DUTIES (Séparation des Tâches)
   ├─ Actions critiques nécessitent validation
   ├─ Pas de super-utilisateur unique
   └─ Audit trail complet
```

### 📋 Niveaux de Classification

```
CLASSIFICATION DES DONNÉES:

┌─────────────┬──────────────────────────────────────────┐
│  NIVEAU     │  EXEMPLES & PROTECTIONS                  │
├─────────────┼──────────────────────────────────────────┤
│ 🔴 CRITIQUE │ • Mots de passe hashés (bcrypt)         │
│             │ • Tokens JWT/API                         │
│             │ • Clés de chiffrement                    │
│             │ • Données bancaires                      │
│             │ Protection: Chiffrement + HSM + Rotation │
├─────────────┼──────────────────────────────────────────┤
│ 🟠 SENSIBLE │ • Données personnelles (PII)             │
│             │ • Adresses complètes                     │
│             │ • Numéros téléphone                      │
│             │ • Historiques commandes                  │
│             │ Protection: Chiffrement + RLS + Logs     │
├─────────────┼──────────────────────────────────────────┤
│ 🟡 INTERNE  │ • Métriques business                     │
│             │ • Logs applicatifs                       │
│             │ • Configurations internes                │
│             │ Protection: Accès restreint + Audit      │
├─────────────┼──────────────────────────────────────────┤
│ 🟢 PUBLIC   │ • Catalogue produits                     │
│             │ • Documentation publique                 │
│             │ • Page d'accueil                         │
│             │ Protection: Rate limiting + Cache        │
└─────────────┴──────────────────────────────────────────┘
```

---

## Authentification et Autorisation

### 🔐 Architecture Authentification

```
┌──────────────────────────────────────────────────────────┐
│            FLUX AUTHENTIFICATION COMPLET                 │
└──────────────────────────────────────────────────────────┘

1. LOGIN REQUEST
   │
   │  Email + Password
   ▼
┌─────────────────────────────┐
│  Frontend Validation        │
│  • Email format valid       │
│  • Password length >= 8     │
│  • Rate limit check         │
└──────────┬──────────────────┘
           │
           │ HTTPS (TLS 1.3)
           ▼
┌─────────────────────────────┐
│  Supabase Auth Service      │
│  • Lookup user by email     │
│  • Verify bcrypt hash       │
│  • Check account status     │
│    (active, suspended?)     │
└──────────┬──────────────────┘
           │
           ▼
      [SUCCESS]
           │
┌──────────┴──────────────────┐
│  Generate JWT Tokens        │
│  • Access Token (1h)        │
│  • Refresh Token (7d)       │
│  • Include: user_id, role   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Set Secure Cookies         │
│  • HttpOnly flag            │
│  • Secure flag              │
│  • SameSite=Strict          │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Log Successful Auth        │
│  • Timestamp                │
│  • IP Address               │
│  • User Agent               │
│  • Device fingerprint       │
└─────────────────────────────┘

2. SUBSEQUENT REQUESTS
   │
   │  Request + JWT Token
   ▼
┌─────────────────────────────┐
│  Token Validation           │
│  • Signature valid?         │
│  • Not expired?             │
│  • Not blacklisted?         │
└──────────┬──────────────────┘
           │
           ▼
      [VALID]
           │
┌──────────┴──────────────────┐
│  Extract User Context       │
│  • user_id                  │
│  • role (client/supplier)   │
│  • permissions              │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Apply RLS Policies         │
│  • Filter data by user      │
│  • Enforce permissions      │
└─────────────────────────────┘
```

### 👤 Gestion des Rôles (RBAC)

```
┌──────────────────────────────────────────────────────────┐
│         ROLE-BASED ACCESS CONTROL (RBAC)                 │
└──────────────────────────────────────────────────────────┘

RÔLES DÉFINIS:

┌─────────────────────────────────────────────────────────┐
│  ADMIN (Administrateur Plateforme)                       │
├─────────────────────────────────────────────────────────┤
│  Permissions:                                            │
│  ✓ Approuver/Rejeter utilisateurs                       │
│  ✓ Modifier paramètres globaux (commissions)            │
│  ✓ Voir toutes les commandes                            │
│  ✓ Générer rapports financiers                          │
│  ✓ Suspendre comptes                                    │
│  ✓ Accès logs et audit trail                            │
│  ✓ Gérer zones de livraison                             │
│  ✗ Passer commandes pour clients                        │
│  ✗ Créer offres pour fournisseurs                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CLIENT (Gérant Bar/Maquis/Restaurant)                   │
├─────────────────────────────────────────────────────────┤
│  Permissions:                                            │
│  ✓ Voir catalogue produits                              │
│  ✓ Créer commandes                                      │
│  ✓ Voir ses propres commandes                           │
│  ✓ Accepter/Refuser offres reçues                       │
│  ✓ Payer commandes                                      │
│  ✓ Évaluer fournisseurs                                 │
│  ✓ Modifier son profil                                  │
│  ✗ Voir autres clients                                  │
│  ✗ Modifier prix produits                               │
│  ✗ Accès administration                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SUPPLIER (Fournisseur/Dépôt)                            │
├─────────────────────────────────────────────────────────┤
│  Permissions:                                            │
│  ✓ Voir commandes de sa zone                            │
│  ✓ Créer offres                                         │
│  ✓ Gérer ses offres (retirer)                           │
│  ✓ Mettre à jour statuts (prépare, livre)              │
│  ✓ Gérer catalogue produits                             │
│  ✓ Voir historique ses livraisons                       │
│  ✓ Évaluer clients                                      │
│  ✗ Voir offres autres fournisseurs                      │
│  ✗ Modifier commissions                                 │
│  ✗ Voir données financières globales                    │
└─────────────────────────────────────────────────────────┘

MATRICE PERMISSIONS DÉTAILLÉE:

Action                    │ Admin │ Client │ Supplier
──────────────────────────┼───────┼────────┼─────────
profiles (view all)       │   ✓   │   ✗    │    ✗
profiles (approve)        │   ✓   │   ✗    │    ✗
products (view)           │   ✓   │   ✓    │    ✓
products (create)         │   ✓   │   ✗    │    ✓
orders (view all)         │   ✓   │   ✗    │    ✗
orders (view own)         │   ✓   │   ✓    │    ✓
orders (create)           │   ✗   │   ✓    │    ✗
offers (create)           │   ✗   │   ✗    │    ✓
offers (accept)           │   ✗   │   ✓    │    ✗
ratings (create)          │   ✗   │   ✓    │    ✓
settings (modify)         │   ✓   │   ✗    │    ✗
audit_logs (view)         │   ✓   │   ✗    │    ✗
```

### 🔑 Politique de Mots de Passe

```
┌──────────────────────────────────────────────────────┐
│           EXIGENCES MOTS DE PASSE                     │
└──────────────────────────────────────────────────────┘

COMPLEXITÉ REQUISE:
✓ Longueur minimale: 8 caractères
✓ Au moins 1 majuscule (A-Z)
✓ Au moins 1 minuscule (a-z)
✓ Au moins 1 chiffre (0-9)
✓ Au moins 1 caractère spécial (!@#$%^&*)
✗ Pas de mots du dictionnaire communs
✗ Pas de patterns simples (123456, abcdef)
✗ Pas d'informations personnelles (nom, date naissance)

VALIDATION EXEMPLE:
❌ "password"      → Trop simple
❌ "12345678"      → Pas de lettres
❌ "abcd1234"      → Pas de majuscule/spécial
✅ "Admin@2025!"   → Valide ✓
✅ "Client#2025"   → Valide ✓

STOCKAGE:
• Algorithme: bcrypt (cost factor 12)
• Salt: Unique par utilisateur (auto-généré)
• Jamais stocké en clair
• Jamais loggé

POLITIQUE:
• Expiration: 90 jours (admins), 365 jours (users)
• Historique: 5 derniers mots de passe interdits
• Reset: Lien valide 1 heure uniquement
• Tentatives: Max 5 échecs → Blocage 15 minutes
• MFA: Obligatoire pour admins (prévu)
```

### 🚫 Protection Contre les Attaques

```
┌──────────────────────────────────────────────────────┐
│        MÉCANISMES DE PROTECTION ACTIFS               │
└──────────────────────────────────────────────────────┘

1. BRUTE FORCE PROTECTION
   ├─ Rate Limiting: 5 tentatives / 15 minutes
   ├─ IP Blocking: Automatique après 10 échecs
   ├─ CAPTCHA: Après 3 échecs consécutifs
   └─ Alertes: Email admin si attaque détectée

2. SQL INJECTION PREVENTION
   ├─ Requêtes paramétrées (Prepared Statements)
   ├─ ORM Supabase (validation auto)
   ├─ Input validation stricte
   └─ RLS (Row Level Security) PostgreSQL

3. XSS (Cross-Site Scripting) PREVENTION
   ├─ React auto-escaping (dangerouslySetInnerHTML interdit)
   ├─ Content Security Policy (CSP) headers
   ├─ Sanitization inputs utilisateur
   └─ HTTP-only cookies (pas accessible JavaScript)

4. CSRF (Cross-Site Request Forgery) PREVENTION
   ├─ JWT tokens (pas de cookies session simples)
   ├─ SameSite=Strict cookies
   ├─ Origin/Referer validation
   └─ Double-submit cookie pattern

5. CLICKJACKING PREVENTION
   ├─ X-Frame-Options: DENY
   ├─ Content-Security-Policy: frame-ancestors 'none'
   └─ Transparent overlay detection

6. DOS/DDOS PROTECTION
   ├─ Cloudflare (Layer 3/4/7 protection)
   ├─ Rate limiting global: 100 req/min/IP
   ├─ Connection limits
   └─ Auto-scaling (absorbe pics trafic)
```

---

## Sécurité des Données

### 🔐 Chiffrement

```
┌──────────────────────────────────────────────────────┐
│            STRATÉGIE DE CHIFFREMENT                   │
└──────────────────────────────────────────────────────┘

CHIFFREMENT EN TRANSIT:
┌────────────────────────────────────────┐
│  TLS 1.3 (Transport Layer Security)   │
├────────────────────────────────────────┤
│  • Protocol: TLS 1.3 (TLS 1.2 minimum) │
│  • Cipher Suites: ECDHE-RSA-AES256-GCM │
│  • Certificate: Let's Encrypt (Auto)   │
│  • HSTS: Max-Age 31536000 (1 an)      │
│  • Certificate Pinning: Mobile apps    │
└────────────────────────────────────────┘

CHIFFREMENT AU REPOS:
┌────────────────────────────────────────┐
│  AES-256 (Advanced Encryption Std)    │
├────────────────────────────────────────┤
│  • Database: AES-256-CBC (Supabase)   │
│  • Backups: AES-256-GCM + compression  │
│  • Logs: AES-256 avant archivage       │
│  • Files: S3 Server-Side Encryption    │
│  • Key Management: AWS KMS / Vault     │
└────────────────────────────────────────┘

CHIFFREMENT APPLICATION:
┌────────────────────────────────────────┐
│  Données Sensibles Additionnelles      │
├────────────────────────────────────────┤
│  • Passwords: bcrypt (cost 12)        │
│  • JWT Tokens: HMAC-SHA256             │
│  • API Keys: SHA-256 hashed            │
│  • PII: AES-256 (champ-level)          │
└────────────────────────────────────────┘

ROTATION DES CLÉS:
• Automatique tous les 90 jours
• Manuelle en cas de compromission
• Historique conservé (déchiffrement ancien)
• Zero-downtime rotation
```

### 🗄️ Row Level Security (RLS)

```sql
-- EXEMPLES POLITIQUES RLS (PostgreSQL)

-- TABLE: profiles
-- Politique: Les utilisateurs ne voient que les profils approuvés
CREATE POLICY "Public profiles are viewable by authenticated users"
ON profiles FOR SELECT
USING (
  auth.role() = 'authenticated' 
  AND approved = true
);

-- Politique: Les utilisateurs modifient seulement leur profil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- TABLE: orders
-- Politique: Clients voient uniquement leurs commandes
CREATE POLICY "Clients see own orders"
ON orders FOR SELECT
USING (
  (auth.uid() = client_id) OR
  (auth.uid() = supplier_id AND supplier_id IS NOT NULL) OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

-- TABLE: offers
-- Politique: Fournisseurs voient uniquement leurs offres
CREATE POLICY "Suppliers see own offers"
ON offers FOR SELECT
USING (
  (auth.uid() = supplier_id) OR
  (EXISTS (
    SELECT 1 FROM orders 
    WHERE id = offers.order_id AND client_id = auth.uid()
  )) OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

-- TABLE: products
-- Politique: Fournisseurs modifient uniquement leurs produits
CREATE POLICY "Suppliers update own products"
ON products FOR UPDATE
USING (
  (auth.uid() = supplier_id) OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
);

-- AVANTAGES RLS:
-- ✓ Sécurité au niveau base de données (pas contournable)
-- ✓ Automatique sur toutes requêtes
-- ✓ Performance optimisée (index-aware)
-- ✓ Testable et auditable
```

### 🛡️ Anonymisation et Masquage

```
STRATÉGIES ANONYMISATION:

1. MASQUAGE DYNAMIQUE (Production)
   ┌─────────────────────────────────────────────┐
   │ Données Originales  │  Données Masquées     │
   ├─────────────────────┼───────────────────────┤
   │ Email: john@xyz.ci  │  j***@xyz.ci          │
   │ Tél: +225 07 XX...  │  +225 07 XX XX XX 45  │
   │ Adresse: 123 Rue... │  ****** Cocody        │
   │ Nom: Jean Kouassi   │  J*** K******         │
   └─────────────────────┴───────────────────────┘
   
   Application: Logs, Reports non-admins

2. ANONYMISATION COMPLÈTE (Dev/Staging)
   ┌─────────────────────────────────────────────┐
   │ Production          │  Dev/Staging          │
   ├─────────────────────┼───────────────────────┤
   │ Jean Kouassi        │  User_12345           │
   │ +225 07 12 34 56    │  +225 00 00 00 01     │
   │ jean@real.ci        │  user12345@test.ci    │
   │ Cocody, Abidjan     │  Zone A, City         │
   └─────────────────────┴───────────────────────┘
   
   Application: Environnements non-production

3. SUPPRESSION RGPD (Droit à l'oubli)
   ┌─────────────────────────────────────────────┐
   │ Action              │  Implémentation       │
   ├─────────────────────┼───────────────────────┤
   │ Données compte      │  ANONYMISÉ (pas delete)│
   │ Commandes           │  user_id → NULL       │
   │ Ratings             │  user_id → NULL       │
   │ Logs (audit)        │  CONSERVÉS (légal)    │
   └─────────────────────┴───────────────────────┘
   
   Délai: 30 jours (vérification légale)
```

---

## Sécurité Réseau

### 🌐 Architecture Sécurité Réseau

```
┌──────────────────────────────────────────────────────────┐
│              COUCHES DE SÉCURITÉ RÉSEAU                   │
└──────────────────────────────────────────────────────────┘

INTERNET
    │
    │ Attaques DDoS, Bots, Scanners
    ▼
┌─────────────────────────────────────┐
│  CLOUDFLARE (CDN + WAF)             │  LAYER 7
│  • DDoS Protection (140 Tbps)       │
│  • Bot Management                   │
│  • Rate Limiting                    │
│  • Geo-blocking (si nécessaire)     │
│  • SSL/TLS Termination              │
└──────────────┬──────────────────────┘
               │ Traffic Légitime
               ▼
┌─────────────────────────────────────┐
│  VERCEL EDGE NETWORK                │  LAYER 4-7
│  • Auto-scaling                     │
│  • Health Checks                    │
│  • Failover automatique             │
│  • Logs & Monitoring                │
└──────────────┬──────────────────────┘
               │ Requêtes Validées
               ▼
┌─────────────────────────────────────┐
│  APPLICATION (Frontend)             │  LAYER 7
│  • CORS Policy (whitelist origins)  │
│  • CSP Headers                      │
│  • Input Validation                 │
│  • JWT Validation                   │
└──────────────┬──────────────────────┘
               │ API Calls
               ▼
┌─────────────────────────────────────┐
│  SUPABASE (Backend)                 │  LAYER 7
│  • API Gateway                      │
│  • Authentication                   │
│  • Rate Limiting (per user)         │
│  • Request Validation               │
└──────────────┬──────────────────────┘
               │ Database Queries
               ▼
┌─────────────────────────────────────┐
│  POSTGRESQL (Database)              │  LAYER 7
│  • RLS Policies                     │
│  • Encryption at Rest               │
│  • Connection Pooling               │
│  • Query Timeout (30s max)          │
└─────────────────────────────────────┘
```

### 🔥 Firewall Rules

```
┌──────────────────────────────────────────────────────┐
│              RÈGLES FIREWALL ACTIVES                  │
└──────────────────────────────────────────────────────┘

INBOUND RULES (Entrantes):
┌────────┬──────┬───────────┬────────────┬─────────────┐
│ Port   │ Proto│ Source    │ Destination│ Action      │
├────────┼──────┼───────────┼────────────┼─────────────┤
│ 443    │ TCP  │ ANY       │ Frontend   │ ALLOW (HTTPS)│
│ 80     │ TCP  │ ANY       │ Frontend   │ REDIRECT 443│
│ 5432   │ TCP  │ App Only  │ Database   │ ALLOW       │
│ 22     │ TCP  │ DENY ALL  │ ANY        │ DENY (SSH)  │
│ 3389   │ TCP  │ DENY ALL  │ ANY        │ DENY (RDP)  │
│ *      │ *    │ ANY       │ ANY        │ DENY (Default)│
└────────┴──────┴───────────┴────────────┴─────────────┘

OUTBOUND RULES (Sortantes):
┌────────┬──────┬───────────┬────────────┬─────────────┐
│ Port   │ Proto│ Source    │ Destination│ Action      │
├────────┼──────┼───────────┼────────────┼─────────────┤
│ 443    │ TCP  │ App       │ Supabase   │ ALLOW       │
│ 443    │ TCP  │ App       │ APIs Ext.  │ ALLOW       │
│ 25     │ TCP  │ App       │ SMTP       │ ALLOW       │
│ *      │ *    │ App       │ Internal   │ ALLOW       │
│ *      │ *    │ App       │ Internet   │ LOG & REVIEW│
└────────┴──────┴───────────┴────────────┴─────────────┘

RATE LIMITING:
• Global: 100 requests/minute/IP
• API: 60 requests/minute/user
• Auth: 5 attempts/15 minutes/IP
• Signup: 3 attempts/hour/IP
```

### 🔒 Headers de Sécurité

```javascript
// Configuration Headers Sécurité (Vercel)

// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(self)"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co"
        }
      ]
    }
  ]
}

// EXPLICATIONS:
// - HSTS: Force HTTPS, pas de downgrade
// - X-Frame-Options: Empêche clickjacking
// - X-Content-Type: Empêche MIME sniffing
// - CSP: Whitelist sources autorisées
// - Permissions-Policy: Limite APIs navigateur
```

---

## Gestion des Secrets

### 🔐 Stockage Sécurisé

```
┌──────────────────────────────────────────────────────┐
│           GESTION DES SECRETS (Secrets)              │
└──────────────────────────────────────────────────────┘

HIÉRARCHIE STOCKAGE:

1. PRODUCTION SECRETS
   ├─ Plateforme: GitHub Secrets (chiffrés)
   ├─ Accès: Admin DevOps uniquement
   ├─ Rotation: Automatique 90 jours
   └─ Exemples:
      • VITE_SUPABASE_URL
      • VITE_SUPABASE_ANON_KEY
      • SUPABASE_SERVICE_ROLE_KEY
      • VERCEL_TOKEN
      • SLACK_WEBHOOK_URL

2. STAGING SECRETS
   ├─ Plateforme: GitHub Secrets (séparés Prod)
   ├─ Accès: Dev Team
   ├─ Rotation: Manuel (ou 90 jours)
   └─ Valeurs différentes de Production

3. DEVELOPMENT SECRETS
   ├─ Fichier: .env.local (gitignored)
   ├─ Accès: Développeurs
   ├─ Valeurs: Test uniquement
   └─ Template: .env.example (committé)

INTERDICTIONS STRICTES:
❌ Jamais committer secrets dans Git
❌ Jamais logger secrets (même partiel)
❌ Jamais envoyer secrets par email/chat
❌ Jamais hardcoder dans code source
❌ Jamais partager entre environnements
❌ Jamais utiliser secrets prod pour dev

BONNE PRATIQUES:
✅ Rotation régulière (90 jours max)
✅ Principe du moindre privilège
✅ Audit trail accès secrets
✅ Chiffrement au repos
✅ Expiration automatique
✅ Alertes sur accès anormaux
```

### 🔄 Rotation des Secrets

```bash
# PROCÉDURE ROTATION SECRETS (Exemple: Supabase Keys)

# ÉTAPE 1: Génération Nouvelle Clé
# Via Supabase Dashboard:
# Settings → API → Generate new anon key

# ÉTAPE 2: Mise à Jour GitHub Secrets
# GitHub → Repository → Settings → Secrets → Actions
# Edit: VITE_SUPABASE_ANON_KEY
# Nouvelle valeur: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ÉTAPE 3: Déploiement Graduel
# 1. Deploy Staging (test avec nouvelle clé)
vercel --prod=false

# 2. Validation fonctionnelle
npm run test:e2e -- --env=staging

# 3. Deploy Production (si tests OK)
git push origin main  # CI/CD auto-deploy

# ÉTAPE 4: Révocation Ancienne Clé
# Attendre 24h (laisser temps propagation)
# Supabase Dashboard → Revoke old key

# ÉTAPE 5: Monitoring
# Surveiller logs erreurs auth (24-48h)
# Vérifier aucun service utilise ancienne clé

# FRÉQUENCE ROTATION:
# • Clés API: 90 jours
# • JWT Secrets: 180 jours
# • Service Role Keys: 365 jours
# • Urgence: Immédiat si compromission suspectée
```

---

## Audit et Logging

### 📝 Stratégie de Logging

```
┌──────────────────────────────────────────────────────┐
│              NIVEAUX DE LOGGING                       │
└──────────────────────────────────────────────────────┘

CRITICAL (Critique - Alerte immédiate)
├─ Faille sécurité détectée
├─ Panne système majeure
├─ Corruption données
└─ Notification: SMS + Email + PagerDuty

ERROR (Erreur - Action requise)
├─ Exception non-gérée
├─ Échec transaction importante
├─ Service externe indisponible
└─ Notification: Email + Slack

WARNING (Avertissement - Surveillance)
├─ Performance dégradée
├─ Taux d'erreur élevé
├─ Ressources système > 80%
└─ Notification: Slack

INFO (Information - Audit)
├─ Actions utilisateurs importantes
├─ Déploiements
├─ Configuration changes
└─ Notification: Logs uniquement

DEBUG (Débogage - Développement)
├─ Détails exécution code
├─ Variables, stack traces
├─ Requêtes DB
└─ Notification: Dev environment seulement
```

### 🔍 Audit Trail

```sql
-- TABLE: user_activity_log (Audit Trail)
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- INDEX pour performance
CREATE INDEX idx_activity_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_action ON user_activity_log(action, created_at DESC);
CREATE INDEX idx_activity_resource ON user_activity_log(resource_type, resource_id);

-- EXEMPLES D'ÉVÉNEMENTS LOGGÉS:

-- Authentification
INSERT INTO user_activity_log (user_id, action, details, ip_address)
VALUES ('user-uuid', 'LOGIN_SUCCESS', '{"role": "client"}', '41.202.x.x');

INSERT INTO user_activity_log (user_id, action, details, ip_address)
VALUES (NULL, 'LOGIN_FAILED', '{"email": "***@***.ci", "reason": "invalid_password"}', '41.202.x.x');

-- Actions Critiques
INSERT INTO user_activity_log (user_id, action, resource_type, resource_id, details)
VALUES ('admin-uuid', 'USER_APPROVED', 'profile', 'profile-uuid', '{"business_name": "Bar XYZ"}');

INSERT INTO user_activity_log (user_id, action, resource_type, resource_id, details)
VALUES ('admin-uuid', 'COMMISSION_CHANGED', 'settings', 'setting-uuid', '{"old": 2.0, "new": 2.5}');

-- Commandes
INSERT INTO user_activity_log (user_id, action, resource_type, resource_id, details)
VALUES ('client-uuid', 'ORDER_CREATED', 'order', 'order-uuid', '{"total": 100000, "items": 5}');

INSERT INTO user_activity_log (user_id, action, resource_type, resource_id, details)
VALUES ('supplier-uuid', 'OFFER_CREATED', 'offer', 'offer-uuid', '{"order_id": "order-uuid", "amount": 98000}');

-- RÉTENTION:
-- • 1 an: Logs normaux
-- • 7 ans: Logs financiers (légal Côte d'Ivoire)
-- • Permanent: Incidents sécurité
```

### 📊 Rapports d'Audit

```
RAPPORTS AUTOMATIQUES GÉNÉRÉS:

QUOTIDIEN (Envoyé 8h GMT):
├─ Nombre authentifications réussies/échouées
├─ Top 10 IPs actives
├─ Nouvelles inscriptions
├─ Actions administratives
└─ Anomalies détectées

HEBDOMADAIRE (Lundi 9h GMT):
├─ Synthèse activité utilisateurs
├─ Modifications configuration système
├─ Incidents sécurité (si aucun: rapport vide)
├─ Tendances d'utilisation
└─ Recommandations sécurité

MENSUEL (1er du mois 10h GMT):
├─ Audit sécurité complet
├─ Conformité RGPD (demandes reçues/traitées)
├─ Revue accès privilégiés
├─ Tests de pénétration (si effectués)
└─ Plan d'action mois suivant

DESTINATAIRES:
• Quotidien: Admin DevOps
• Hebdomadaire: Management + Security Officer
• Mensuel: Board + Compliance + Legal
```

---

## Conformité RGPD

### 📋 Principes RGPD Appliqués

```
┌──────────────────────────────────────────────────────┐
│          CONFORMITÉ RGPD (EU + AFRIQUE)              │
└──────────────────────────────────────────────────────┘

1. LAWFULNESS, FAIRNESS, TRANSPARENCY (Licéité)
   ✅ Consentement explicite à l'inscription
   ✅ Politique confidentialité accessible
   ✅ Notifications claires utilisation données
   ✅ Pas de données cachées collectées

2. PURPOSE LIMITATION (Limitation des finalités)
   ✅ Données collectées pour commandes uniquement
   ✅ Pas de revente données tiers
   ✅ Marketing uniquement si opt-in
   ✅ Finalités documentées et communiquées

3. DATA MINIMISATION (Minimisation)
   ✅ Seulement données nécessaires collectées
   ✅ Pas de données "nice to have"
   ✅ Formulaires limités au strict minimum
   ✅ Review régulière champs collectés

4. ACCURACY (Exactitude)
   ✅ Utilisateurs peuvent corriger leurs données
   ✅ Validation temps réel (email, téléphone)
   ✅ Processus suppression données incorrectes
   ✅ Mise à jour facilitée via profil

5. STORAGE LIMITATION (Limitation de conservation)
   ✅ 3 ans max données inactives
   ✅ 7 ans données financières (légal)
   ✅ Suppression automatique après délais
   ✅ Archive vs Suppression (selon catégorie)

6. INTEGRITY & CONFIDENTIALITY (Intégrité)
   ✅ Chiffrement (transit + repos)
   ✅ Accès restreints (RLS)
   ✅ Audit trail complet
   ✅ Tests sécurité réguliers

7. ACCOUNTABILITY (Responsabilité)
   ✅ DPO (Data Protection Officer) désigné
   ✅ Documentation complète
   ✅ Registre traitements
   ✅ Procédures incident ready
```

### 👤 Droits Utilisateurs RGPD

```
┌──────────────────────────────────────────────────────┐
│            DROITS UTILISATEURS IMPLÉMENTÉS           │
└──────────────────────────────────────────────────────┘

1. DROIT D'ACCÈS (Article 15)
   Interface: Profil → Télécharger mes données
   Format: JSON complet
   Délai: Immédiat (auto-généré)
   Contenu:
   ├─ Profil utilisateur
   ├─ Historique commandes
   ├─ Évaluations données/reçues
   ├─ Logs activité (90 derniers jours)
   └─ Préférences communication

2. DROIT DE RECTIFICATION (Article 16)
   Interface: Profil → Modifier mes informations
   Délai: Immédiat
   Champs modifiables:
   ├─ Nom, Business name
   ├─ Téléphone
   ├─ Adresse
   └─ Zone livraison (validation admin)

3. DROIT À L'EFFACEMENT "Droit à l'oubli" (Article 17)
   Interface: Profil → Supprimer mon compte
   Processus:
   ├─ 1. Demande utilisateur (confirmation double)
   ├─ 2. Validation identité (password + code SMS)
   ├─ 3. Période réflexion 30 jours (annulable)
   ├─ 4. Anonymisation données (pas suppression totale)
   ├─ 5. Conservation logs audit (obligation légale)
   Délai: 30 jours
   Exceptions: Données financières (7 ans légal)

4. DROIT À LA PORTABILITÉ (Article 20)
   Interface: Profil → Exporter mes données
   Formats disponibles:
   ├─ JSON (complet, machine-readable)
   ├─ CSV (commandes, produits)
   └─ PDF (rapport lisible)
   Délai: Immédiat

5. DROIT D'OPPOSITION (Article 21)
   Interface: Profil → Préférences Communication
   Options:
   ├─ Marketing emails: OPT-OUT
   ├─ SMS promotionnels: OPT-OUT
   ├─ Notifications push: OPT-OUT
   └─ (Notifications transactionnelles: obligatoires)

6. DROIT DE LIMITATION DU TRAITEMENT (Article 18)
   Interface: Support (demande manuelle)
   Cas:
   ├─ Contestation exactitude données
   ├─ Opposition traitement
   └─ Besoin conservation pour défense droits
   Délai: 48h (évaluation légale)

DÉLAIS RÉPONSE:
• Automatique: Immédiat
• Support L1: 48 heures
• Legal Review: 30 jours maximum (RGPD)
```

### 🔒 Data Protection Officer (DPO)

```
CONTACT DPO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: dpo@distri-night.ci
Téléphone: +225 XX XX XX XX XX
Adresse: Abidjan, Côte d'Ivoire

RESPONSABILITÉS DPO:
├─ Conseiller organisation RGPD
├─ Contrôler conformité
├─ Point de contact autorité (ARTCI CI)
├─ Sensibiliser équipes
├─ Gérer violations données (breach)
└─ Tenir registre traitements

REGISTRE DES TRAITEMENTS (Extrait):
┌─────────────┬──────────────┬─────────────┬──────────┐
│ Traitement  │ Finalité     │ Base légale │Rétention │
├─────────────┼──────────────┼─────────────┼──────────┤
│ Auth users  │ Authentif.   │ Contrat     │ 3 ans    │
│ Orders      │ Transaction  │ Contrat     │ 7 ans    │
│ Ratings     │ Qualité      │ Intérêt lég.│ 2 ans    │
│ Analytics   │ Amélioration │ Consentement│ 1 an     │
│ Logs        │ Sécurité     │ Intérêt lég.│ 1 an     │
└─────────────┴──────────────┴─────────────┴──────────┘
```

---

## Incident Response

### 🚨 Plan de Réponse aux Incidents

```
┌──────────────────────────────────────────────────────┐
│         INCIDENT RESPONSE PLAN (IRP)                  │
└──────────────────────────────────────────────────────┘

PHASE 1: DÉTECTION (Detection)
├─ Monitoring automatisé (Sentry, logs)
├─ Alertes anomalies (seuils dépassés)
├─ Signalement utilisateur/équipe
└─ Tests sécurité réguliers

PHASE 2: ANALYSE (Analysis)
├─ Classification incident (voir matrice ci-dessous)
├─ Évaluation impact (utilisateurs, données, business)
├─ Identification cause racine
└─ Documentation initiale

PHASE 3: CONTAINMENT (Confinement)
├─ Isolation système compromis
├─ Blocage attaque en cours
├─ Préservation preuves (forensics)
└─ Communication équipe (war room)

PHASE 4: ERADICATION (Éradication)
├─ Suppression menace/vulnérabilité
├─ Patch sécurité
├─ Rotation credentials compromis
└─ Validation système sain

PHASE 5: RECOVERY (Récupération)
├─ Restauration services
├─ Validation fonctionnelle
├─ Monitoring intensif (48h)
└─ Communication utilisateurs

PHASE 6: LESSONS LEARNED (Retour d'expérience)
├─ Post-mortem (72h après incident)
├─ Documentation complète
├─ Amélioration procédures
└─ Formation équipe
```

### 🔥 Classification Incidents

```
┌──────────────────────────────────────────────────────────┐
│            MATRICE CLASSIFICATION INCIDENTS              │
└──────────────────────────────────────────────────────────┘

LEVEL 1 - CRITIQUE (Réponse: < 15 min)
├─ Panne totale application
├─ Fuite données massives (> 100 users)
├─ Ransomware / Malware détecté
├─ Accès non-autorisé admin
└─ Actions:
   • Activation équipe incident complète
   • Notification CEO/CTO immédiate
   • Communication préparée (users, presse)
   • Notification autorités si breach données

LEVEL 2 - HAUTE (Réponse: < 1h)
├─ Performance dégradée sévère (> 50%)
├─ Vulnérabilité critique détectée
├─ Fuite données limitée (< 100 users)
├─ Attaque DDoS
└─ Actions:
   • Activation équipe technique
   • Notification Management
   • Investigation approfondie
   • Patch d'urgence si nécessaire

LEVEL 3 - MOYENNE (Réponse: < 4h)
├─ Bug non-critique
├─ Performance dégradée modérée
├─ Tentative intrusion bloquée
├─ Vulnérabilité moyenne
└─ Actions:
   • Équipe Dev analyse
   • Planification fix
   • Monitoring renforcé
   • Documentation incident

LEVEL 4 - FAIBLE (Réponse: < 24h)
├─ Bug cosmétique
├─ Amélioration sécurité suggérée
├─ Anomalie logs sans impact
└─ Actions:
   • Ticket créé
   • Backlog priorisation
   • Fix dans prochain release
```

### 📞 Contacts Incident

```
WAR ROOM INCIDENT (Critique)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CTO (Lead):              +225 XX XX XX XX XX
Security Officer:        +225 XX XX XX XX XX
DevOps Lead:             +225 XX XX XX XX XX
Legal Counsel:           +225 XX XX XX XX XX
Communications:          +225 XX XX XX XX XX

EXTERNE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Supabase Support:        support@supabase.io
Vercel Support:          support@vercel.com
Cloudflare Support:      support@cloudflare.com
Autorité CI (ARTCI):     www.artci.ci
```

---

## Tests de Sécurité

### 🧪 Programme de Tests

```
┌──────────────────────────────────────────────────────┐
│         TESTS SÉCURITÉ (Mensuels ou post-release)    │
└──────────────────────────────────────────────────────┘

1. TESTS AUTOMATISÉS (Continu - CI/CD)
   ├─ npm audit (dépendances vulnérables)
   ├─ ESLint security rules
   ├─ Snyk scan (vulnérabilités)
   └─ OWASP Dependency Check

2. TESTS STATIQUES (Hebdomadaire)
   ├─ Code review sécurité
   ├─ SonarQube analysis
   ├─ Secrets scanning (git-secrets)
   └─ Infrastructure as Code audit

3. TESTS DYNAMIQUES (Mensuel)
   ├─ OWASP ZAP (automated scan)
   ├─ Burp Suite (manual testing)
   ├─ SQL injection attempts
   ├─ XSS testing
   └─ CSRF validation

4. PENETRATION TESTING (Trimestriel)
   ├─ Externe: White hat hackers
   ├─ Scope: Application + Infrastructure
   ├─ Durée: 1 semaine
   └─ Rapport + Plan remediation

5. RED TEAM EXERCISE (Annuel)
   ├─ Simulation attaque réelle
   ├─ Test défenses + Incident Response
   ├─ Social engineering
   └─ Post-mortem + Training
```

### 📋 Checklist Sécurité (Pre-Release)

```
AVANT CHAQUE RELEASE MAJEURE:

AUTHENTIFICATION:
☐ JWT validation fonctionne
☐ Session expiration correcte
☐ Password policy appliquée
☐ Rate limiting auth testé
☐ MFA fonctionne (si activé)

AUTORISATION:
☐ RLS policies validées toutes tables
☐ RBAC roles vérifiés
☐ Pas d'escalade privilèges possible
☐ API endpoints protégés

DONNÉES:
☐ Chiffrement transit (TLS 1.3)
☐ Chiffrement repos (AES-256)
☐ Pas de données sensibles loggées
☐ Anonymisation fonctionne
☐ Backup chiffrés

CODE:
☐ Pas de secrets hardcodés
☐ Input validation partout
☐ Output encoding (XSS)
☐ Parameterized queries (SQL injection)
☐ CSRF tokens présents
☐ Dependencies à jour

INFRASTRUCTURE:
☐ Headers sécurité configurés
☐ CORS policy restrictive
☐ Rate limiting actif
☐ Firewall rules validées
☐ Monitoring & alertes actives

CONFORMITÉ:
☐ RGPD compliance vérifié
☐ Politique confidentialité à jour
☐ Consentements enregistrés
☐ Droits utilisateurs fonctionnent
```

---

## Formation et Sensibilisation

### 📚 Programme de Formation

```
FORMATION SÉCURITÉ (Obligatoire Tous)

ONBOARDING (Nouveau employé):
├─ Jour 1: Politique sécurité entreprise
├─ Semaine 1: Accès et permissions
├─ Mois 1: Formation spécifique rôle
└─ Certification: Quiz sécurité (80% min)

ANNUEL (Tous employés):
├─ Rappel bonnes pratiques
├─ Nouveaux risques et menaces
├─ Étude cas incidents réels
├─ Tests phishing simulés
└─ Mise à jour certifications

SPÉCIALISÉ (Dev Team):
├─ Secure coding practices (OWASP Top 10)
├─ Threat modeling
├─ Code review sécurité
├─ Incident response procedures
└─ Tools sécurité (Snyk, SonarQube)

MANAGEMENT:
├─ Risk assessment
├─ Incident response leadership
├─ Communication crise
├─ Conformité légale
└─ Budget sécurité
```

### ⚠️ Sensibilisation Menaces

```
MENACES COURANTES (Awareness):

1. PHISHING
   ⚠️  Emails frauduleux semblant légitimes
   🛡️  Vérifier expéditeur, ne pas cliquer liens suspects
   
2. SOCIAL ENGINEERING
   ⚠️  Manipulation pour obtenir infos/accès
   🛡️  Jamais partager mots de passe, vérifier identités

3. RANSOMWARE
   ⚠️  Chiffrement données + rançon
   🛡️  Backups réguliers, ne pas ouvrir pièces jointes suspectes

4. INSIDER THREAT
   ⚠️  Employé malveillant ou négligent
   🛡️  Moindre privilège, monitoring, culture sécurité

5. SUPPLY CHAIN ATTACK
   ⚠️  Compromission fournisseur/dépendance
   🛡️  Audit dépendances, pinning versions, signatures

REPORTING:
• Email: security@distri-night.ci
• Anonyme: Formulaire web sécurisé
• Récompense: Bug bounty program (prévu)
```

---

## 📞 Contacts Sécurité

```
ÉQUIPE SÉCURITÉ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Chief Security Officer:  security@distri-night.ci
                         +225 XX XX XX XX XX

Data Protection Officer: dpo@distri-night.ci
                         +225 XX XX XX XX XX

SIGNALEMENT VULNÉRABILITÉ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email:    security@distri-night.ci
PGP Key:  [Clé publique disponible]
Délai:    Réponse < 48h

COORDINATED DISCLOSURE:
• Délai résolution: 90 jours
• Crédit: Mention researcher
• Bug Bounty: Prévu 2026
```

---

**Document maintenu par:** Équipe Sécurité DISTRI-NIGHT  
**Dernière mise à jour:** Novembre 2025  
**Prochaine révision:** Janvier 2026  
**Classification:** CONFIDENTIEL

---

*Ce guide de sécurité est un document vivant, mis à jour selon l'évolution des menaces et des meilleures pratiques. La sécurité est l'affaire de tous.*

**🔒 DISTRI-NIGHT - Sécurité de Niveau Bancaire pour la Distribution Nocturne**
