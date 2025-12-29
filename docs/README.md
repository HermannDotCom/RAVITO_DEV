# 📚 Documentation RAVITO

Bienvenue dans la documentation complète de RAVITO, la plateforme B2B de ravitaillement 24h/24 pour les établissements CHR à Abidjan.

---

## 🗂️ Structure de la Documentation

### 🚀 Getting Started

Documentation pour démarrer rapidement avec RAVITO.

- **[Installation](./getting-started/installation.md)** - Guide d'installation complet
- **[Comptes de Test](./getting-started/test-accounts.md)** - Informations de connexion pour les tests

### ✨ Features

Documentation des fonctionnalités principales de l'application.

- **[Flux de Commande](./features/order-flow.md)** - Système d'offres et de commandes
- **[Gestion d'Équipe](./features/team-management.md)** - Organisations et permissions

### 🔧 Technical

Documentation technique pour les développeurs.

- **[Tests et Qualité](./technical/testing.md)** - Infrastructure de tests, accessibilité, performance

### 🚀 Deployment

Guides de déploiement et stratégies.

- **[Stratégie de Déploiement](./deployment/strategy.md)** - Architecture multi-environnements

### 🔌 Integrations

Documentation des intégrations externes.

- **[Resend Setup](./RESEND_SETUP.md)** - Configuration de l'envoi d'emails
- **[Location Picker](./LOCATION_PICKER_GUIDE.md)** - Guide du sélecteur de localisation

### 💾 Backups

Points de restauration de la base de données Supabase.

- **[Backups Supabase](./backups/)** - Archives des migrations et états de la BDD

### 📦 Archive

Documentation obsolète conservée pour référence historique.

- Documents archivés des versions précédentes

---

## 🔗 Liens Rapides

### Pour Développeurs

- [Guide d'Installation](./getting-started/installation.md)
- [Tests et Qualité](./technical/testing.md)
- [Stratégie de Déploiement](./deployment/strategy.md)

### Pour Testeurs

- [Comptes de Test](./getting-started/test-accounts.md)
- [Flux de Commande](./features/order-flow.md)

### Pour Administrateurs

- [Gestion d'Équipe](./features/team-management.md)
- [Backups Supabase](./backups/)

---

## 📖 Documentation par Rôle

### 👨‍💼 Administrateur

En tant qu'administrateur, vous avez accès à :
- Dashboard analytics complet
- Gestion des utilisateurs et approbations
- Gestion du catalogue de produits
- Paramètres financiers (commissions configurables)
- Gestion des zones de livraison
- Trésorerie et exports de données

### 👤 Client (CHR)

En tant que client, vous pouvez :
- Parcourir le catalogue de produits
- Créer des commandes avec sélection de zone
- Comparer les offres des fournisseurs
- Suivre vos livraisons en temps réel
- Évaluer les fournisseurs
- Gérer votre équipe (jusqu'à 2 membres)

### 🚚 Fournisseur (Dépôt)

En tant que fournisseur, vous pouvez :
- Voir les commandes disponibles dans vos zones
- Créer des offres personnalisées
- Gérer vos livraisons actives
- Assigner des livreurs à vos équipes
- Voir vos statistiques de performance
- Gérer votre équipe (jusqu'à 2 membres)

---

## 🛠️ Stack Technique

| Catégorie | Technologies |
|-----------|--------------|
| **Frontend** | React 18, TypeScript 5, Vite, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL, Auth, RLS, Edge Functions) |
| **Cartographie** | Leaflet, OpenStreetMap |
| **Emails** | Resend |
| **Monitoring** | Sentry |
| **Tests** | Vitest, Playwright, Testing Library |
| **Déploiement** | Vercel |

---

## 📞 Support

Pour toute question ou problème :

- 📧 **Email** : support@ravito.ci
- 📚 **Documentation** : Ce dossier docs/
- 🐛 **Issues** : [GitHub Issues](https://github.com/HermannDotCom/RAVITO_DEV/issues)
- 🏠 **README Principal** : [../README.md](../README.md)

---

## 🔄 Mises à Jour

Cette documentation est maintenue à jour avec chaque version de RAVITO.

**Dernière mise à jour** : Version 1.5.7 (29 Décembre 2025)

Pour voir l'historique complet des versions : [Releases GitHub](https://github.com/HermannDotCom/RAVITO_DEV/releases)

---

**Bonne lecture !** 📖
