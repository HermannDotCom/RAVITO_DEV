# 🚚 RAVITO

**Le ravitaillement qui ne dort jamais** 🌙

Plateforme de ravitaillement B2B 24h/24 connectant les établissements CHR (Cafés, Hôtels, Restaurants) avec les dépôts de boissons à Abidjan, Côte d'Ivoire. 

[![Version](https://img.shields.io/badge/version-1.5.7-orange.svg)](https://github.com/HermannDotCom/RAVITO_DEV/releases/tag/v1.5.7)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E. svg)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB.svg)](https://react.dev)

---

## 📖 À propos

RAVITO révolutionne la chaîne d'approvisionnement des boissons en Côte d'Ivoire en offrant : 

- **Pour les Clients (Gérants CHR)** : Commandes en ligne 24/7, comparaison d'offres, suivi en temps réel
- **Pour les Fournisseurs (Dépôts)** : Gestion des commandes, équipe de livraison, tarification personnalisée
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
│   │   └── Team/           # Gestion d'équipe
│   ├── context/            # React Context (état global)
│   ├── hooks/              # Custom hooks
│   ├── services/           # Services API
│   ├── utils/              # Utilitaires
│   └── types/              # Types TypeScript
├── supabase/
│   ├── migrations/         # Migrations SQL
│   └── functions/          # Edge Functions
├── docs/                   # Documentation
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

---

## ✨ Fonctionnalités Principales

### 🛒 Système de Commandes
- Création de commandes avec sélection de zone
- Système d'offres fournisseurs avec comparaison
- Paiement et suivi de livraison

### 👥 Gestion d'Équipe
- Organisations multi-utilisateurs
- Rôles et permissions granulaires
- Invitation de membres (Manager, Livreur, etc.)

### 🚚 Livraison
- Assignation de livreurs
- Code de confirmation 8 caractères
- Suivi GPS (en développement)

### 💰 Trésorerie
- Historique des transactions
- Exports CSV
- Dashboard analytics

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
| [Flux de commande](./docs/features/order-flow.md) | Documentation du système de commandes |
| [Gestion d'équipe](./docs/features/team-management.md) | Organisations et permissions |
| [Déploiement](./docs/deployment/strategy.md) | Stratégie de déploiement |
| [Backups Supabase](./docs/backups/) | Points de restauration BDD |

---

## 🔄 Versions

| Version | Date | Highlights |
|---------|------|------------|
| [v1.5.7](https://github.com/HermannDotCom/RAVITO_DEV/releases/tag/v1.5.7) | 29/12/2025 | Fix inscription, triggers Auth, interface Admin |
| [v1.5.6](https://github.com/HermannDotCom/RAVITO_DEV/releases/tag/v1.5.6) | 27/12/2025 | Géolocalisation, emails complets |
| [v1.5.5](https://github.com/HermannDotCom/RAVITO_DEV/releases/tag/1.5.5) | 26/12/2025 | Restauration stabilité |

📋 [Voir toutes les releases](https://github.com/HermannDotCom/RAVITO_DEV/releases)

---

## 🚀 Roadmap

| Version | Description | Statut |
|---------|-------------|--------|
| v1.5.8 | Fix acceptation d'offres | 🔴 En cours |
| v1.6.0 | Intégration paiement Mobile Money | 📅 Planifié |
| **v1.7.0** | **🚀 MEP MVP Production** | 📅 Planifié |

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
