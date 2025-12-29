# Nouveau Flux de Commande - Système d'Offres

## Vue d'ensemble

Le système a été restructuré pour implémenter un flux d'offres et contre-offres entre clients et fournisseurs, avec masquage des identités jusqu'au paiement.

## Base de données

### Nouvelles tables

#### `supplier_offers`
- Stocke les offres des fournisseurs pour une commande
- Un fournisseur peut modifier les quantités selon ses disponibilités
- Champs : modified_items (jsonb), total_amount, supplier_message, status

#### Nouveaux statuts de commande
- `pending-offers` : Commande créée, fournisseurs peuvent soumettre des offres
- `offers-received` : Au moins une offre reçue
- `awaiting-payment` : Client a accepté une offre
- `paid` : Paiement effectué
- `awaiting-rating` : Livraison confirmée, évaluations en attente

### Table `ratings` (existante)
- Évaluations bidirectionnelles entre client et fournisseur
- Champs: from_user_id, to_user_id, rating, comment

## Flux détaillé

### 1. Client passe commande
- ✅ Client sélectionne zone + produits + adresse
- ✅ Système crée commande avec statut `pending-offers`
- ✅ Panier vidé après création
- **Identité client masquée** (seule la zone est visible)

### 2. Fournisseurs voient les commandes
- Fournisseurs de la zone voient les commandes `pending-offers`
- **Informations masquées:**
  - Nom/identité du client
  - Adresse exacte de livraison
- **Informations visibles:**
  - Zone de livraison
  - Produits demandés + quantités
  - Total de la commande

### 3. Fournisseur crée une offre
- Peut modifier les quantités selon disponibilités
- Peut ajouter un message
- Système calcule nouveau total + commissions
- **Blocage:** Si évaluation en attente → message d'erreur

### 4. Client voit les offres
- Statut commande passe à `offers-received`
- Client voit toutes les offres **anonymisées**
- **Informations masquées:**
  - Nom/identité du fournisseur
- **Informations visibles:**
  - Quantités proposées
  - Prix total
  - Message du fournisseur
  - Offre #1, #2, #3...

### 5. Client accepte une offre
- Peut refuser plusieurs offres
- **Ne peut accepter qu'une seule offre**
- **Blocage:** Si évaluation en attente → message d'erreur
- Statut passe à `awaiting-payment`
- Autres offres automatiquement refusées

### 6. Client effectue le paiement
- Interface de paiement affichée
- Une fois payé, statut passe à `paid`
- **Démasquage:**
  - Client voit maintenant l'identité du fournisseur
  - Fournisseur reçoit notification + identité client
  - Fonds transférés (visible dans interface Admin)

### 7. Fournisseur prépare et livre
- Statuts: `preparing` → `delivering` → `delivered`
- Mises à jour en temps réel chez le client
- Fournisseur renseigne chaque étape

### 8. Client confirme réception
- Statut passe à `awaiting-rating`
- **Blocage activé pour les deux parties**

### 9. Évaluations obligatoires
- Client DOIT évaluer avant nouvelle commande
- Fournisseur DOIT évaluer avant accepter nouvelle commande
- Messages bloquants si tentative sans évaluation

## Services créés

### `supplierOfferService.ts`
- `createSupplierOffer()` : Créer une offre
- `getOffersByOrder()` : Récupérer offres d'une commande
- `getOffersBySupplier()` : Offres d'un fournisseur
- `acceptOffer()` : Accepter une offre (client)
- `rejectOffer()` : Refuser une offre (client)

### Fonction SQL
- `has_pending_ratings(user_id)` : Vérifie si évaluations en attente

## Composants à créer/modifier

### Fournisseur
- ✅ Voir commandes disponibles (status = 'pending-offers')
- TODO: Formulaire création d'offre avec modification quantités
- TODO: Voir ses propres offres (statut: pending/accepted/rejected)

### Client
- TODO: Voir offres reçues (anonymisées)
- TODO: Accepter/refuser offres
- TODO: Interface paiement après acceptation
- TODO: Voir identité fournisseur après paiement

### Bloqueurs
- TODO: Modal "Évaluation requise" avec lien vers évaluation
- TODO: Désactiver boutons si `has_pending_ratings()` retourne true

## Politiques RLS (Masquage d'identité)

### Avant paiement
- Client ne voit PAS `supplier_id` dans les offres
- Fournisseur ne voit PAS `client_id`, `delivery_address` dans orders

### Après paiement (status = 'paid')
- Toutes les informations démasquées
- Client voit `supplier_id` + profil fournisseur
- Fournisseur voit `client_id` + `delivery_address`

## Statut actuel de l'implémentation

✅ **Terminé:**
- Tables + RLS créées
- Nouveaux statuts ajoutés
- Service `supplierOfferService` créé
- Types TypeScript mis à jour
- `createOrder()` utilise `pending-offers`

🚧 **En cours:**
- Interfaces utilisateur pour le nouveau flux

⏳ **À faire:**
- Composants d'affichage/création d'offres
- Système de blocage pour évaluations
- Tests du flux complet
