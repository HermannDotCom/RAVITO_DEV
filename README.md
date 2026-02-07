# 🚚 RAVITO

**Le ravitaillement qui ne dort jamais** 🌙

Plateforme tout-en-un pour les établissements CHR (Cafés, Hôtels, Restaurants) en Côte d'Ivoire : Gestion d'activité digitale et marketplace de ravitaillement B2B 24h/24.

[![Version](https://img.shields.io/badge/version-1.6.3-orange.svg)](https://github.com/HermannDotCom/RAVITO_DEV/releases/tag/v1.6.3)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E.svg)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB.svg)](https://react.dev)

---

## 📖 À propos

RAVITO est LA solution digitale complète pour les bars, maquis et restaurants ivoiriens avec **2 modules complémentaires** :

### 🏪 RAVITO Gestion ✅ Disponible maintenant
Module de gestion d'activité pour digitaliser votre établissement :
- **Cahier digital** : Enregistrez toutes vos ventes en quelques clics
- **Gestion des stocks** : Suivez votre inventaire en temps réel avec alertes de rupture
- **Suivi des dépenses** : Catégorisez et analysez toutes vos dépenses
- **Crédits clients** : Gérez les crédits sans plus jamais oublier un paiement
- **Rapports détaillés** : Visualisez vos performances avec des graphiques et statistiques
- **Mode offline** : Travaillez sans connexion, synchronisation automatique

**Tarification RAVITO Gestion :**
- Mensuel : **6 000 FCFA/mois**
- Semestriel : **30 000 FCFA/6 mois** (1 mois offert) - Recommandé
- Annuel : **48 000 FCFA/an** (4 mois offerts)
- 🎁 **30 jours d'essai gratuit** pour tous les nouveaux utilisateurs
- Paiement : Espèces, Wave, Orange Money, MTN Money

### 🚀 RAVITO Marketplace - Lancement le 14 mars 2026
Plateforme de ravitaillement B2B pour commander vos boissons 24h/24 :
- **Pour les Clients** : Commandes en ligne 24/7, comparaison d'offres, suivi en temps réel
- **Pour les Fournisseurs** : Gestion des commandes, équipe de livraison, tarification personnalisée
- **Pour les Admins** : Supervision complète, analytics, gestion des utilisateurs

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase configuré

### Installation

```bash
# Cloner le repository
git clone https://github.com/HermannDotCom/RAVITO_DEV. git
cd RAVITO_DEV

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# Lancer l'application
npm run dev
```

L'application sera disponible sur :  **http://localhost:5173**

---

## 🔐 Comptes de Test

📄 [Documentation complète des comptes de test](./docs/getting-started/test-accounts.md)

---

## 📁 Structure du Projet

```
ravito/
├── src/
│   ├── components/          # Composants React
│   │   ├── Admin/          # Interface administrateur
│   │   ├── Client/         # Interface client CHR
│   │   ├── Supplier/       # Interface fournisseur
│   │   ├── Auth/           # Authentification
│   │   ├── Team/           # Gestion d'équipe
│   │   ├── Activity/       # Module Gestion Activité
│   │   ├── Subscription/   # Système d'abonnement
│   │   └── Landing/        # Pages landing
│   ├── pages/
│   │   ├── Landing/        # Landing pages (Gestion, Marketplace)
│   │   └── Legal/          # Pages légales (CGU, CGV)
│   ├── context/            # React Context (état global)
│   ├── hooks/              # Custom hooks
│   ├── services/           # Services API
│   ├── utils/              # Utilitaires
│   └── types/              # Types TypeScript
├── supabase/
│   ├── migrations/         # Migrations SQL
│   └── functions/          # Edge Functions
├── docs/                   # Documentation
│   ├── testing/            # Recettes de tests
│   └── backups/            # Backups Supabase
└── public/                 # Assets statiques
```

---

## 🛠️ Stack Technique

| Catégorie | Technologies |
|-----------|--------------|
| **Frontend** | React 18, TypeScript 5, Vite, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL, Auth, RLS, Edge Functions) |
| **Cartographie** | Leaflet, OpenStreetMap |
| **Emails** | Resend |
| **Monitoring** | Sentry |
| **Déploiement** | Vercel |
| **PWA** | Service Workers, Cache API, IndexedDB |

---

## ✨ Fonctionnalités Principales

### 🏪 Module RAVITO Gestion (Disponible)
- **Cahier Digital** : Enregistrement des ventes avec calcul automatique
- **Gestion Stocks** : Inventaire en temps réel, alertes de rupture, historique
- **Suivi Dépenses** : Catégorisation, filtres, exports PDF
- **Crédits Clients** : Suivi des crédits, rappels automatiques, historique
- **Rapports & Analytics** : KPIs, graphiques, exports personnalisés
- **Mode Offline** : Fonctionnement sans connexion avec synchronisation auto
- **Système d'abonnement** : Essai gratuit 30 jours, 3 plans tarifaires

### 🚀 Module RAVITO Marketplace (Mars 2026)
- **Système de Commandes** : Création de commandes 24/7 avec sélection de zone
- **Offres Fournisseurs** : Comparaison et sélection des meilleures offres
- **Gestion d'Équipe** : Organisations multi-utilisateurs, rôles et permissions
- **Livraison** : Assignation de livreurs, codes de confirmation, suivi GPS
- **Trésorerie** : Historique transactions, exports CSV, dashboard analytics

---

## 📊 Business Model

Les taux de commission sont **configurables** par l'administrateur :

| Commission | Configurable via |
|------------|------------------|
| Client | Admin → Paramètres → Paramètres financiers |
| Fournisseur | Admin → Paramètres → Paramètres financiers |

> **Note** : Les valeurs actuelles sont 4% (client) et 1% (fournisseur) 

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Installation](./docs/getting-started/installation.md) | Guide d'installation |
| [Gestion Activité](./docs/ACTIVITY_MANAGEMENT_MODULE.md) | Module de gestion d'activité |
| [Système d'abonnement](./docs/RAVITO_GESTION_SUBSCRIPTION_SYSTEM.md) | Abonnements et tarification |
| [Recette de tests](./docs/testing/RECETTE_TESTS.md) | Validation MEP |
| [Flux de commande](./docs/features/order-flow.md) | Système de commandes Marketplace |
| [Gestion d'équipe](./docs/features/team-management.md) | Organisations et permissions |
| [Déploiement](./docs/deployment/strategy.md) | Stratégie de déploiement |
| [Backups Supabase](./docs/backups/) | Points de restauration BDD |

---

## 🔄 Versions

| Version | Date | Highlights |
|---------|------|------------|
| [v1.6.3](https://github.com/HermannDotCom/RAVITO_DEV/releases/tag/v1.6.3) | 14/02/2026 | 🚀 **MEP RAVITO Gestion** - Landing Page, Documentation complète, Tarifs finaux |
| [v1.6.0](https://github.com/HermannDotCom/RAVITO_DEV/releases/tag/v1.6.0) | 03/02/2026 | Système d'abonnement complet, Module Gestion Activité |
| [v1.5.7](https://github.com/HermannDotCom/RAVITO_DEV/releases/tag/v1.5.7) | 29/12/2025 | Fix inscription, triggers Auth, interface Admin |
| [v1.5.6](https://github.com/HermannDotCom/RAVITO_DEV/releases/tag/v1.5.6) | 27/12/2025 | Géolocalisation, emails complets |

📋 [Voir toutes les releases](https://github.com/HermannDotCom/RAVITO_DEV/releases)

---

## 🚀 Roadmap

| Version | Description | Date | Statut |
|---------|-------------|------|--------|
| **v1.6.3** | **🎯 MEP RAVITO Gestion** | 14 février 2026 | ✅ En cours |
| v1.7.0 | Module Gestion - Fonctionnalités avancées | Mars 2026 | 📅 Planifié |
| **v2.0.0** | **🚀 Launch RAVITO Marketplace** | **14 mars 2026** | 📅 Planifié |
| v2.1.0 | Intégration paiement Mobile Money | Avril 2026 | 📅 Planifié |

---

## 📱 Progressive Web App (PWA)

RAVITO Gestion est une PWA complète :
- ✅ **Installation** : Installable sur mobile et desktop
- ✅ **Mode Offline** : Fonctionne sans connexion Internet
- ✅ **Synchronisation** : Sync automatique des données au retour online
- ✅ **Notifications** : Rappels et alertes push
- ✅ **Performance** : Chargement rapide avec mise en cache

---

## 🤝 Contribution

Ce projet est propriétaire.  Pour toute contribution, contactez l'équipe RAVITO. 

---

## 📞 Support

- **Email** : support@ravito.ci
- **Documentation** : [docs/](./docs/)

---

## 📄 Licence

Propriétaire - © 2025 RAVITO.  Tous droits réservés. 

---

<p align="center">
  <img src="./public/Logo_Ravito_avec_slogan.png" alt="RAVITO" width="200">
  <br>
  <strong>Le ravitaillement qui ne dort jamais</strong> 🌙
</p>
