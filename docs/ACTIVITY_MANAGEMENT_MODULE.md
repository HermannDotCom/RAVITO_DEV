# Module "Gestion Activité" — Digitalisation du Cahier de Suivi CHR

## Vue d'ensemble

Ce module digitalise le suivi quotidien des établissements CHR (Maquis, Bars, Restaurants) en remplaçant les cahiers papier par une solution numérique complète.

## Objectifs Business

### Pour le Gérant
- Digitaliser le suivi quotidien (inventaire, casiers, caisse)
- Gagner du temps et réduire les erreurs de calcul
- Obtenir des alertes automatiques (stocks faibles, écarts de caisse)

### Pour le Propriétaire
- Outil de contrôle anti-fraude à distance
- Visibilité en temps réel sur l'activité
- Historique des opérations consultable

### Pour RAVITO
- Collecte de données sur les habitudes de consommation
- Optimisation des livraisons basée sur les données réelles
- Meilleure compréhension du marché CHR

## Architecture Technique

### 1. Base de Données

#### Tables Créées

**`establishment_products`**
- Stocke les prix de vente au client final (différents des prix d'achat RAVITO)
- Permet d'alerter sur les stocks minimum
- Un produit par organisation

**`daily_sheets`**
- Feuille de journée unique par date et par établissement
- Statut: `open` (modifiable) ou `closed` (verrouillée)
- Calculs automatiques du CA théorique et écart de caisse

**`daily_stock_lines`**
- Lignes de stock par produit et par jour
- Report automatique du stock final J-1 comme stock initial J
- Synchronisation automatique des livraisons RAVITO

**`daily_packaging`**
- Suivi des casiers par type (C12, C24, C12V, etc.)
- Détection automatique des écarts (pertes/surplus)
- Report automatique du comptage J-1

**`daily_expenses`**
- Dépenses du jour avec catégorisation
- Mise à jour automatique du total dans la feuille

#### Fonctions SQL

**`create_daily_sheet_with_carryover(organization_id, date)`**
- Crée une nouvelle feuille de journée
- Reporte automatiquement les stocks finaux de J-1
- Initialise les casiers et produits actifs

**`sync_ravito_deliveries_to_daily_sheet(sheet_id)`**
- Synchronise les livraisons RAVITO du jour
- Met à jour `ravito_supply` dans les lignes de stock
- Met à jour `qty_received` pour les casiers

#### Sécurité (RLS)
- Toutes les tables ont des politiques RLS activées
- Accès limité aux membres de l'organisation
- Intégration avec le système de gestion d'équipe existant

### 2. Services TypeScript

**`dailySheetService.ts`**

Opérations disponibles:
```typescript
// Gestion des feuilles
getOrCreateDailySheet(organizationId, date)
closeDailySheet(sheetId, closeData, userId)

// Gestion des stocks
getDailyStockLines(sheetId)
updateStockLine(lineId, data)

// Gestion des casiers
getDailyPackaging(sheetId)
updatePackaging(packagingId, data)

// Gestion des dépenses
getDailyExpenses(sheetId)
addExpense(sheetId, expenseData)
deleteExpense(expenseId, sheetId)

// Synchronisation
syncRavitoDeliveries(sheetId)

// Configuration produits
getEstablishmentProducts(organizationId)
upsertEstablishmentProduct(productData)
```

### 3. Composants React

**Structure des fichiers:**
```
src/components/Client/Activity/
├── ActivityPage.tsx          # Page principale avec navigation par onglets
├── StocksTab.tsx             # Gestion des stocks boissons
├── PackagingTab.tsx          # Suivi des casiers
├── CashTab.tsx               # Gestion de la caisse
├── SummaryTab.tsx            # Synthèse et clôture
├── ExpenseModal.tsx          # Modal d'ajout de dépense
├── ProductConfigModal.tsx    # Configuration des produits (TODO)
└── hooks/
    └── useActivityManagement.ts  # Hook principal de gestion d'état
```

**ActivityPage** - Page principale
- Sélecteur de date avec désactivation si journée clôturée
- 4 onglets: Stocks, Casiers, Caisse, Synthèse
- Indicateur de statut (ouvert/clôturé)
- Gestion des erreurs et états de chargement

**StocksTab** - Suivi des stocks
- Affichage du stock initial (auto-reporté)
- Entrées RAVITO (auto-synchronisées)
- Saisie des achats externes et stock final
- Calcul automatique des ventes et CA
- Bouton de synchronisation RAVITO
- Vue mobile et desktop

**PackagingTab** - Suivi des casiers
- Comptage matin (pleins/vides)
- Mouvements (reçus/rendus)
- Saisie du comptage soir
- Détection automatique des écarts
- Alertes visuelles en cas de discordance

**CashTab** - Gestion de caisse
- Affichage du CA théorique
- Liste des dépenses avec catégories
- Ajout/suppression de dépenses
- Calcul de la caisse attendue
- Affichage de l'écart si journée clôturée

**SummaryTab** - Synthèse et clôture
- Récapitulatif global (CA, dépenses, caisse)
- État de complétude des données
- Alertes (stocks faibles, casiers manquants)
- Workflow de clôture avec confirmation
- Saisie du montant compté et notes
- **Action irréversible**

### 4. Hook Custom - useActivityManagement

Gère tout l'état et les opérations:
```typescript
const {
  // État
  currentDate,
  sheet,
  stockLines,
  packaging,
  expenses,
  establishmentProducts,
  loading,
  error,
  syncing,
  calculations, // Totaux et alertes

  // Actions
  handleUpdateStockLine,
  handleUpdatePackaging,
  handleAddExpense,
  handleDeleteExpense,
  handleCloseSheet,
  handleSyncDeliveries,
  handleChangeDate,
  reload
} = useActivityManagement({
  organizationId,
  userId,
  initialDate
});
```

## Workflow Utilisateur

### Workflow Quotidien

**1. Matin (Ouverture)**
- L'utilisateur ouvre la page "Gestion Activité"
- Sélectionne la date du jour (par défaut)
- Le système crée automatiquement la feuille avec report de J-1
- Stock initial et casiers matin sont pré-remplis

**2. Pendant la journée**
- Enregistrement des achats externes (hors RAVITO)
- Ajout des dépenses au fur et à mesure
- Synchronisation des livraisons RAVITO (bouton)

**3. Soir (Clôture)**
- Onglet **Stocks**: Saisie du stock final pour chaque produit
- Onglet **Casiers**: Comptage des casiers pleins et vides
- Onglet **Caisse**: Vérification des dépenses
- Onglet **Synthèse**: 
  - Vérification de la complétude (tous les stocks et casiers comptés)
  - Clic sur "Clôturer la Journée"
  - Saisie du montant de caisse compté
  - Ajout de notes optionnelles
  - Confirmation (irréversible)

**4. Après clôture**
- La journée devient en lecture seule
- L'écart de caisse est affiché
- Les alertes restent visibles
- Les données sont archivées pour le propriétaire

### Calculs Automatiques

#### Stock et Ventes
```
Ventes = Stock Initial + Entrées RAVITO + Achats Externes - Stock Final
CA = Ventes × Prix de Vente
```

#### Casiers
```
Total Matin = Pleins Matin + Vides Matin
Total Soir = Pleins Soir + Vides Soir
Écart = Total Soir - Total Matin

⚠️ Écart ≠ 0 → ALERTE (perte ou surplus)
```

#### Caisse
```
Caisse Attendue = Fond de Caisse + CA Théorique - Dépenses
Écart de Caisse = Caisse Comptée - Caisse Attendue

✅ Écart > 0 → Surplus (affiché en vert)
❌ Écart < 0 → Manque (affiché en rouge)
```

## Design Mobile-First

### Principes
- Interface optimisée pour smartphones (usage principal)
- Tables transformées en cartes pour mobile
- Boutons tactiles de taille appropriée
- Navigation par onglets claire
- Formulaires simples et rapides

### Responsive Breakpoints
- **Mobile**: < 640px (vue cartes)
- **Tablet**: 640px - 1024px (vue mixte)
- **Desktop**: > 1024px (vue tableau)

## Sécurité et Permissions

### Row Level Security (RLS)
- Accès limité aux membres de l'organisation
- Vérification côté base de données
- Impossible de voir les données d'autres établissements

### Rôles et Permissions
- **Owner**: Accès complet (lecture/écriture/clôture)
- **Manager**: Accès complet si autorisé dans `allowed_pages`
- **Autres membres**: Accès selon permissions d'équipe

### Audit Trail
- Chaque clôture enregistre `closed_by` et `closed_at`
- Timestamps sur toutes les modifications
- Historique immuable après clôture

## Intégration avec RAVITO

### Synchronisation des Livraisons
- Détection automatique des commandes livrées du jour
- Mise à jour de `ravito_supply` dans les stocks
- Récupération du `packaging_snapshot` des commandes
- Mise à jour de `qty_received` pour les casiers

### Données Remontées
- Habitudes de consommation par produit
- Fréquence des achats externes (concurrence)
- Écarts de caisse (indicateur de satisfaction)
- Rotation des stocks

## TODO / Améliorations Futures

### Court Terme
1. **ProductConfigModal** - Implémenter la configuration des produits
   - Liste de tous les produits RAVITO
   - Saisie des prix de vente
   - Configuration des alertes de stock
   - Activation/désactivation de produits

2. **Tests** - Ajouter des tests unitaires et d'intégration
   - Tests des services
   - Tests des composants React
   - Tests des fonctions SQL

3. **Documentation** - Enrichir la documentation
   - Guide utilisateur illustré
   - Vidéos de démonstration
   - FAQ

### Moyen Terme
1. **Analytics Dashboard** - Tableau de bord propriétaire
   - Graphiques de CA par période
   - Évolution des stocks
   - Analyse des écarts de caisse
   - Comparaison inter-établissements

2. **Alertes Push** - Notifications en temps réel
   - Stock critique (< minimum)
   - Écart de caisse important
   - Rappel de clôture journée ouverte

3. **Export de Données** - Export Excel/PDF
   - Rapport journalier
   - Rapport mensuel
   - Inventaire

### Long Terme
1. **IA Prédictive** - Prédiction des besoins
   - Suggestion de commandes automatique
   - Alerte sur anomalies (pic/creux inhabituel)
   - Optimisation des stocks

2. **Intégration Comptable** - Export comptable
   - Format OHADA
   - Génération des écritures
   - Interface avec logiciels comptables

3. **Mode Hors Ligne** - Fonctionnement sans internet
   - PWA avec synchronisation différée
   - Stockage local des données
   - Sync automatique à la reconnexion

## Installation et Déploiement

### Prérequis
- PostgreSQL avec Supabase
- Node.js 18+
- npm ou yarn

### Migration Base de Données
```bash
# Appliquer la migration
supabase migration up

# Ou avec psql
psql -U postgres -d ravito_db -f supabase/migrations/20260111035732_create_activity_management_tables.sql
```

### Build et Déploiement
```bash
# Installer les dépendances
npm install

# Build de production
npm run build

# Démarrer le serveur
npm run preview
```

### Configuration
Aucune configuration supplémentaire requise. Le module utilise:
- Les credentials Supabase existants
- Le système d'authentification en place
- Les organizations et team management existants

## Support et Contact

Pour toute question ou problème:
- **Email**: support@distri-night.ci
- **Téléphone**: +225 27 20 30 40 50
- **GitHub Issues**: [Lien vers le repo]

## Licence

Propriétaire - DISTRI-NIGHT © 2026
