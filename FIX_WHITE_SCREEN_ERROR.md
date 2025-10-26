# Correction - Écran blanc "Commandes disponibles"

## Problème

Interface fournisseur → Page "Commandes disponibles" → **Écran blanc complet**

## Erreur console

```
AvailableOrders.tsx:127 Uncaught ReferenceError: acceptingOrder is not defined
    at AvailableOrders.tsx:127:33
```

## Cause

Lors du nettoyage de l'ancien flux, j'ai supprimé la variable `acceptingOrder` mais **2 références** subsistaient dans le code:

### Ligne 127
```typescript
const isAccepting = acceptingOrder === order.id; // ❌ acceptingOrder n'existe plus
```

### Ligne 321
```typescript
{order.status === 'awaiting-client-validation' ? (
  <span>En attente validation client</span>
) : isAccepting ? ( // ❌ isAccepting dépend de acceptingOrder
  <span>Acceptation...</span>
) : (
  <span>Envoyer une offre</span>
)}
```

## Solution appliquée

### 1. Suppression de `isAccepting`
```typescript
// AVANT - Ligne 127
const isAccepting = acceptingOrder === order.id;

// APRÈS - Supprimé complètement
```

### 2. Simplification du bouton
```typescript
// AVANT - Lignes 316-331
{order.status === 'awaiting-client-validation' ? (
  <>
    <Clock className="h-4 w-4" />
    <span>En attente validation client</span>
  </>
) : isAccepting ? (
  <>
    <div className="animate-spin ..."></div>
    <span>Acceptation...</span>
  </>
) : (
  <>
    <CheckCircle className="h-4 w-4" />
    <span>Envoyer une offre</span>
  </>
)}

// APRÈS - Lignes simplifiées
<CheckCircle className="h-4 w-4" />
<span>Envoyer une offre</span>
```

**Raison:** Dans le nouveau flux, il n'y a plus d'état "acceptation en cours" car on ouvre simplement un modal (CreateOfferModal). Pas besoin d'animation loading.

## Vérifications

### Build ✅
```
npm run build
✓ 1607 modules transformed
✓ built in 5.03s
```

### Fichier corrigé
- `src/components/Supplier/AvailableOrders.tsx`

### Modifications
- **Supprimé:** Ligne 127 - `const isAccepting = acceptingOrder === order.id;`
- **Simplifié:** Lignes 316-331 - Ternaire complexe → Texte simple

## Résultat

✅ **Page "Commandes disponibles" affiche maintenant correctement:**
- Liste des commandes `pending-offers`
- Bouton "Voir détails" fonctionnel
- Bouton "Envoyer une offre" fonctionnel
- Pas d'erreur JavaScript

✅ **Flux opérationnel:**
1. Fournisseur clique "Commandes disponibles"
2. Page s'affiche avec liste des commandes
3. Clic "Envoyer une offre" → CreateOfferModal s'ouvre
4. Fournisseur modifie quantités et soumet offre

## Notes

Cette erreur était un **oubli lors du nettoyage** du code obsolète. Les 2 lignes référençaient l'ancien système d'acceptation qui n'existe plus dans le nouveau flux d'offres.
