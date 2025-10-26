# Correction: Commandes non visibles par les fournisseurs

## Problème identifié

Les commandes créées par les clients n'apparaissaient pas dans l'interface "Commandes disponibles" des fournisseurs, même si les fournisseurs étaient bien inscrits dans les zones de livraison.

## Diagnostic

### 1. Vérification des commandes en base ✅
```sql
SELECT id, status, zone_id FROM orders ORDER BY created_at DESC LIMIT 3;
```
**Résultat:** Commandes existent avec status `pending-offers` et `zone_id` correctement renseignés.

### 2. Vérification des inscriptions fournisseurs ✅
```sql
SELECT supplier_id, zone_id, zone_name
FROM supplier_zones sz
JOIN zones z ON z.id = sz.zone_id;
```
**Résultat:** Fournisseurs correctement inscrits dans les zones (Cocody, Plateau, Koumassi, etc.)

### 3. Identification du bug 🔍
**Fichier:** `/src/services/orderService.ts`
**Fonction:** `getPendingOrders()`
**Ligne:** 140

La fonction recherchait les commandes avec les statuts:
```typescript
.in('status', ['pending', 'awaiting-client-validation'])
```

Mais les nouvelles commandes ont le statut `'pending-offers'` créé lors de l'implémentation du système d'offres.

## Solution appliquée

### Modification de `getPendingOrders()`

**Avant:**
```typescript
.in('status', ['pending', 'awaiting-client-validation'])
```

**Après:**
```typescript
.in('status', ['pending', 'pending-offers', 'awaiting-client-validation'])
```

### Fichier modifié
- `/src/services/orderService.ts` (ligne 140)

## Vérification de la correction

### Test SQL pour fournisseur 1
```sql
SELECT o.id, o.status, z.name as zone_name
FROM orders o
JOIN zones z ON z.id = o.zone_id
WHERE o.status IN ('pending', 'pending-offers', 'awaiting-client-validation')
  AND o.zone_id IN (
    SELECT zone_id FROM supplier_zones
    WHERE supplier_id = '472568c0-b7f0-46fc-827e-f83257a4a3d1'
  );
```

**Résultat:** ✅ 2 commandes retournées (Cocody, Koumassi)

### Test SQL pour fournisseur 2 (Toto)
```sql
SELECT o.id, o.status, z.name as zone_name
FROM orders o
JOIN zones z ON z.id = o.zone_id
WHERE o.status IN ('pending', 'pending-offers', 'awaiting-client-validation')
  AND o.zone_id IN (
    SELECT zone_id FROM supplier_zones
    WHERE supplier_id = 'f96f2fb3-6f99-433d-a0f1-bbe30f0ff7fa'
  );
```

**Résultat:** ✅ 2 commandes retournées (Cocody, Plateau)

## Build

```bash
npm run build
✓ 1612 modules transformed
✓ built in 5.40s
```

**Status:** ✅ Build réussi

## Impact

### Avant la correction
- ❌ Commandes `pending-offers` invisibles pour les fournisseurs
- ❌ Système d'offres bloqué dès la création de commande
- ❌ Fournisseurs ne pouvaient pas soumettre d'offres

### Après la correction
- ✅ Commandes `pending-offers` visibles dans "Commandes disponibles"
- ✅ Fournisseurs voient les commandes de leur zone
- ✅ Bouton "Créer une offre" accessible
- ✅ Système d'offres fonctionnel de bout en bout

## Flux complet maintenant opérationnel

1. ✅ Client crée commande → status `pending-offers`
2. ✅ Commande apparaît chez fournisseurs inscrits dans la zone
3. ✅ Fournisseur peut créer offre via `CreateOfferModal`
4. ✅ Status passe à `offers-received`
5. ✅ Client voit offres dans `ReceivedOffers`
6. ✅ Client accepte offre → status `awaiting-payment`
7. ✅ Interface paiement → status `paid`
8. ⏳ Suite du flux (livraison, évaluations)

## Notes techniques

### Pourquoi ce bug est survenu
Le statut `pending-offers` a été introduit lors de la refonte du système pour implémenter le flux d'offres, mais la fonction `getPendingOrders()` n'avait pas été mise à jour pour inclure ce nouveau statut.

### Autres fonctions vérifiées
Les autres fonctions du système utilisent les bons statuts:
- `AvailableOrders.tsx` filtre correctement sur `pending-offers` (ligne 96)
- `CreateOfferModal` vérifie `order.status === 'pending-offers'` dans RLS
- `ReceivedOffers` affiche pour statuts `offers-received`, `awaiting-payment`, `paid`

### Prévention future
Pour éviter ce type de problème:
1. Documenter tous les statuts et leurs transitions
2. Tester chaque nouvelle fonctionnalité de bout en bout
3. Vérifier que les requêtes backend sont alignées avec les nouveaux statuts

## Statuts de commande (référence)

```typescript
type OrderStatus =
  | 'pending'                    // Ancien système
  | 'pending-offers'             // ✅ Nouveau: En attente d'offres
  | 'offers-received'            // ✅ Nouveau: Offres reçues
  | 'awaiting-payment'           // ✅ Nouveau: Offre acceptée
  | 'paid'                       // ✅ Nouveau: Payé
  | 'awaiting-client-validation' // Ancien système
  | 'accepted'                   // Ancien système
  | 'preparing'                  // Préparation
  | 'delivering'                 // En livraison
  | 'delivered'                  // Livré
  | 'awaiting-rating'            // ✅ Nouveau: Attente évaluation
  | 'cancelled';                 // Annulé
```

## Résultat

✅ **Problème résolu:** Les commandes apparaissent maintenant correctement dans l'interface fournisseur.

✅ **Build réussi:** Aucune erreur de compilation.

✅ **Tests SQL validés:** Les requêtes retournent les bonnes commandes pour chaque fournisseur selon leurs zones.
