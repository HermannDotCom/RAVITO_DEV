# Mode Livreur - Delivery Mode

## Vue d'ensemble

Le Mode Livreur est une interface simplifiée et optimisée pour les livreurs, conçue spécifiquement pour une utilisation mobile lors des livraisons.

## Fonctionnalités

### 1. Interface Simplifiée
- **Mobile-First**: Optimisé pour les écrans mobiles avec de gros boutons tactiles (min. 48px)
- **Contraste Élevé**: Lisible en plein soleil
- **Informations Essentielles**: Affiche uniquement ce qui est nécessaire pour effectuer une livraison

### 2. Statistiques en Temps Réel
- Nombre de livraisons à faire
- Nombre de livraisons en cours
- Nombre de livraisons terminées aujourd'hui
- Total des gains du jour

### 3. Filtres Rapides
- **Toutes**: Voir toutes les livraisons
- **À faire**: Livraisons prêtes à démarrer
- **En cours**: Livraisons en cours de livraison
- **Terminées**: Livraisons terminées aujourd'hui

### 4. Informations de Livraison
Chaque carte de livraison affiche:
- Numéro de commande
- Nom du client
- Adresse complète
- Numéro de téléphone (cliquable)
- Montant et statut de paiement
- Résumé des articles
- Statut de la livraison avec badge coloré

### 5. Actions Contextuelles

#### État: "Prêt pour livraison"
- **Naviguer**: Ouvre Google Maps/Apple Maps
- **Démarrer**: Démarre la livraison

#### État: "En livraison"
- **Naviguer**: Ouvre Google Maps/Apple Maps
- **Arrivé**: Marque l'arrivée sur place

#### État: "Arrivé"
- **Appeler**: Compose le numéro du client
- **Confirmer**: Ouvre le modal de confirmation

#### État: "Livré"
- Affiche "Livraison terminée" ✓

### 6. Confirmation de Livraison
- Modal sécurisé avec saisie du code à 8 caractères
- Validation du code avant confirmation
- Message d'erreur si le code est incorrect
- Le code est fourni au client lors de l'acceptation de l'offre

### 7. Navigation GPS Intégrée
- Détection automatique de la plateforme (iOS/Android/Desktop)
- Ouvre Apple Maps sur iOS
- Ouvre Google Maps sur Android et Desktop
- Utilise les coordonnées GPS si disponibles
- Fallback sur l'adresse textuelle si pas de coordonnées

## Architecture Technique

### Types (`src/types/delivery.ts`)
```typescript
type DeliveryStatus = 'ready_for_delivery' | 'out_for_delivery' | 'arrived' | 'delivered';

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: DeliveryStatus;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  // ... autres champs
}
```

### Hook Principal (`src/hooks/useDeliveryMode.ts`)
Gère:
- Chargement des données de livraison
- Statistiques en temps réel
- Filtrage des livraisons
- Actions de livraison (démarrer, arriver, confirmer)
- Mise à jour automatique des données

### Composants

#### `DeliveryModePage`
Page principale du mode livreur avec en-tête, stats, filtres et liste des livraisons.

#### `DeliveryCard`
Carte individuelle affichant les détails d'une livraison avec actions contextuelles.

#### `DeliveryStats`
Widget des statistiques avec 3 boutons cliquables pour filtrage rapide.

#### `DeliveryFilters`
Onglets de filtres avec compteurs pour chaque catégorie.

#### `DeliveryConfirmationModal`
Modal de confirmation avec validation du code à 8 caractères.

## Accès

### Via le Sidebar
Menu "Mode Livreur" avec icône Navigation (🧭)

### Via le Dashboard Fournisseur
Widget d'accès rapide affiché quand il y a une livraison active

### URL Directe
`/supplier/delivery-mode` (navigation interne via section)

## Permissions

Le mode livreur utilise le module "deliveries" du système de permissions.
Les membres d'équipe avec accès au module "deliveries" peuvent utiliser le mode livreur.

## Sécurité

### Validation du Code
- Le code est validé côté client puis vérifié côté serveur
- Longueur fixe de 8 caractères (constante `CONFIRMATION_CODE_LENGTH`)
- Comparaison insensible à la casse
- Pas de tentatives multiples sans limite (géré par le flux normal)

### Protection XSS
- Utilisation de `encodeURIComponent` pour les adresses dans les URLs
- Les coordonnées GPS sont des nombres, pas des chaînes utilisateur
- Pas d'utilisation de `innerHTML` ou `dangerouslySetInnerHTML`
- Tous les inputs utilisateur passent par React state (protégé)

### Appels Externes
- `window.open` utilisé uniquement pour navigation et appels téléphoniques
- URLs construites avec des valeurs contrôlées
- Pas d'exécution de code arbitraire

## Tests

Tests unitaires pour les composants clés:
- `DeliveryStats.test.tsx`: 3 tests
- `DeliveryFilters.test.tsx`: 4 tests

Exécuter les tests:
```bash
npm test src/components/Supplier/DeliveryMode/__tests__/
```

## Design Mobile

### Tailles de Boutons
- Minimum 48px de hauteur pour les actions principales
- Zone tactile confortable même avec des gants

### Couleurs
- Utilisation de couleurs vives et contrastées
- Badges colorés pour les statuts
- Gradient orange-vert pour les actions principales

### Typographie
- Texte suffisamment grand pour être lu en mouvement
- Police mono pour le code de confirmation
- Hiérarchie visuelle claire

## Améliorations Futures

### Phase 5 (Optionnel)
- Mode hors ligne avec cache local
- Historique des livraisons du jour
- Notification push pour nouvelles livraisons
- Signature électronique du client
- Photo de preuve de livraison
- Itinéraire optimisé multi-livraisons
- Mode sombre pour usage nocturne

## Développement

### Installation
```bash
npm install
```

### Build
```bash
npm run build
```

### Dev Server
```bash
npm run dev
```

### Tests
```bash
npm test
```

## Support

Pour toute question ou problème, contacter l'équipe de développement via:
- Email: dev@ravito.ci
- Tickets: Interface Support & Tickets
