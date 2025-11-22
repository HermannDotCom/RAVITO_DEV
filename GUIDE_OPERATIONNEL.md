# 📋 GUIDE OPÉRATIONNEL - DISTRI-NIGHT

**Manuel des Opérations Quotidiennes**  
**Version:** 1.0.0  
**Date:** Novembre 2025  
**Classification:** Documentation Opérationnelle - Usage Interne

---

## 📑 Table des Matières

1. [Vue d'Ensemble Opérationnelle](#vue-densemble-opérationnelle)
2. [Monitoring Quotidien](#monitoring-quotidien)
3. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
4. [Support Client](#support-client)
5. [Maintenance Préventive](#maintenance-préventive)
6. [Gestion des Commandes](#gestion-des-commandes)
7. [Trésorerie et Commissions](#trésorerie-et-commissions)
8. [Procédures d'Escalade](#procédures-descalade)
9. [KPIs et Métriques](#kpis-et-métriques)
10. [Checklists Opérationnelles](#checklists-opérationnelles)

---

## Vue d'Ensemble Opérationnelle

### 🎯 Objectifs Opérationnels

| Objectif | SLA | Mesure | Responsable |
|----------|-----|--------|-------------|
| **Disponibilité Plateforme** | 99.9% | Uptime monitoring | DevOps |
| **Temps de Réponse Support** | < 2h (Urgent) | Ticket resolution | Support L1 |
| **Validation Utilisateurs** | < 24h | Approval queue | Admin |
| **Traitement Commandes** | < 30 min | Order pipeline | Operations |
| **Résolution Incidents** | < 4h (Critique) | MTTR | Tech Lead |

### 👥 Équipe Opérationnelle

```
┌────────────────────────────────────────────────────┐
│           ORGANIGRAMME OPÉRATIONNEL                │
└────────────────────────────────────────────────────┘

                    ┌───────────────┐
                    │   Directeur   │
                    │  Opérations   │
                    └───────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
      ┌─────▼─────┐   ┌────▼────┐   ┌─────▼──────┐
      │  Manager   │   │ Manager │   │  Manager   │
      │  Support   │   │  Tech   │   │  Business  │
      └─────┬──────┘   └────┬────┘   └─────┬──────┘
            │               │               │
    ┌───────┼───────┐       │       ┌───────┼───────┐
    │       │       │       │       │       │       │
┌───▼──┐ ┌──▼──┐ ┌─▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
│Support│ │Sup. │ │Dev │ │DevOps│ │Ops  │ │Finance│ │Sales│
│  L1   │ │ L2  │ │Team│ │ Team │ │Coord│ │ Team  │ │Team │
└───────┘ └─────┘ └────┘ └──────┘ └─────┘ └───────┘ └─────┘
```

### 📞 Horaires d'Opération

| Fonction | Horaires | Contact | Astreinte |
|----------|----------|---------|-----------|
| **Support Client** | 24/7 | support@distri-night.ci | ✅ Oui |
| **Support Technique** | 8h-20h (GMT) | tech@distri-night.ci | ✅ Oui |
| **Administration** | 9h-18h (GMT) | admin@distri-night.ci | ❌ Non |
| **Finance** | 9h-17h (GMT) | finance@distri-night.ci | ❌ Non |
| **Urgences Critiques** | 24/7 | emergency@distri-night.ci | ✅ Oui |

---

## Monitoring Quotidien

### 🖥️ Dashboard de Monitoring

**URL:** https://admin.distri-night.ci/monitoring

```
┌─────────────────────────────────────────────────────────┐
│              DASHBOARD OPÉRATIONNEL 24/7                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SANTÉ SYSTÈME                          STATUS: 🟢 GOOD │
│  ├─ API Response Time      85ms        [████████░░] 85% │
│  ├─ Database Connections   12/100      [██░░░░░░░░] 12% │
│  ├─ Edge Functions        3/3 UP       [██████████] 100%│
│  └─ Uptime Today          23h 58m      [██████████] 99.9%│
│                                                          │
│  MÉTRIQUES BUSINESS                                      │
│  ├─ Commandes Actives      47                           │
│  ├─ Utilisateurs En Ligne  234                          │
│  ├─ Offres En Attente      18                           │
│  └─ Revenus Aujourd'hui    1,234,500 FCFA               │
│                                                          │
│  ALERTES ACTIVES                                         │
│  ⚠️  2 commandes en retard (> 45min)                    │
│  ℹ️  5 nouveaux utilisateurs à approuver                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 📊 Procédure de Monitoring Quotidien

#### Matin (8h00 GMT - Début de Journée)

```bash
# Checklist Matinale
☐ Vérifier uptime de la nuit (objectif: 100%)
☐ Consulter logs d'erreurs (seuil: < 10 erreurs critiques)
☐ Vérifier sauvegardes automatiques (dernier backup: < 24h)
☐ Contrôler file d'attente approbations (objectif: < 10 en attente)
☐ Vérifier transactions paiement de la nuit (réconciliation)
☐ Consulter rapports automatiques par email
☐ Vérifier capacité serveurs (CPU < 70%, RAM < 80%)
☐ Tester endpoints critiques (health check)
```

**Actions si Anomalies:**

1. **Uptime < 99.5%**: Investiguer logs, identifier cause, rapport incident
2. **Erreurs > 10**: Analyser stack traces, escalader si récurrent
3. **Backup échoué**: Vérifier espace disque, relancer manuellement, alerter DevOps
4. **Approbations > 20**: Affecter ressources additionnelles
5. **Paiements en suspens**: Contacter fournisseurs paiement, réconcilier

#### Midi (12h00 GMT - Point Journée)

```bash
# Checklist Mi-Journée
☐ Vérifier progression commandes du jour
☐ Contrôler KPIs temps réel vs objectifs
☐ Vérifier taux de conversion (objectif: > 15%)
☐ Monitorer temps de réponse API (objectif: < 200ms)
☐ Consulter satisfaction client (ratings moyens)
☐ Vérifier incidents support en cours
☐ Contrôler stock virtuel fournisseurs (via déclarations)
```

#### Soir (20h00 GMT - Fin de Journée)

```bash
# Checklist Soirée
☐ Générer rapport journalier automatique
☐ Vérifier toutes commandes du jour traitées
☐ Réconcilier transactions financières
☐ Valider évaluations clients/fournisseurs
☐ Préparer prévisions demande pour lendemain
☐ Archiver logs de la journée
☐ Briefing équipe nuit (si applicable)
☐ Mettre à jour tableau de bord management
```

### 🔔 Système d'Alertes

```
┌──────────────────────────────────────────────────────┐
│            MATRICE D'ALERTES AUTOMATIQUES             │
├──────────────────────────────────────────────────────┤
│ Condition                    │ Alerte │ Responsable  │
├──────────────────────────────┼────────┼──────────────┤
│ API Response > 500ms         │ 🟡 WARN│ DevOps       │
│ API Response > 1000ms        │ 🔴 CRIT│ Tech Lead    │
│ Downtime > 2 minutes         │ 🔴 CRIT│ CTO          │
│ Error Rate > 5%              │ 🟡 WARN│ Dev Team     │
│ Database Connections > 80%   │ 🟠 HIGH│ DevOps       │
│ Commande bloquée > 1h        │ 🟡 WARN│ Operations   │
│ Paiement échoué              │ 🟠 HIGH│ Finance      │
│ Espace disque < 20%          │ 🔴 CRIT│ DevOps       │
│ Certificat SSL expire < 30j  │ 🟡 WARN│ DevOps       │
│ Backup échoué                │ 🔴 CRIT│ DevOps       │
└──────────────────────────────┴────────┴──────────────┘

CANAUX D'ALERTE:
• 🔴 CRITIQUE → SMS + Email + Slack + PagerDuty
• 🟠 HAUTE    → Email + Slack
• 🟡 WARN     → Slack
• ℹ️  INFO     → Log uniquement
```

---

## Gestion des Utilisateurs

### 👤 Processus d'Approbation des Nouveaux Utilisateurs

#### Contexte d'Abidjan

DISTRI-NIGHT opère à Abidjan avec un écosystème B2B nécessitant validation manuelle pour garantir qualité et sécurité.

#### Workflow d'Approbation

```
┌──────────────────────────────────────────────────────┐
│         PROCESSUS D'APPROBATION UTILISATEUR          │
└──────────────────────────────────────────────────────┘

1. INSCRIPTION
   │
   ▼
┌─────────────────┐
│ Utilisateur     │
│ S'inscrit       │ → Reçoit email confirmation
└────────┬────────┘
         │
         ▼
2. VÉRIFICATION AUTOMATIQUE
   │
   ├─ Email valide? ✅
   ├─ Numéro CI valide (+225)? ✅
   ├─ Données complètes? ✅
   └─ Pas de doublon? ✅
         │
         ▼
3. FILE D'ATTENTE ADMIN
   │
┌─────────────────┐
│ Admin Dashboard │
│ "Approbations"  │
└────────┬────────┘
         │
         ▼
4. VÉRIFICATION MANUELLE
   │
   ├─ Vérifier business_name (Google Maps/registre)
   ├─ Vérifier téléphone (appel test si nécessaire)
   ├─ Vérifier adresse (localisation GPS cohérente)
   ├─ Vérifier zone (correspond à zones actives)
   └─ Vérifier historique (blacklist)
         │
         ▼
5. DÉCISION
   │
   ├─ APPROUVER → Accès immédiat + Email bienvenue
   └─ REJETER   → Email justification + appel possible
```

#### Procédure Détaillée - Validation Client (Bar/Maquis)

**Accès:** Admin Dashboard → Gestion Utilisateurs → En Attente d'Approbation

**Étapes:**

1. **Examiner la Demande**
   ```
   Informations à vérifier:
   ✓ Nom de l'établissement
   ✓ Nom du gérant
   ✓ Téléphone (+225 XX XX XX XX XX)
   ✓ Adresse complète (Commune, Quartier)
   ✓ Zone de livraison demandée
   ✓ Type d'établissement (Bar, Maquis, Restaurant)
   ```

2. **Vérifications Externes**
   ```bash
   # Checklist de Vérification
   ☐ Recherche Google Maps (établissement existe?)
   ☐ Recherche Google/Facebook (présence en ligne?)
   ☐ Vérifier numéro (WhatsApp Business?)
   ☐ Consulter registre commerce (si disponible)
   ☐ Vérifier zone (desservie par fournisseurs?)
   ☐ Historique: client déjà connu? (CRM)
   ```

3. **Appel de Vérification (Optionnel pour clients majeurs)**
   ```
   Script d'appel:
   "Bonjour, je suis [Nom] de DISTRI-NIGHT. Nous avons reçu 
   votre demande d'inscription. Je souhaite confirmer quelques 
   informations..."
   
   Questions:
   - Confirmez-vous gérer [Nom Établissement]?
   - Votre adresse est bien [Adresse]?
   - Quels sont vos horaires d'ouverture?
   - Quelle est votre fréquence de commande prévue?
   ```

4. **Décision**
   - **Approuver**: Cliquer "Approuver" → Email automatique envoyé
   - **Rejeter**: Cliquer "Rejeter" → Saisir raison → Email envoyé

#### Procédure Détaillée - Validation Fournisseur (Dépôt)

**Critères Plus Stricts (impact important sur plateforme)**

1. **Vérifications Obligatoires**
   ```bash
   ☐ CRITIQUE: Registre de commerce (dépôt légal)
   ☐ CRITIQUE: Autorisation vente boissons alcoolisées
   ☐ CRITIQUE: Visite physique du dépôt (requis)
   ☐ IMPORTANT: Capacité de livraison (véhicule?)
   ☐ IMPORTANT: Stock disponible (photo inventaire)
   ☐ IMPORTANT: Références clients existants
   ☐ SOUHAITABLE: Assurance responsabilité civile
   ```

2. **Visite Physique (Obligatoire)**
   ```
   Checklist Visite Dépôt:
   ☐ Localisation correspond à l'adresse déclarée
   ☐ Stock visible et conséquent (minimum requis)
   ☐ Conditions de stockage acceptables (réfrigération)
   ☐ Personnel présent et professionnel
   ☐ Moyen de livraison disponible (véhicule, moto)
   ☐ Équipements de paiement mobile (Orange/MTN/Moov)
   ☐ Photo dépôt + photo stock (archiver)
   ```

3. **Validation Documents**
   - Copie registre commerce (vérifier authenticité)
   - Autorisation préfecture (vente alcools)
   - CNI gérant (vérifier validité)
   - Photo établissement

4. **Configuration Initiale**
   ```
   Actions Post-Approbation Fournisseur:
   ☐ Affecter zones de livraison
   ☐ Configurer délais de livraison moyens
   ☐ Uploader catalogue produits initial
   ☐ Paramétrer commissions (par défaut: 2%)
   ☐ Session de formation (1h, en personne ou vidéo)
   ☐ Test commande factice (vérifier processus)
   ```

### 🔄 Gestion des Changements de Profil

#### Changement de Zone

```
Procédure:
1. Client/Fournisseur fait demande via support
2. Support crée ticket "Changement Zone"
3. Admin vérifie:
   - Nouvelle zone desservie?
   - Fournisseurs disponibles dans nouvelle zone?
4. Admin modifie dans interface
5. Notification automatique envoyée
6. Suivi satisfaction J+7
```

#### Suspension de Compte

```
Motifs de Suspension:
• Fraude confirmée
• Non-paiements répétés (>3)
• Évaluations très négatives (<2/5 sur 10+ commandes)
• Violation conditions d'utilisation
• Demande utilisateur (pause activité)

Procédure:
1. Analyser historique
2. Décision équipe (Admin + Legal)
3. Notification utilisateur (email + SMS)
4. Suspension dans système (flag "suspended")
5. Archive raison suspension
6. Processus réactivation défini (si applicable)
```

---

## Support Client

### 📞 Niveaux de Support

```
┌────────────────────────────────────────────────────┐
│              STRUCTURE SUPPORT 3 NIVEAUX           │
└────────────────────────────────────────────────────┘

NIVEAU 1 - SUPPORT UTILISATEUR (L1)
├─ Rôle: Premier contact, résolution problèmes simples
├─ SLA: Réponse < 2h, Résolution < 4h
├─ Canaux: Email, Chat, Téléphone, WhatsApp
└─ Exemples:
   • Réinitialisation mot de passe
   • Aide navigation interface
   • Problèmes connexion
   • Questions FAQ
   • Suivi commandes

NIVEAU 2 - SUPPORT TECHNIQUE (L2)
├─ Rôle: Problèmes techniques complexes
├─ SLA: Réponse < 4h, Résolution < 24h
├─ Escalade depuis: L1 après 2h sans résolution
└─ Exemples:
   • Bugs interface
   • Erreurs paiement
   • Problèmes synchronisation
   • Anomalies données
   • Performance lente

NIVEAU 3 - INGÉNIERIE (L3)
├─ Rôle: Incidents critiques, bugs système
├─ SLA: Réponse < 1h (critique), Résolution < 12h
├─ Escalade depuis: L2 si problème infrastructure
└─ Exemples:
   • Pannes serveur
   • Bugs critiques
   • Incidents sécurité
   • Corruption données
   • Urgences production
```

### 📋 Procédures Support Courantes

#### 1. Réinitialisation Mot de Passe

**Fréquence:** ~20 demandes/jour

```
PROCESSUS AUTOMATIQUE (Préféré):
1. Utilisateur clique "Mot de passe oublié"
2. Saisit email
3. Reçoit lien reset (valide 1h)
4. Crée nouveau mot de passe
5. Connexion automatique

PROCESSUS MANUEL (Si problème):
1. Support vérifie identité (nom + téléphone + email)
2. Confirme compte existe
3. Envoie lien reset manuellement depuis admin
4. Suivi: Utilisateur confirme réception sous 15min
5. Clôture ticket
```

#### 2. Commande Bloquée ou En Retard

**Fréquence:** ~5-10 cas/jour

```
DIAGNOSTIC:
├─ Étape 1: Identifier statut actuel commande
│  SELECT * FROM orders WHERE id = 'XXX';
│
├─ Étape 2: Vérifier historique transitions
│  SELECT * FROM order_activity_log WHERE order_id = 'XXX';
│
├─ Étape 3: Identifier goulot
│  • pending-offers: Pas d'offres reçues?
│  • accepted: Fournisseur contactable?
│  • preparing: Délai normal < 30min
│  • delivering: GPS tracker (futur)
│
└─ Étape 4: Action corrective
   • Contacter fournisseur (appel direct)
   • Relancer notifications
   • Proposer fournisseur alternatif (si dispo)
   • Annuler + remboursement (dernier recours)

ESCALADE:
Si délai > 2h sans nouvelle: Escalade Manager Operations
```

#### 3. Problème de Paiement

**Fréquence:** ~3-5 cas/jour

```
TYPES DE PROBLÈMES:

A) Paiement Mobile Money Échoué
   1. Vérifier numéro saisi (format +225...)
   2. Vérifier solde suffisant (demander screenshot)
   3. Contacter opérateur (Orange/MTN/Moov)
   4. Proposer alternative (autre opérateur, autre méthode)
   5. Logger incident pour analyse pattern

B) Paiement En Attente (>10min)
   1. Vérifier logs webhook paiement
   2. Contacter fournisseur paiement (API status)
   3. Vérifier transaction côté opérateur
   4. Mise à jour manuelle status si confirmé (avec proof)
   5. Incident report → DevOps

C) Double Débit
   1. Vérifier logs transactions (timestamps)
   2. Confirmer avec opérateur
   3. Initier remboursement immédiat (procédure Finance)
   4. Compensation client (geste commercial: bon 5000 FCFA)
   5. Incident critique → CTO

REMBOURSEMENT:
Délai: 24-72h selon opérateur
Suivi: Email + SMS à chaque étape
```

#### 4. Litige Client-Fournisseur

**Fréquence:** ~2 cas/jour

```
MÉDIATION DISTRI-NIGHT:

Exemples Litiges:
• Produits manquants
• Produits endommagés
• Retard livraison excessif
• Problème facturation
• Service fournisseur (impolitesse, etc.)

PROCÉDURE:
1. ÉCOUTE
   ├─ Recueillir version client
   ├─ Recueillir version fournisseur
   └─ Consulter preuves (photos, chat, timestamps)

2. ANALYSE
   ├─ Déterminer responsabilité (objectif)
   ├─ Consulter CGU/CGV
   └─ Évaluer montant litige

3. PROPOSITION
   ├─ Remboursement partiel/total
   ├─ Remplacement produits
   ├─ Bon d'achat compensatoire
   └─ Excuses formelles

4. RÉSOLUTION
   ├─ Accord parties
   ├─ Application décision
   ├─ Confirmation écrite
   └─ Clôture ticket

5. SUIVI
   ├─ Impact rating utilisateurs
   ├─ Mesures correctives fournisseur
   └─ Prévention récurrence

ESCALADE SI:
• Montant > 50,000 FCFA → Manager
• Litige récurrent même fournisseur → Review partenariat
• Menace légale → Legal Department
```

### 📊 Métriques Support

```
KPIs SUPPORT (Objectifs Mensuels):

┌────────────────────────────────────────────┐
│ Métrique              │ Cible │ Actuel    │
├───────────────────────┼───────┼───────────┤
│ Tps Réponse Moyen L1  │ < 2h  │ 1.5h  ✅  │
│ Tps Résolution L1     │ < 4h  │ 3.2h  ✅  │
│ Résolution 1er Contact│ > 70% │ 75%   ✅  │
│ Escalade vers L2      │ < 20% │ 18%   ✅  │
│ Satisfaction Support  │ > 4.5 │ 4.6/5 ✅  │
│ Tickets Réouverts     │ < 5%  │ 3%    ✅  │
└───────────────────────┴───────┴───────────┘
```

---

## Maintenance Préventive

### 🔧 Planning de Maintenance

#### Maintenance Quotidienne (Automatisée)

```
TÂCHES AUTOMATIQUES NOCTURNES (2h-4h GMT):

02:00 - Sauvegarde Base de Données
├─ Dump PostgreSQL complet
├─ Compression + Chiffrement
├─ Upload vers storage sécurisé
├─ Vérification intégrité
└─ Durée: ~15min

02:30 - Nettoyage Logs
├─ Archive logs > 30 jours
├─ Suppression logs > 90 jours
├─ Rotation fichiers logs
└─ Durée: ~5min

03:00 - Optimisation Database
├─ VACUUM tables principales
├─ ANALYZE pour statistiques
├─ Rebuild indexes fragmentés
└─ Durée: ~20min

03:30 - Génération Rapports
├─ Rapport activité J-1
├─ Métriques business
├─ Alertes anomalies
└─ Durée: ~10min

04:00 - Tests de Santé
├─ Health check endpoints
├─ Test connexions externes
├─ Validation certificats SSL
└─ Durée: ~5min
```

#### Maintenance Hebdomadaire (Dimanche 3h-5h GMT)

```
DIMANCHE MATIN (Trafic Minimal):

☐ Mise à jour dépendances sécurité (npm audit)
☐ Vérification backups semaine (restore test)
☐ Analyse performance requêtes lentes
☐ Revue logs erreurs cumulés
☐ Nettoyage fichiers temporaires
☐ Vérification certificats (expiration)
☐ Test disaster recovery (simulation)
☐ Mise à jour documentation technique
☐ Revue accès utilisateurs admin
```

#### Maintenance Mensuelle (1er Dimanche du Mois)

```
MAINTENANCE APPROFONDIE:

☐ Audit sécurité complet
☐ Revue et optimisation indexes database
☐ Analyse tendances performance (évolution)
☐ Test charge (load testing)
☐ Mise à jour dépendances non-critiques
☐ Revue logs d'accès (détection anomalies)
☐ Archivage données anciennes (>1 an)
☐ Revue et mise à jour procédures
☐ Formation équipe (nouvelles features)
☐ Réunion post-mortem incidents du mois
```

### 🛠️ Procédures de Maintenance

#### Mise à Jour Application

```
PROCÉDURE DÉPLOIEMENT (Zero-Downtime):

PHASE 1 - PRÉPARATION
├─ 1. Notification équipe (24h avant)
├─ 2. Backup complet (DB + code)
├─ 3. Tests déploiement staging
├─ 4. Validation QA
└─ 5. Préparation rollback plan

PHASE 2 - DÉPLOIEMENT
├─ 1. Mode maintenance page (optionnel)
├─ 2. Déploiement version N+1
├─ 3. Health check automatique
├─ 4. Test smoke automatisé
└─ 5. Monitoring intensif (30min)

PHASE 3 - VALIDATION
├─ 1. Tests manuels critiques
├─ 2. Vérification logs erreurs
├─ 3. Métriques performance
├─ 4. Feedback utilisateurs early adopters
└─ 5. Annonce déploiement réussi

ROLLBACK SI:
• Error rate > 5%
• Performance dégradée > 30%
• Bug critique détecté
• Feedback négatif massif

Temps Total: ~30 minutes
Downtime: 0 seconde (Blue-Green deployment)
```

---

## Gestion des Commandes

### 📦 Cycle de Vie d'une Commande

```
┌──────────────────────────────────────────────────────┐
│        MONITORING COMMANDES EN TEMPS RÉEL            │
└──────────────────────────────────────────────────────┘

DASHBOARD COMMANDES:
https://admin.distri-night.ci/orders

Vues Disponibles:
├─ TOUTES (vue globale)
├─ EN ATTENTE D'OFFRES (action: relance fournisseurs)
├─ OFFRES REÇUES (monitoring acceptation client)
├─ EN PRÉPARATION (monitoring délai)
├─ EN LIVRAISON (suivi GPS - futur)
├─ LIVRÉES NON PAYÉES (relance paiement)
└─ LITIGES (médiation)

ALERTES AUTOMATIQUES:
🔴 Commande > 2h sans offre → Contacter fournisseurs zone
🟠 Commande > 1h en préparation → Appeler fournisseur
🟡 Commande > 30min en livraison → Vérifier localisation
```

### 🎯 KPIs Commandes

```
OBJECTIFS OPÉRATIONNELS COMMANDES:

┌─────────────────────────────────────────────────┐
│ Métrique                    │ Cible  │ Actuel  │
├─────────────────────────────┼────────┼─────────┤
│ Temps réception 1ère offre  │ < 15min│ 12min ✅│
│ Taux de complétion          │ > 90%  │ 93%  ✅ │
│ Taux d'annulation           │ < 5%   │ 3%   ✅ │
│ Temps livraison moyen       │ < 45min│ 38min✅ │
│ Satisfaction livraison      │ > 4.2  │ 4.5  ✅ │
│ Commandes parfaites (*)     │ > 85%  │ 88%  ✅ │
└─────────────────────────────┴────────┴─────────┘

(*) Commandes parfaites: Livrées à l'heure, complètes, 
    sans problème, payées, bien notées
```

---

## Trésorerie et Commissions

### 💰 Gestion Financière Quotidienne

#### Réconciliation Quotidienne

```bash
PROCÉDURE RÉCONCILIATION (Fin de Journée):

1. EXPORT TRANSACTIONS
   ├─ Se connecter admin dashboard
   ├─ Finance → Transactions du Jour
   ├─ Exporter CSV (toutes transactions)
   └─ Sauvegarder: transactions_YYYY-MM-DD.csv

2. VÉRIFICATION COHÉRENCE
   ├─ Compter commandes 'paid'
   ├─ Sommer total_amount de toutes commandes
   ├─ Vérifier total = somme commandes payées
   └─ Si écart: investiguer commande par commande

3. CALCUL COMMISSIONS
   ├─ Total Client Commissions: _____ FCFA
   ├─ Total Supplier Commissions: _____ FCFA
   ├─ Revenue DISTRI-NIGHT: (client + supplier)
   └─ Vérifier vs prévisions (écart < 10%)

4. VALIDATION PAIEMENTS EXTERNES
   ├─ Orange Money: ___ transactions
   ├─ MTN Money: ___ transactions
   ├─ Moov Money: ___ transactions
   ├─ Wave: ___ transactions
   └─ Vérifier montants reçus sur comptes

5. RAPPROCHEMENT BANCAIRE
   ├─ Relevé compte Orange Money
   ├─ Relevé compte MTN Money
   ├─ Vérifier montants correspondent
   └─ Noter écarts éventuels (délais banking)

6. RAPPORT JOURNALIER
   ├─ Générer rapport automatique
   ├─ Ajouter commentaires si anomalies
   ├─ Envoyer à: finance@distri-night.ci
   └─ Archiver dans dossier comptabilité
```

#### Configuration Commissions

```
PARAMÈTRES COMMISSION (Admin Modifiable):

https://admin.distri-night.ci/settings/commissions

┌───────────────────────────────────────────────────┐
│ Type Commission        │ Taux  │ Appliqué Sur     │
├────────────────────────┼───────┼──────────────────┤
│ Client Commission      │ 2.0%  │ Montant total    │
│ Supplier Commission    │ 2.0%  │ Net après client │
│ Delivery Fee           │ Var.  │ Par zone         │
└────────────────────────┴───────┴──────────────────┘

EXEMPLE CALCUL (Commande 100,000 FCFA):
• Montant commande:        100,000 FCFA
• Commission client (2%):   -2,000 FCFA
• Net après client:         98,000 FCFA
• Commission supplier (2%): -1,960 FCFA
• Net fournisseur:          96,040 FCFA
• Revenue DISTRI-NIGHT:      3,960 FCFA (3.96%)

MODIFICATION COMMISSIONS:
⚠️  Nécessite approbation Directeur Financier
⚠️  Notification fournisseurs 15 jours avant
⚠️  Nouvelle config = nouvelles commandes seulement
```

---

## Procédures d'Escalade

### 📞 Matrice d'Escalade

```
┌──────────────────────────────────────────────────────────┐
│              PROCÉDURES D'ESCALADE INCIDENTS              │
└──────────────────────────────────────────────────────────┘

NIVEAU    GRAVITÉ          DÉLAI      CONTACT
──────────────────────────────────────────────────────────
L1        FAIBLE           < 24h      support@distri-night.ci
          • Question FAQ
          • Aide interface
          
L2        MOYENNE          < 4h       tech@distri-night.ci
          • Bug non-bloquant
          • Performance lente
          
L3        HAUTE            < 1h       devops@distri-night.ci
          • Bug bloquant
          • Erreur système
          • Perte données
          
CRITIQUE  CRITIQUE         < 15min    emergency@distri-night.ci
          • Panne totale                +225 XX XX XX XX XX (CTO)
          • Faille sécurité             +225 XX XX XX XX XX (CEO)
          • Corruption données

PROCÉDURE APPEL ASTREINTE (Critique uniquement):
1. Appeler CTO (1er essai)
2. Si pas de réponse < 5min, appeler CEO
3. En parallèle: Email + SMS + Slack tous responsables
4. Documenter tous appels et actions
```

---

## KPIs et Métriques

### 📊 Tableau de Bord Management

```
┌──────────────────────────────────────────────────────┐
│           KPIS OPÉRATIONNELS - NOVEMBRE 2025         │
├──────────────────────────────────────────────────────┤
│                                                       │
│  UTILISATEURS                                         │
│  ├─ Clients Actifs:        487  (↑ 12% vs Oct)      │
│  ├─ Fournisseurs Actifs:    23  (↑ 2 nouveaux)      │
│  ├─ Taux Approbation:      92%  (↑ 3%)              │
│  └─ NPS (Net Promoter):     68  (Bon)               │
│                                                       │
│  COMMANDES                                            │
│  ├─ Volume Mensuel:       1,847  (↑ 18%)            │
│  ├─ Panier Moyen:      87,400 F  (↑ 2,100 F)        │
│  ├─ Taux Complétion:      93.2%  (✅ Objectif)      │
│  └─ Taux Annulation:       2.8%  (✅ Excellent)     │
│                                                       │
│  FINANCIER                                            │
│  ├─ GMV (Gross Merch.):  161.5M F (↑ 21%)           │
│  ├─ Revenue:               6.2M F (↑ 19%)           │
│  ├─ Marge Moyenne:         3.8%   (Stable)          │
│  └─ Créances:              0.12M F (< 2%)           │
│                                                       │
│  OPÉRATIONS                                           │
│  ├─ Uptime:               99.94%  (✅ SLA)          │
│  ├─ Tps Réponse API:        87ms  (✅ Excellent)   │
│  ├─ Tickets Support:        124   (↓ 8%)           │
│  └─ Satisfaction:           4.6   (✅ Très bon)    │
│                                                       │
│  QUALITÉ                                              │
│  ├─ Commandes Parfaites:  88.1%  (✅ Cible)        │
│  ├─ Livraison à l'heure:  91.3%  (✅ Bon)          │
│  ├─ Rating Moyen Clients:  4.5   (Stable)          │
│  └─ Rating Moyen Suppl.:   4.7   (Excellent)       │
└──────────────────────────────────────────────────────┘
```

---

## Checklists Opérationnelles

### ✅ Checklist Quotidienne (Responsable Opérations)

```
DÉBUT DE JOURNÉE (8h00):
☐ Vérifier dashboard monitoring (statut vert?)
☐ Consulter rapport automatique de nuit
☐ Vérifier backups réussis
☐ Contrôler file approbations (< 10 en attente)
☐ Vérifier incidents support en cours
☐ Brief équipe support (5 min)

MI-JOURNÉE (12h00):
☐ Contrôler KPIs temps réel vs objectifs
☐ Vérifier commandes en attente (action si > 30min)
☐ Consulter feedback clients du matin
☐ Traiter escalades éventuelles

FIN DE JOURNÉE (18h00):
☐ Réconciliation financière
☐ Génération rapport journalier
☐ Validation métriques du jour
☐ Préparation brief lendemain
☐ Handover équipe nuit (si applicable)
```

### ✅ Checklist Hebdomadaire (Manager Opérations)

```
LUNDI MATIN:
☐ Revue métriques semaine précédente
☐ Définition objectifs semaine
☐ Réunion équipe (30 min)
☐ Planification charge travail

MERCREDI MI-JOURNÉE:
☐ Point d'avancement objectifs
☐ Ajustements si nécessaire
☐ Traitement blocages équipe

VENDREDI APRÈS-MIDI:
☐ Bilan semaine (objectifs atteints?)
☐ Rapport management (PowerPoint/PDF)
☐ Feedback équipe
☐ Planification semaine suivante
☐ Archivage documents
```

### ✅ Checklist Mensuelle (Directeur Opérations)

```
1ÈRE SEMAINE:
☐ Analyse métriques mois précédent
☐ Rapport executive summary
☐ Présentation résultats au board
☐ Définition OKRs du mois

2ÈME SEMAINE:
☐ Revue satisfaction client (NPS)
☐ Audit opérations (procédures suivies?)
☐ Formation continue équipe
☐ Mise à jour documentation

3ÈME SEMAINE:
☐ Rencontres 1-to-1 équipe
☐ Identification besoins recrutement
☐ Planification ressources
☐ Amélioration continue (Kaizen)

4ÈME SEMAINE:
☐ Préparation budget mois suivant
☐ Revue partenaires (fournisseurs)
☐ Innovations et optimisations
☐ Rapport mensuel final
```

---

## 📞 Contacts Opérationnels d'Urgence

```
ÉQUIPE OPÉRATIONNELLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Directeur Opérations:  +225 XX XX XX XX XX
Manager Support:       +225 XX XX XX XX XX
Manager Technique:     +225 XX XX XX XX XX
Responsable Finance:   +225 XX XX XX XX XX

ASTREINTE 24/7:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Astreinte Technique:   +225 XX XX XX XX XX
Astreinte Support:     +225 XX XX XX XX XX

PARTENAIRES EXTERNES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Supabase Support:      support@supabase.io
Orange Money:          +225 XXXX
MTN Money:             +225 XXXX
Hébergement (Vercel):  support@vercel.com
```

---

**Document maintenu par:** Équipe Opérations DISTRI-NIGHT  
**Dernière mise à jour:** Novembre 2025  
**Prochaine révision:** Janvier 2026

---

*Ce guide opérationnel est un document vivant, mis à jour régulièrement selon l'évolution de la plateforme et les retours d'expérience terrain.*

**🌙 DISTRI-NIGHT - Excellence opérationnelle 24/7**
