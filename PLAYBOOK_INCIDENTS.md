# 🚨 PLAYBOOK INCIDENTS - DISTRI-NIGHT

**Procédures de Réponse aux Incidents**  
**Version:** 1.0.0  
**Date:** Novembre 2025  
**Classification:** Opérationnel Critique

---

## 📑 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Classification des Incidents](#classification-des-incidents)
3. [Procédures par Type d'Incident](#procédures-par-type-dincident)
4. [Escalade et Communication](#escalade-et-communication)
5. [War Room Protocol](#war-room-protocol)
6. [Post-Mortem et Amélioration](#post-mortem-et-amélioration)
7. [Templates et Checklists](#templates-et-checklists)
8. [Contacts d'Urgence](#contacts-durgence)

---

## Vue d'Ensemble

### 🎯 Objectifs du Playbook

Ce playbook fournit des **procédures claires et actionnables** pour répondre rapidement et efficacement aux incidents affectant DISTRI-NIGHT.

```
┌────────────────────────────────────────────────────┐
│         PRINCIPES RÉPONSE INCIDENTS                │
├────────────────────────────────────────────────────┤
│                                                     │
│  1. RAPIDITÉ                                       │
│     Réagir rapidement limite l'impact              │
│                                                     │
│  2. COMMUNICATION                                  │
│     Tenir informés stakeholders et utilisateurs    │
│                                                     │
│  3. DOCUMENTATION                                  │
│     Tracer toutes actions pour post-mortem         │
│                                                     │
│  4. TRANSPARENCE                                   │
│     Communication honnête sur problèmes et délais  │
│                                                     │
│  5. AMÉLIORATION CONTINUE                          │
│     Chaque incident = opportunité d'apprentissage  │
└────────────────────────────────────────────────────┘
```

### 📊 Métriques Cibles

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| **MTTD** (Mean Time To Detect) | < 5 min | 3 min ✅ |
| **MTTR** (Mean Time To Respond) | < 15 min | 12 min ✅ |
| **MTTR** (Mean Time To Resolve) | < 4h | 2.5h ✅ |
| **Incident recurrence** | < 10% | 8% ✅ |
| **Communication SLA** | < 30 min | 20 min ✅ |

---

## Classification des Incidents

### 🚦 Niveaux de Sévérité

```
┌──────────────────────────────────────────────────────────┐
│              MATRICE DE CLASSIFICATION                    │
└──────────────────────────────────────────────────────────┘

NIVEAU 1 - CRITIQUE (P1)
├─ Impact: Total ou majeur sur service
├─ Étendue: > 50% utilisateurs
├─ SLA Réponse: < 15 minutes
├─ SLA Résolution: < 4 heures
├─ Exemples:
│  • Panne complète application
│  • Faille sécurité critique
│  • Perte de données massive
│  • Impossibilité passer commandes
│  • Système paiement HS
└─ Actions:
   • War Room immédiate
   • Communication CEO/CTO
   • Status page update
   • Communication publique

NIVEAU 2 - HAUTE (P2)
├─ Impact: Majeur mais service partiellement opérationnel
├─ Étendue: 20-50% utilisateurs
├─ SLA Réponse: < 1 heure
├─ SLA Résolution: < 24 heures
├─ Exemples:
│  • Performance très dégradée
│  • Fonctionnalité majeure HS
│  • Bug bloquant workflow
│  • Erreur massive emails/SMS
│  • Database connexion issues
└─ Actions:
   • Équipe technique mobilisée
   • Management informé
   • Status page update
   • Communication ciblée

NIVEAU 3 - MOYENNE (P3)
├─ Impact: Modéré sur certaines fonctions
├─ Étendue: < 20% utilisateurs
├─ SLA Réponse: < 4 heures
├─ SLA Résolution: < 72 heures
├─ Exemples:
│  • Bug non-bloquant
│  • Performance dégradée localisée
│  • Erreur UI mineure
│  • Feature secondaire HS
│  • Notification delayed
└─ Actions:
   • Équipe Dev prend en charge
   • Ticket créé/priorisé
   • Monitoring renforcé
   • Communication interne

NIVEAU 4 - FAIBLE (P4)
├─ Impact: Minimal, cosmétique
├─ Étendue: Très limité
├─ SLA Réponse: < 24 heures
├─ SLA Résolution: Backlog
├─ Exemples:
│  • Typo interface
│  • Erreur styling
│  • Link cassé documentation
│  • Amélioration suggérée
└─ Actions:
   • Ticket backlog
   • Fix prochain sprint
   • Pas de communication urgente
```

### 🔍 Critères d'Évaluation

```
QUESTIONS POUR CLASSIFICATION:

1. UTILISATEURS AFFECTÉS
   ☐ 0-5% → P4 (Faible)
   ☐ 5-20% → P3 (Moyenne)
   ☐ 20-50% → P2 (Haute)
   ☐ > 50% → P1 (Critique)

2. IMPACT BUSINESS
   ☐ Aucun impact revenue → P4
   ☐ Impact < 5% revenue → P3
   ☐ Impact 5-20% revenue → P2
   ☐ Impact > 20% revenue → P1

3. WORKAROUND DISPONIBLE?
   ☐ Oui, simple → -1 niveau
   ☐ Oui, complexe → Même niveau
   ☐ Non → Même niveau ou +1

4. CRITICITÉ FONCTION
   ☐ Nice-to-have → P4
   ☐ Important → P3
   ☐ Core function → P2/P1
   ☐ Critical path → P1

5. SÉCURITÉ/DONNÉES
   ☐ Aucun risque → Pas de changement
   ☐ Risque potentiel → +1 niveau
   ☐ Risque confirmé → Automatique P1
```

---

## Procédures par Type d'Incident

### 🔴 INC-01: Panne Application Complète

```
┌──────────────────────────────────────────────────────┐
│  INCIDENT: Application Complète Inaccessible (P1)    │
└──────────────────────────────────────────────────────┘

SYMPTÔMES:
• Site web retourne 500/503
• Utilisateurs ne peuvent pas accéder
• Monitoring détecte downtime
• Alertes multiples déclenchées

IMPACT:
• 100% utilisateurs affectés
• Aucune commande possible
• Revenue en arrêt total
• Réputation en jeu

══════════════════════════════════════════════════════

PROCÉDURE RÉPONSE (T+0 à T+15 min):

T+0: DÉTECTION & ALERTE
├─ Alerte reçue (Sentry, Uptime monitoring)
├─ Validation incident (accès direct site)
└─ Déclaration incident P1

T+1: MOBILISATION
├─ Activation War Room (Slack #incident-room)
├─ Notification Incident Commander (CTO)
├─ Mobilisation équipe technique (DevOps, Dev Lead)
├─ Notification Management (CEO, COO)
└─ Activation Status Page (https://status.distri-night.ci)

T+3: DIAGNOSTIC INITIAL
├─ Check Vercel/Netlify status (infrastructure)
├─ Check Supabase status (backend)
├─ Check Cloudflare status (CDN)
├─ Analyze logs (dernières 30 minutes)
├─ Identify dernière modification (déploiement?)
└─ Hypothèses causes racine (HX)

T+5: ACTIONS CORRECTIVES
├─ HX1: Déploiement récent → Rollback immédiat
├─ HX2: Infrastructure provider → Attente + communication
├─ HX3: Database overload → Scale up / Kill queries
├─ HX4: DDoS attack → Cloudflare protection max
└─ Documentation actions prises (Slack thread)

T+10: VALIDATION
├─ Test santé application (health endpoints)
├─ Test fonctionnalités critiques (login, orders)
├─ Monitoring métriques (erreurs, latence)
└─ Confirmation résolution partielle/totale

T+15: COMMUNICATION
├─ Update Status Page ("Investigating" → "Identified" → "Monitoring")
├─ Email clients affectés (si > 10min downtime)
├─ Update interne stakeholders
└─ Continue monitoring (30-60 min intensif)

══════════════════════════════════════════════════════

TEMPLATE COMMUNICATION STATUS PAGE:

🔴 INVESTIGATING (T+1)
"Nous enquêtons actuellement sur un problème d'accès 
à la plateforme DISTRI-NIGHT. Nos équipes sont mobilisées.
Prochaine mise à jour: [HH:MM GMT]"

🟠 IDENTIFIED (T+5)
"Nous avons identifié la cause: [brève description].
Correction en cours. Temps estimé résolution: [XX minutes].
Prochaine mise à jour: [HH:MM GMT]"

🟡 MONITORING (T+12)
"Le problème est résolu. Nous surveillons la stabilité 
du système. Service en cours de restauration complète.
Prochaine mise à jour: [HH:MM GMT]"

🟢 RESOLVED (T+30)
"Incident résolu. Service opérationnel.
Cause: [description détaillée]
Durée downtime: [XX minutes]
Mesures prises: [actions correctives]
Post-mortem prévu: [Date]
Merci pour votre patience."

══════════════════════════════════════════════════════

CHECKLIST POST-RÉSOLUTION:

☐ Service confirmé stable (> 30 min sans erreur)
☐ Monitoring retour à la normale
☐ Status page updated (RESOLVED)
☐ Communication utilisateurs (email récapitulatif)
☐ Débriefing équipe (15 min)
☐ Documentation incident complète
☐ Post-mortem planifié (< 48h)
☐ Actions correctrices identifiées
☐ Ticket Jira créé pour chaque action
```

### 🟠 INC-02: Faille Sécurité Détectée

```
┌──────────────────────────────────────────────────────┐
│  INCIDENT: Faille Sécurité / Breach (P1)             │
└──────────────────────────────────────────────────────┘

SYMPTÔMES:
• Alerte security scanner
• Rapport vulnérabilité externe
• Activité suspecte logs
• Accès non-autorisé détecté

IMPACT:
• Confidentialité données menacée
• Intégrité système compromise
• Obligations légales (notification RGPD)
• Réputation critique

══════════════════════════════════════════════════════

PROCÉDURE RÉPONSE (IMMÉDIATE):

PHASE 1: CONTAINMENT (Confinement - T+0 à T+15)

T+0: ISOLATION IMMÉDIATE
├─ STOP: Ne pas toucher système (préserver preuves)
├─ Notification Security Officer + CTO
├─ Activation War Room SÉCURITÉ
├─ Documentation initiale (qui, quoi, quand, où)
└─ Notification Legal Counsel

T+3: ÉVALUATION RAPIDE
├─ Type d'attaque? (SQL injection, XSS, Breach, etc.)
├─ Données compromises? (lesquelles, combien)
├─ Attaque en cours? (actif/passé)
├─ Vecteur d'entrée identifié?
└─ Étendue compromise (systèmes affectés)

T+5: CONFINEMENT
├─ Si attaque active: ISOLATION système compromis
│  • Couper accès externes
│  • Bloquer IP attaquant
│  • Désactiver services compromis
├─ Si vulnérabilité: PATCH URGENCE
│  • Correction code
│  • Déploiement emergency
│  • Validation fix
└─ Préservation preuves (logs, snapshots, forensics)

T+10: ROTATION CREDENTIALS
├─ Rotation secrets compromis
├─ Invalider sessions actives
├─ Reset passwords comptes sensibles
├─ Audit accès récents
└─ Notification utilisateurs affectés (si applicable)

PHASE 2: ERADICATION (Éradication - T+15 à T+2h)

T+15: ANALYSE APPROFONDIE
├─ Forensics complet (timeline attaque)
├─ Identification toutes vulnérabilités exploitées
├─ Évaluation données exfiltrées (si breach)
├─ Documentation détaillée
└─ Coordination avec experts externes (si nécessaire)

T+30: SUPPRESSION MENACE
├─ Patch toutes vulnérabilités identifiées
├─ Suppression backdoors/malware
├─ Renforcement sécurité (hardening)
├─ Tests sécurité post-patch
└─ Validation système sain

T+1h: VALIDATION SÉCURITÉ
├─ Scan sécurité complet
├─ Penetration testing ciblé
├─ Review logs dernières 48h
├─ Confirmation aucune autre compromission
└─ Approbation Security Officer

PHASE 3: RECOVERY (Récupération - T+2h à T+24h)

T+2h: RESTAURATION SERVICE
├─ Réactivation systèmes (graduel)
├─ Monitoring intensif (sécurité + performance)
├─ Tests fonctionnels complets
├─ Validation utilisateurs (pilot group)
└─ Restauration complète si OK

T+4h: COMMUNICATION LÉGALE
├─ Évaluation obligation notification (RGPD 72h)
├─ Si > 1000 users affectés: Notification ARTCI (CI)
├─ Préparation communication publique
├─ Coordination avocat + compliance
└─ Documentation légale complète

T+24h: NOTIFICATION UTILISATEURS
├─ Email utilisateurs affectés (si données compromises)
├─ Transparence: Nature breach, données affectées
├─ Actions prises: Mesures correctives
├─ Recommandations: Changement password, vigilance
└─ Contact: Support dédiée

══════════════════════════════════════════════════════

TEMPLATE EMAIL NOTIFICATION BREACH:

Objet: Important - Incident de Sécurité DISTRI-NIGHT

Cher utilisateur DISTRI-NIGHT,

Nous vous informons d'un incident de sécurité survenu 
le [DATE] affectant votre compte.

CE QUI S'EST PASSÉ:
[Description simple de l'incident]

DONNÉES POTENTIELLEMENT AFFECTÉES:
☐ Nom et prénom
☐ Email
☐ Téléphone
☐ Adresse
☒ PAS de mots de passe (chiffrés)
☒ PAS de données bancaires (non stockées)

ACTIONS QUE NOUS AVONS PRISES:
• Correction de la vulnérabilité
• Renforcement sécurité
• Audit complet système
• Notification autorités (ARTCI)

CE QUE VOUS DEVEZ FAIRE:
1. Changez votre mot de passe: [LIEN]
2. Activez authentification 2-facteurs: [LIEN]
3. Surveillez activité compte: [LIEN]
4. Soyez vigilant emails/SMS frauduleux

SUPPORT:
Une équipe dédiée est à votre disposition:
Email: security-support@distri-night.ci
Tél: +225 XX XX XX XX XX

Nous prenons cet incident très au sérieux et avons 
mis en place des mesures pour éviter toute récurrence.

Toutes nos excuses pour ce désagrément.

L'équipe DISTRI-NIGHT

══════════════════════════════════════════════════════

CHECKLIST COMPLIANCE RGPD:

☐ Documentation complète incident
☐ Timeline précise
☐ Données compromises identifiées
☐ Nombre utilisateurs affectés
☐ Mesures techniques prises
☐ Notification ARTCI (< 72h si requis)
☐ Notification utilisateurs (< 72h)
☐ DPO informé et impliqué
☐ Avocat consulté
☐ Registre incidents mis à jour
☐ Post-mortem sécurité planifié
```

### 🟡 INC-03: Performance Dégradée

```
┌──────────────────────────────────────────────────────┐
│  INCIDENT: Performance Application Dégradée (P2)     │
└──────────────────────────────────────────────────────┘

SYMPTÔMES:
• Temps de réponse > 2s (normal < 500ms)
• Utilisateurs se plaignent lenteur
• Monitoring alerte latence élevée
• Timeouts sporadiques

IMPACT:
• Expérience utilisateur dégradée
• Potentiel abandon transactions
• Risque escalade vers panne (P1)

══════════════════════════════════════════════════════

PROCÉDURE DIAGNOSTIC & RÉSOLUTION:

ÉTAPE 1: CONFIRMATION & MESURE
├─ Vérifier métriques monitoring (Vercel, Supabase)
├─ Mesurer latence points terminaison critiques
├─ Identifier pages/fonctions affectées
├─ Étendue: Frontend? Backend? Database?
└─ Baseline: Latence normale vs actuelle

ÉTAPE 2: DIAGNOSTIC CAUSE RACINE
├─ Database:
│  • Queries lentes? (EXPLAIN ANALYZE)
│  • Connections pool saturé?
│  • Lock contentions?
│  • Index manquants?
├─ Backend:
│  • Edge functions cold start?
│  • Logic inefficace?
│  • Calls externes lentes?
├─ Frontend:
│  • Bundle size trop gros?
│  • Rendering bloquant?
│  • API calls mal optimisés?
└─ Infrastructure:
   • Auto-scaling pas déclenché?
   • CDN cache miss élevé?
   • Bandwidth saturé?

ÉTAPE 3: ACTIONS IMMÉDIATES (Quick Wins)
├─ Database: Kill queries bloquantes
├─ Cache: Clear + warm up critical data
├─ Scale: Forcer scale up manuel si auto fail
├─ CDN: Purge cache si stale
└─ Rate limit: Bloquer IPs abusives si DDoS

ÉTAPE 4: MONITORING AMÉLIORATION
├─ Mesurer impact actions (avant/après)
├─ Continuer surveillance 1-2h
├─ Si amélioration insuffisante: Deeper investigation
└─ Documentation actions et résultats

ÉTAPE 5: RÉSOLUTION PÉRENNE
├─ Si query lente: Optimiser + index
├─ Si architecture: Refactoring required
├─ Si externe: Caching, retry logic
├─ Plan long-terme (si changement majeur requis)
└─ Post-mortem performance (identification patterns)

══════════════════════════════════════════════════════

OUTILS DIAGNOSTIC:

DATABASE (Supabase):
• Query performance: Dashboard → SQL Editor
• Connection pool: Dashboard → Database → Settings
• Slow queries log: pg_stat_statements
• Index usage: pg_stat_user_indexes

BACKEND (Vercel):
• Function logs: Dashboard → Functions → Logs
• Latency metrics: Dashboard → Analytics
• Invocation count: Dashboard → Analytics

FRONTEND:
• Chrome DevTools: Network, Performance tabs
• Lighthouse: Performance score
• Web Vitals: FCP, LCP, TTI, CLS

EXTERNAL:
• Supabase Status: status.supabase.com
• Vercel Status: www.vercel-status.com
• Cloudflare Status: www.cloudflarestatus.com
```

### 🔵 INC-04: Perte de Données

```
┌──────────────────────────────────────────────────────┐
│  INCIDENT: Perte ou Corruption Données (P1/P2)       │
└──────────────────────────────────────────────────────┘

SYMPTÔMES:
• Données manquantes rapportées
• Corruption détectée (integrity checks)
• Erreurs base de données
• Rollback accidentel

IMPACT:
• Intégrité données compromise
• Potentiel impact financier
• Compliance issues
• Confiance utilisateurs

══════════════════════════════════════════════════════

PROCÉDURE URGENCE:

PHASE 1: ÉVALUATION (T+0 à T+15)

T+0: STOP & ASSESS
├─ STOP toutes opérations d'écriture (si safe)
├─ Isolation tables/services affectés
├─ Évaluation étendue problème:
│  • Quelle(s) table(s)?
│  • Combien de records?
│  • Type corruption (deleted, modified, null)?
│  • Période affectée (depuis quand)?
└─ Documentation détaillée (screenshots, queries)

T+5: BACKUP IDENTIFICATION
├─ Dernier backup sain identifié
├─ Timestamp backup vs corruption
├─ Validation intégrité backup
└─ Estimation records perdus (gap analysis)

T+10: GO/NO-GO RESTAURATION
├─ Impact restauration vs leaving as-is
├─ Downtime requis? (combien)
├─ Approbation Management (si downtime)
└─ Décision: Restaurer ou Correction manuelle

PHASE 2: RESTAURATION (T+15 à T+2h)

OPTION A: RESTORATION COMPLÈTE
├─ Mode maintenance activé
├─ Backup database actuel (safety)
├─ Restore backup identifié
├─ Validation intégrité post-restore
├─ Rejeu transactions (si logs disponibles)
├─ Smoke tests complets
└─ Désactivation mode maintenance

OPTION B: CORRECTION CIBLÉE
├─ Export records affectés (current state)
├─ Script correction SQL
├─ Test script sur copy database
├─ Application production (transaction)
├─ Validation résultats
└─ Documentation changes

PHASE 3: VALIDATION (T+2h à T+6h)

T+2h: TESTS FONCTIONNELS
├─ Login/Auth
├─ Créer commande test
├─ Paiement test
├─ Consultation historique
└─ Tous workflows critiques

T+3h: RECONCILIATION
├─ Comparaison counts (before/after)
├─ Vérification checksums
├─ Audit trail review
├─ Confirmation aucune perte additionnelle
└─ Documentation complète

T+4h: COMMUNICATION
├─ Update stakeholders
├─ Communication utilisateurs affectés (si applicable)
├─ Transparence sur actions prises
└─ Mesures préventives annoncées

══════════════════════════════════════════════════════

PRÉVENTION FUTURE:

☐ Augmenter fréquence backups (quotidien → 6h)
☐ Point-in-time recovery configuré
☐ Validation intégrité automatisée
☐ Monitoring anomalies data
☐ Soft delete vs hard delete (GDPR compliant)
☐ Audit triggers sur tables critiques
☐ Formation équipe (no-delete policies)
☐ Code review strict DB changes
```

### 🟢 INC-05: Problème Paiement Mobile Money

```
┌──────────────────────────────────────────────────────┐
│  INCIDENT: Échec Paiements Mobile Money (P2)         │
└──────────────────────────────────────────────────────┘

SYMPTÔMES:
• Utilisateurs rapportent échecs paiement
• Webhooks non-reçus
• Timeout API fournisseur
• Status paiement "stuck"

IMPACT:
• Revenue bloqué
• Commandes non-finalisées
• Satisfaction client
• Relations fournisseurs paiement

══════════════════════════════════════════════════════

PROCÉDURE DIAGNOSTIC:

ÉTAPE 1: IDENTIFICATION SCOPE
├─ Opérateur affecté? (Orange, MTN, Moov, Wave)
├─ Tous utilisateurs ou subset?
├─ Type transaction? (paiement, remboursement)
├─ Depuis quand? (timestamp premier incident)
└─ Nombre transactions impactées

ÉTAPE 2: VÉRIFICATION EXTERNE
├─ Status opérateur:
│  • Orange Money: www.orangemoney.ci
│  • MTN Mobile Money: www.mtn.ci
│  • Moov Money: www.moov-africa.ci
│  • Wave: www.wave.com
├─ Contact support opérateur (si down général)
├─ Vérification crédentials API (expirés?)
└─ Test appel API directement (Postman)

ÉTAPE 3: VÉRIFICATION INTERNE
├─ Logs Edge Function payment-webhook
├─ Vérification webhook reçus (timestamps)
├─ Status database commandes (stuck en "pending"?)
├─ Configuration endpoints correcte?
└─ Rate limiting atteint?

ÉTAPE 4: RÉSOLUTION

SI PROBLÈME OPÉRATEUR:
├─ Communication utilisateurs (downtime externe)
├─ Alternative: Proposer autre opérateur
├─ Wait & Monitor opérateur status
└─ Tests dès résolution externe

SI PROBLÈME INTERNE:
├─ Fix identifié:
│  • Code bug → Hotfix
│  • Credentials → Rotation
│  • Config → Correction
│  • Rate limit → Augmentation
├─ Deploy fix (urgence)
├─ Retry failed transactions (manuel si nécessaire)
└─ Validation résolution

ÉTAPE 5: RÉCONCILIATION
├─ Liste toutes transactions "stuck"
├─ Vérification status opérateur (payé ou non?)
├─ Mise à jour manuelle si nécessaire
├─ Confirmation utilisateurs
└─ Documentation complète

══════════════════════════════════════════════════════

SCRIPT RÉCONCILIATION PAIEMENTS:

-- Identifier paiements "stuck" (> 10min pending)
SELECT 
  id, 
  client_id, 
  total_amount, 
  payment_provider,
  created_at
FROM orders
WHERE status = 'delivered'
  AND paid_at IS NULL
  AND created_at < NOW() - INTERVAL '10 minutes';

-- Après vérification avec opérateur, update manuel
UPDATE orders 
SET 
  status = 'paid',
  paid_at = NOW()
WHERE id = 'order-uuid'
  AND [CONFIRMATION PAIEMENT OPÉRATEUR];

-- Notification client
INSERT INTO notifications (user_id, type, message)
VALUES (
  'client-uuid',
  'payment_confirmed',
  'Votre paiement a été confirmé. Merci!'
);
```

---

## Escalade et Communication

### 📞 Matrice d'Escalade

```
┌──────────────────────────────────────────────────────┐
│              MATRICE D'ESCALADE                       │
└──────────────────────────────────────────────────────┘

NIVEAU 1 - SUPPORT L1
├─ Scope: Incidents P3/P4
├─ Délai: < 4h
├─ Contact: support@distri-night.ci
└─ Escalade: Si non-résolu < 4h → L2

NIVEAU 2 - SUPPORT L2 / TECH
├─ Scope: Incidents P2/P3
├─ Délai: < 1h (réponse), < 24h (résolution)
├─ Contact: tech@distri-night.ci
└─ Escalade: Si P1 ou non-résolu < 24h → L3

NIVEAU 3 - INGÉNIERIE / DEVOPS
├─ Scope: Incidents P1/P2
├─ Délai: < 15min (réponse), < 4h (résolution)
├─ Contact: devops@distri-night.ci
│           +225 XX XX XX XX XX (Astreinte)
└─ Escalade: Si P1 non-résolu < 2h → Management

NIVEAU 4 - MANAGEMENT (CTO/CEO)
├─ Scope: Incidents P1 prolongés, Décisions critiques
├─ Délai: Immédiat
├─ Contact: cto@distri-night.ci
│           ceo@distri-night.ci
└─ Décisions: Go/No-Go, Communication publique, etc.

AUTOMATISMES:
• P1 automatique → Alerte CTO
• Downtime > 15min → Email CEO
• Data breach → Immédiat CTO + CEO + Legal
• Financial impact > 1M FCFA → CFO notifié
```

### 📢 Communication Stakeholders

```
┌──────────────────────────────────────────────────────┐
│         PLAN DE COMMUNICATION PAR AUDIENCE           │
└──────────────────────────────────────────────────────┘

UTILISATEURS (Clients/Fournisseurs)
├─ Quand: P1/P2 avec impact visible
├─ Canaux: 
│  • Status page (https://status.distri-night.ci)
│  • Email (pour downtime > 10min)
│  • SMS (pour urgence critique)
│  • In-app notification (si accessible)
├─ Contenu:
│  • Nature problème (simple, non-technique)
│  • Impact (quelles fonctions affectées)
│  • Estimation résolution
│  • Prochaine mise à jour
├─ Fréquence: Every 30 min jusqu'à résolution
└─ Tone: Transparent, empathique, rassurant

ÉQUIPE INTERNE
├─ Quand: Tous incidents P1/P2
├─ Canaux:
│  • Slack #incidents (temps réel)
│  • Email management (synthèse)
├─ Contenu:
│  • Détails techniques
│  • Actions en cours
│  • Besoin assistance?
├─ Fréquence: Temps réel (Slack)
└─ Tone: Factuel, collaboratif

MANAGEMENT / BOARD
├─ Quand: P1, ou P2 prolongé (> 4h)
├─ Canaux:
│  • Email (synthèse exécutive)
│  • Call si critique
├─ Contenu:
│  • Impact business (users, revenue)
│  • Actions prises
│  • Estimation résolution
│  • Risques
│  • Needs (ressources, décisions)
├─ Fréquence: Initial + Major updates
└─ Tone: Business-focused, concis

PARTENAIRES / INVESTISSEURS
├─ Quand: P1 prolongé (> 2h), ou data breach
├─ Canaux: Email personnalisé
├─ Contenu:
│  • Situation overview
│  • Impact assessment
│  • Measures taken
│  • Lessons learned (post-incident)
├─ Fréquence: Post-résolution seulement
└─ Tone: Professionnel, transparent, confiant

PRESSE / PUBLIC
├─ Quand: Data breach, ou incident majeur
├─ Canaux: 
│  • Communiqué presse
│  • Social media (LinkedIn, Twitter)
├─ Contenu: Préparé par Legal + Communications
├─ Approbation: CEO obligatoire
└─ Tone: Officiel, transparent, responsable
```

---

## War Room Protocol

### 🏥 Activation War Room

```
┌──────────────────────────────────────────────────────┐
│              WAR ROOM PROTOCOL (P1 uniquement)       │
└──────────────────────────────────────────────────────┘

DÉCLENCHEMENT:
• Incident P1 déclaré
• Incident P2 escaladé vers P1
• Demande CTO/CEO

PARTICIPANTS REQUIS:
✅ Incident Commander (CTO ou delegate)
✅ DevOps Lead
✅ Dev Lead
✅ Product Owner (context)
☐ Security Officer (si sécurité)
☐ Communications (si communication externe)
☐ Legal (si data breach)

CANAL:
• Slack: #war-room-incident-[ID]
• Video call (si remote): Google Meet link pinned

DURÉE:
• Jusqu'à résolution P1
• Check-ins réguliers (30 min)
• Handover si > 4h (relève équipe)

══════════════════════════════════════════════════════

RÔLES & RESPONSABILITÉS:

🎯 INCIDENT COMMANDER (IC)
├─ Lead investigation & coordination
├─ Prend décisions go/no-go
├─ Interface avec Management
├─ Assure communication
└─ Responsible for post-mortem

🛠️ TECHNICAL LEAD (TL)
├─ Diagnostic technique
├─ Implémentation fixes
├─ Coordination équipe tech
└─ Validation résolution

📝 SCRIBE
├─ Documentation temps réel (timeline)
├─ Log toutes actions prises
├─ Capture décisions et rationale
└─ Prépare documents post-incident

📢 COMMUNICATIONS (COMMS)
├─ Rédaction messages externes
├─ Update status page
├─ Coordination avec Support
└─ Monitor sentiment utilisateurs

══════════════════════════════════════════════════════

FRAMEWORK DÉCISION (IC):

Pour chaque décision majeure, IC utilise OODA Loop:

1. OBSERVE (Observer)
   • Qu'est-ce qui se passe?
   • Métriques actuelles?
   • Feedback utilisateurs?

2. ORIENT (Orienter)
   • Contexte historique?
   • Options disponibles?
   • Contraintes (temps, ressources)?

3. DECIDE (Décider)
   • Quelle action?
   • Qui exécute?
   • Timeline?

4. ACT (Agir)
   • Go!
   • Monitor résultat
   • Loop back to OBSERVE

TEMPO:
• OODA loop rapide: 5-10 minutes
• Éviter analysis paralysis
• Bias vers action (measured risk OK)
```

### 📋 War Room Checklist

```
WAR ROOM ACTIVATION CHECKLIST:

☐ 1. SETUP (T+0 to T+3)
  ☐ Créer canal Slack #war-room-incident-[ID]
  ☐ Pin incident details (description, classification)
  ☐ Pin Google Meet link (si remote)
  ☐ Inviter participants requis
  ☐ Désigner IC, TL, Scribe
  ☐ Démarrer timeline document (Google Doc)

☐ 2. KICKOFF (T+3 to T+5)
  ☐ IC: Briefing situation (2 min)
  ☐ IC: Objectifs clairs (résolution P1)
  ☐ IC: Assignments (qui fait quoi)
  ☐ TL: Plan diagnostic (hypothèses)
  ☐ Comms: Status page initial update

☐ 3. EXECUTION (T+5 to T+Resolution)
  ☐ Scribe: Log all actions (timeline)
  ☐ TL: Drive technical investigation
  ☐ IC: Decision-making (go/no-go rollback, etc.)
  ☐ Comms: Updates réguliers (30 min)
  ☐ IC: Check-ins équipe (morale, fatigue)
  ☐ IC: Handover si durée prolongée (> 4h)

☐ 4. RESOLUTION (T+Resolution to T+1h)
  ☐ TL: Validation résolution (tests)
  ☐ IC: Confirmation resolution (approbation)
  ☐ Comms: Status page RESOLVED
  ☐ Comms: Communication utilisateurs
  ☐ Scribe: Finaliser timeline
  ☐ IC: Debrief équipe (15 min)

☐ 5. CLOSURE (T+1h to T+24h)
  ☐ IC: Schedule post-mortem (< 48h)
  ☐ Scribe: Distribute incident report
  ☐ IC: Thank you équipe (reconnaissance)
  ☐ Archive canal Slack (keep for reference)
  ☐ Update incident registry
```

---

## Post-Mortem et Amélioration

### 📊 Post-Mortem Meeting

```
┌──────────────────────────────────────────────────────┐
│              POST-MORTEM FRAMEWORK                    │
└──────────────────────────────────────────────────────┘

TIMING:
• Schedule: 24-48h après résolution
• Durée: 1-2 heures
• Participants: Équipe War Room + Stakeholders

OBJECTIF:
• Comprendre cause racine (pas blâmer)
• Identifier améliorations
• Prévenir récurrence
• Partager apprentissages

══════════════════════════════════════════════════════

AGENDA POST-MORTEM:

1. RECAP INCIDENT (10 min)
   ├─ Timeline factuelle (Scribe)
   ├─ Impact (utilisateurs, business)
   └─ Durée (MTTD, MTTR, total)

2. ROOT CAUSE ANALYSIS (30 min)
   ├─ Technique des 5 Pourquoi
   │  Pourquoi 1: L'application est tombée
   │  Pourquoi 2: Déploiement a introduit bug
   │  Pourquoi 3: Tests n'ont pas détecté
   │  Pourquoi 4: Coverage test insuffisant
   │  Pourquoi 5: Pas de review coverage
   ├─ Contributing factors
   ├─ Root cause(s) identifiée(s)
   └─ Documentation RCA

3. CE QUI A BIEN FONCTIONNÉ (15 min)
   ├─ Détection rapide? (monitoring)
   ├─ Communication claire?
   ├─ Collaboration efficace?
   ├─ Décisions appropriées?
   └─ Célébrer succès! (important)

4. CE QUI PEUT ÊTRE AMÉLIORÉ (30 min)
   ├─ Prévention (éviter récurrence)
   ├─ Détection (alertes, monitoring)
   ├─ Response (procédures, outils)
   ├─ Communication (interne, externe)
   └─ Brainstorm solutions

5. ACTION ITEMS (20 min)
   ├─ Lister toutes actions identifiées
   ├─ Prioriser (impact vs effort)
   ├─ Assigner ownership
   ├─ Définir deadlines
   ├─ Créer tickets Jira
   └─ Follow-up (qui, quand)

6. CLÔTURE (5 min)
   ├─ Résumé key learnings
   ├─ Next steps clairs
   ├─ Merci équipe
   └─ Distribution document post-mortem

══════════════════════════════════════════════════════

RÈGLES POST-MORTEM:

✅ BLAMELESS CULTURE
   • Focus sur systèmes, pas personnes
   • Erreurs = opportunités apprentissage
   • Curiosité, pas jugement

✅ DATA-DRIVEN
   • S'appuyer sur facts (timeline, logs)
   • Pas d'hypothèses non-vérifiées
   • Metrics concrets (MTTR, impact)

✅ ACTIONABLE
   • Chaque problème → Action concrète
   • Owner assigné
   • Deadline définie
   • Follow-up planifié

✅ TRANSPARENT
   • Document partagé toute équipe
   • Learnings partagés (internal blog)
   • Culture amélioration continue

❌ ÉVITER:
   • Blâmer individus
   • Conclusions hâtives
   • Actions vagues ("améliorer monitoring")
   • Ignorer contributing factors
   • Pas de follow-up actions
```

### 📄 Template Incident Report

```
════════════════════════════════════════════════════════
INCIDENT REPORT - [ID] - [TITRE COURT]
════════════════════════════════════════════════════════

Date Incident:     [DD/MM/YYYY]
Heure Début:       [HH:MM GMT]
Heure Fin:         [HH:MM GMT]
Durée Totale:      [XXh XXmin]
Sévérité:          [P1 / P2 / P3 / P4]
Incident Commander: [NOM]

────────────────────────────────────────────────────────
1. RÉSUMÉ EXÉCUTIF
────────────────────────────────────────────────────────

[2-3 phrases décrivant l'incident, impact, et résolution]

Exemple:
"Le 22 novembre 2025, l'application DISTRI-NIGHT a subi 
une panne complète de 23 minutes suite à un déploiement 
défaillant. 100% des utilisateurs ont été impactés, 
aucune commande n'était possible. Un rollback immédiat 
a résolu le problème. Cause racine: test coverage 
insuffisant sur nouvelle fonctionnalité."

────────────────────────────────────────────────────────
2. IMPACT
────────────────────────────────────────────────────────

Utilisateurs Affectés:  [XXX] ([XX%])
Durée Indisponibilité:  [XX minutes]
Commandes Perdues:      [XX]
Impact Financier:       [XXX,XXX FCFA]
Réputation:             [Estimation: Faible/Moyen/Élevé]

────────────────────────────────────────────────────────
3. TIMELINE
────────────────────────────────────────────────────────

[HH:MM] - Événement déclencheur
[HH:MM] - Détection (alerte monitoring)
[HH:MM] - Incident déclaré P1
[HH:MM] - War Room activée
[HH:MM] - Diagnostic: cause identifiée
[HH:MM] - Action corrective démarrée (rollback)
[HH:MM] - Service restauré
[HH:MM] - Validation complète
[HH:MM] - Incident clos (monitoring OK)

MTTR (Mean Time To Detect):   [X min]
MTTR (Mean Time To Respond):  [X min]
MTTR (Mean Time To Resolve):  [XX min]

────────────────────────────────────────────────────────
4. ROOT CAUSE ANALYSIS
────────────────────────────────────────────────────────

Cause Racine:
[Description détaillée de la cause racine identifiée]

Contributing Factors:
• [Facteur contributif 1]
• [Facteur contributif 2]
• [Facteur contributif 3]

Technique Utilisée: [5 Whys / Fishbone / etc.]

────────────────────────────────────────────────────────
5. RÉSOLUTION
────────────────────────────────────────────────────────

Actions Prises:
1. [Action immédiate 1]
2. [Action immédiate 2]
3. [Action immédiate 3]

Pourquoi Cela a Fonctionné:
[Explication succès de la résolution]

────────────────────────────────────────────────────────
6. CE QUI A BIEN FONCTIONNÉ
────────────────────────────────────────────────────────

✅ [Point positif 1]
✅ [Point positif 2]
✅ [Point positif 3]

────────────────────────────────────────────────────────
7. CE QUI PEUT ÊTRE AMÉLIORÉ
────────────────────────────────────────────────────────

⚠️ [Amélioration 1]
⚠️ [Amélioration 2]
⚠️ [Amélioration 3]

────────────────────────────────────────────────────────
8. ACTION ITEMS
────────────────────────────────────────────────────────

| #  | Action                  | Owner | Deadline | Status |
|----|-------------------------|-------|----------|--------|
| 1  | [Action concrète 1]     | [Nom] | [Date]   | Open   |
| 2  | [Action concrète 2]     | [Nom] | [Date]   | Open   |
| 3  | [Action concrète 3]     | [Nom] | [Date]   | Open   |

────────────────────────────────────────────────────────
9. LESSONS LEARNED
────────────────────────────────────────────────────────

[Key learnings pour éviter récurrence]

────────────────────────────────────────────────────────
10. ANNEXES
────────────────────────────────────────────────────────

• Logs: [Lien]
• Screenshots: [Lien]
• Timeline détaillée: [Lien Google Doc]
• Communication externe: [Lien Status Page]

════════════════════════════════════════════════════════
Document créé par: [NOM]
Date: [DD/MM/YYYY]
Distribution: Équipe + Management
════════════════════════════════════════════════════════
```

---

## Templates et Checklists

### ✅ Checklist Réponse Incident (Générique)

```
CHECKLIST RÉPONSE INCIDENT

☐ DÉTECTION & DÉCLARATION
  ☐ Incident détecté (monitoring ou signalement)
  ☐ Validation incident (pas faux positif)
  ☐ Classification sévérité (P1/P2/P3/P4)
  ☐ Création ticket incident (ID unique)
  ☐ Notification équipe selon niveau

☐ INVESTIGATION
  ☐ Symptômes documentés
  ☐ Étendue identifiée (utilisateurs, fonctions)
  ☐ Logs consultés (timeline événements)
  ☐ Hypothèses causes racine (top 3)
  ☐ Tests hypothèses (diagnostics)

☐ CONTAINMENT
  ☐ Actions immédiates (stop the bleeding)
  ☐ Isolation si nécessaire (limit blast radius)
  ☐ Préservation preuves (forensics si sécurité)
  ☐ Workaround proposé (si applicable)

☐ RÉSOLUTION
  ☐ Fix identifié
  ☐ Fix testé (staging/local)
  ☐ Déploiement fix (production)
  ☐ Validation résolution (tests smoke)
  ☐ Monitoring post-fix (30-60 min)

☐ COMMUNICATION
  ☐ Status page updated (si P1/P2)
  ☐ Communication interne (Slack, email)
  ☐ Communication externe (si impact visible)
  ☐ Updates réguliers (fréquence définie)
  ☐ Communication résolution (all-clear)

☐ POST-INCIDENT
  ☐ Documentation complète (incident report)
  ☐ Post-mortem planifié (< 48h si P1/P2)
  ☐ Action items créés (tickets Jira)
  ☐ Learnings partagés (équipe, blog interne)
  ☐ Registre incidents mis à jour
  ☐ Remerciements équipe (recognition)
```

---

## Contacts d'Urgence

### 📞 Liste Contacts Incidents

```
═════════════════════════════════════════════════════
CONTACTS URGENCE INCIDENTS - DISTRI-NIGHT
═════════════════════════════════════════════════════

🎯 INCIDENT COMMANDERS
─────────────────────────────────────────────────────
CTO (Primary IC):           +225 XX XX XX XX XX
                            cto@distri-night.ci

DevOps Lead (Backup IC):    +225 XX XX XX XX XX
                            devops-lead@distri-night.ci

🛠️ ÉQUIPE TECHNIQUE
─────────────────────────────────────────────────────
Dev Lead:                   +225 XX XX XX XX XX
Backend Engineer On-Call:   +225 XX XX XX XX XX
Frontend Engineer On-Call:  +225 XX XX XX XX XX
Database Admin:             +225 XX XX XX XX XX

🔒 SÉCURITÉ
─────────────────────────────────────────────────────
Security Officer:           +225 XX XX XX XX XX
                            security@distri-night.ci
DPO (Data Protection):      dpo@distri-night.ci

📢 COMMUNICATIONS
─────────────────────────────────────────────────────
Communications Lead:        +225 XX XX XX XX XX
Support Manager:            +225 XX XX XX XX XX

⚖️ LÉGAL & COMPLIANCE
─────────────────────────────────────────────────────
Legal Counsel:              +225 XX XX XX XX XX
Compliance Officer:         compliance@distri-night.ci

👔 MANAGEMENT
─────────────────────────────────────────────────────
CEO:                        +225 XX XX XX XX XX
                            ceo@distri-night.ci
COO:                        +225 XX XX XX XX XX
CFO:                        +225 XX XX XX XX XX

🤝 PARTENAIRES EXTERNES
─────────────────────────────────────────────────────
Supabase Support:           support@supabase.io
                            (Enterprise: response < 1h)
Vercel Support:             support@vercel.com
Cloudflare Support:         support@cloudflare.com

Orange Money Support:       +225 XXXX
MTN Mobile Money Support:   +225 XXXX
Moov Money Support:         +225 XXXX
Wave Support:               support@wave.com

🏛️ AUTORITÉS
─────────────────────────────────────────────────────
ARTCI (Telecom Regulator):  www.artci.ci
                            +225 XX XX XX XX XX

═════════════════════════════════════════════════════
DISPONIBILITÉ ASTREINTE:
• Rotation hebdomadaire (Lundi-Dimanche)
• Calendrier: calendar.distri-night.ci/oncall
• Slack: /who-is-oncall

PROTOCOLE APPEL:
1. Appeler On-Call (CTO ou Backup IC)
2. Si pas de réponse < 5 min → Prochain
3. En parallèle: Slack #incidents + Email
4. Documenter tous appels

═════════════════════════════════════════════════════
Dernière mise à jour: Novembre 2025
Prochaine révision: Janvier 2026
═════════════════════════════════════════════════════
```

---

**Document maintenu par:** Équipe DevOps & SRE DISTRI-NIGHT  
**Dernière mise à jour:** Novembre 2025  
**Prochaine révision:** Janvier 2026

---

*Ce playbook est un document vivant, mis à jour après chaque incident majeur pour incorporer les apprentissages et améliorer continuellement notre réponse.*

**🚨 DISTRI-NIGHT - Excellence en Gestion de Crise et Résilience Opérationnelle**
