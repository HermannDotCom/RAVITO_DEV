# 🌙 DISTRI-NIGHT

**Plateforme de distribution nocturne de boissons à Abidjan, Côte d'Ivoire**

## 📖 Description

DISTRI-NIGHT est une application web moderne qui connecte les bars, maquis et restaurants avec les dépôts de boissons pour des livraisons nocturnes rapides et efficaces.

### 🎯 Fonctionnalités Principales

- **Pour les Clients (Gérants)** : Commande en ligne 24/7, suivi temps réel
- **Pour les Fournisseurs (Dépôts)** : Gestion des livraisons, optimisation des tournées
- **Pour les Admins** : Analytics, gestion globale, trésorerie

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase (déjà configuré)

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd distri-night

# Installer les dépendances
npm install

# Lancer l'application
npm run dev
```

L'application sera disponible sur : **http://localhost:5173**

---

## 🔐 Comptes de Test

Voir le fichier **[CREDENTIALS.txt](./CREDENTIALS.txt)** pour les identifiants complets.

### Accès Rapides

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@distri-night.ci | Admin@2025! |
| **Client** | client1@test.ci | Client@2025! |
| **Supplier** | supplier1@test.ci | Supplier@2025! |

📄 **Documentation complète** : [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md)

---

## 📁 Structure du Projet

```
distri-night/
├── src/
│   ├── components/          # Composants React
│   │   ├── Admin/          # Dashboard admin
│   │   ├── Client/         # Interface client
│   │   ├── Supplier/       # Interface fournisseur
│   │   ├── Auth/           # Authentification
│   │   ├── Search/         # Recherche & autocomplete
│   │   ├── Filters/        # Filtres avancés
│   │   ├── Navigation/     # Navigation & breadcrumbs
│   │   └── Accessibility/  # Composants accessibles
│   ├── context/            # React Context (état global)
│   ├── hooks/              # Custom hooks
│   ├── services/           # Services API
│   ├── utils/              # Utilitaires
│   └── types/              # Types TypeScript
├── supabase/
│   ├── migrations/         # Migrations SQL
│   └── functions/          # Edge Functions
└── docs/                   # Documentation
```

---

## 🛠️ Stack Technique

### Frontend
- **React 18** - Framework UI
- **TypeScript 5** - Type safety
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Styling moderne
- **Lucide React** - Icons

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Row Level Security
  - Edge Functions (Deno)
  - Realtime subscriptions

### Testing
- **Vitest** - Test runner
- **Testing Library** - Tests composants
- **Coverage** - Rapports de couverture

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [CREDENTIALS.txt](./CREDENTIALS.txt) | Identifiants de test formatés |
| [TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md) | Guide complet des comptes |
| [QUICK_ACCESS.md](./QUICK_ACCESS.md) | Accès rapides & scénarios |
| [IMPROVEMENTS.md](./IMPROVEMENTS.md) | Features avancées |
| [PHASE3_EDGE_FUNCTIONS.md](./PHASE3_EDGE_FUNCTIONS.md) | Documentation Backend |
| [PHASE4_QUALITY.md](./PHASE4_QUALITY.md) | Tests & Qualité |

---

## ✨ Features Avancées

### 🔍 Recherche & Filtres
- Recherche multi-champs avec autocomplete
- Filtres avancés (prix, alcool, catégorie)
- Debouncing et performance optimisée

### 🌓 Mode Sombre
- Toggle light/dark
- Persistance localStorage
- Détection préférence système

### ♾️ Infinite Scroll
- Pagination automatique
- Performance optimisée
- UX fluide

### ⚡ Optimistic UI
- Feedback instantané
- Rollback automatique sur erreur
- Meilleure UX

### 📊 Export de Données
- CSV (Excel compatible)
- Excel natif (.xls)
- JSON
- Impression directe

### 🧭 Navigation
- Breadcrumbs (fil d'Ariane)
- Menu responsive
- Historique de navigation

---

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec UI
npm run test:ui

# Couverture
npm run test:coverage
```

**Coverage actuel :** 90%+ sur les contextes critiques

---

## 🏗️ Build & Déploiement

```bash
# Build production
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

---

## 🔒 Sécurité

### Authentification
- Supabase Auth (email/password)
- JWT tokens
- Session management
- Password policies

### Base de Données
- Row Level Security (RLS) sur toutes les tables
- Policies restrictives par défaut
- Service role séparé pour edge functions

### Edge Functions
- JWT verification
- Input validation
- CORS headers
- Error handling

---

## 🌐 Architecture

### Client → Server

```
┌─────────────┐
│   React     │  ← Frontend (Client-side)
│  TypeScript │
└──────┬──────┘
       │
       │ REST API / Realtime
       ▼
┌─────────────────┐
│  Edge Functions │  ← Serverless (Deno)
│   - Orders      │
│   - Payments    │
│   - Notifs      │
└──────┬──────────┘
       │
       │ PostgreSQL + Auth
       ▼
┌─────────────┐
│  Supabase   │  ← Backend as a Service
│  - Database │
│  - Auth     │
│  - Realtime │
└─────────────┘
```

---

## 📊 Données

### Tables Principales
- `profiles` - Utilisateurs (admins, clients, suppliers)
- `products` - Catalogue de produits
- `orders` - Commandes
- `order_items` - Détails commandes
- `ratings` - Évaluations
- `delivery_zones` - Zones de livraison
- `supplier_zones` - Fournisseurs par zone
- `commission_settings` - Paramètres commissions
- `notifications` - Notifications temps réel

### Edge Functions
- `order-management` - Gestion cycle de vie commandes
- `payment-webhook` - Webhooks paiements mobiles
- `notifications` - Notifications real-time

---

## 🎨 UI/UX

### Design Principles
- Mobile-first
- Accessible (WCAG 2.1 AA)
- Dark mode support
- Performance optimisée
- Intuitive navigation

### Components
- Responsive grid system
- Tailwind utility classes
- Custom hooks
- Context providers
- Loading states

---

## 🔧 Configuration

### Variables d'Environnement

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: { /* palette */ }
      }
    }
  }
}
```

---

## 🤝 Contribution

### Development Workflow

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Code Style

- TypeScript strict mode
- ESLint rules
- Prettier formatting
- Conventional commits

---

## 📝 Changelog

### v1.0.0 (2025-10-04)

**Phase 1 - Database & Setup**
- ✅ Supabase integration
- ✅ Database schema
- ✅ Row Level Security
- ✅ Initial data seeding

**Phase 2 - Core Features**
- ✅ Authentication (email/password)
- ✅ Client dashboard
- ✅ Supplier dashboard
- ✅ Admin dashboard
- ✅ Order flow
- ✅ Product catalog

**Phase 3 - Backend Logic**
- ✅ Edge Functions (3 functions)
- ✅ Order management
- ✅ Payment webhooks
- ✅ Real-time notifications

**Phase 4 - Quality**
- ✅ Testing infrastructure (Vitest)
- ✅ Unit tests (20+ tests)
- ✅ Accessibility (WCAG AA)
- ✅ Performance optimizations

**Improvements**
- ✅ Search & autocomplete
- ✅ Advanced filters
- ✅ Breadcrumbs navigation
- ✅ Dark mode
- ✅ Infinite scroll
- ✅ Optimistic UI
- ✅ Data export (CSV/Excel/JSON)

---

## 📞 Support

Pour toute question ou problème :

1. Consulter la [documentation](./docs/)
2. Vérifier les [issues GitHub](https://github.com/...)
3. Contacter l'équipe de développement

---

## 📄 License

Ce projet est sous licence propriétaire. Tous droits réservés.

---

## 🙏 Remerciements

- **Supabase** - Backend infrastructure
- **React Team** - Framework UI
- **Tailwind CSS** - Styling system
- **Vite** - Build tool
- **TypeScript** - Type safety

---

## 🎯 Roadmap

### Court terme (Q1 2025)
- [ ] PWA support
- [ ] Push notifications
- [ ] Analytics integration
- [ ] i18n (FR/EN)

### Moyen terme (Q2 2025)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] AI recommendations
- [ ] Payment integration

### Long terme (Q3-Q4 2025)
- [ ] Multi-city support
- [ ] Franchise management
- [ ] API public
- [ ] Partner integrations

---

**Développé avec ❤️ pour révolutionner la distribution nocturne en Côte d'Ivoire**

**Status :** ✅ Production Ready
**Version :** 1.0.0
**Date :** 2025-10-04

🌙 **DISTRI-NIGHT - La nuit n'a jamais été aussi productive !**
