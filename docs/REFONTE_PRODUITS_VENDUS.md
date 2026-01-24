# Refonte Page "Produits vendus" Fournisseur - Documentation

## Vue d'ensemble

Cette refonte transforme la page "Produits vendus" d'un tableau affichant TOUS les produits du catalogue à une approche progressive où le fournisseur construit sa liste produit par produit.

## Problème résolu

**Avant**: Le tableau chargeait tous les produits du catalogue (potentiellement des centaines), ce qui était:
- Lent à charger
- Difficile à naviguer
- Peu pratique pour les fournisseurs ne vendant qu'une partie des produits

**Après**: Le tableau est vide au départ et se construit au fur et à mesure que le fournisseur ajoute des produits.

## Architecture technique

### Fichiers modifiés

1. **src/services/pricing/supplierPriceService.ts**
   - Nouvelle fonction `searchProductsForSupplier()`:
     - Recherche dans le catalogue avec filtres
     - Exclut les produits déjà configurés
     - Validation UUID pour prévenir les injections SQL
     - Utilise `.not('id', 'in', ...)` pour un filtrage sécurisé

2. **src/components/Supplier/Pricing/PriceGridTable.tsx**
   - Refactorisation complète (~700 lignes)
   - Séparation claire entre:
     - Section recherche/ajout
     - Table des produits configurés
   - Gestion d'état améliorée avec React Hooks
   - Performance: `useMemo` pour éviter recalculs

3. **src/components/Supplier/Pricing/DeleteConfirmationModal.tsx**
   - Nouveau composant modal accessible
   - Attributs ARIA pour screen readers
   - Design cohérent avec l'application

### Base de données

Aucune modification de schéma requise. Utilise la table existante:

```sql
supplier_price_grids (
  id UUID PRIMARY KEY,
  supplier_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  crate_price DECIMAL,
  initial_stock INTEGER DEFAULT 0,
  sold_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  ...
)
```

## Fonctionnalités

### 1. Chargement initial

- Charge uniquement les produits présents dans `supplier_price_grids` pour le fournisseur
- Affiche un message si aucun produit configuré
- Charge les prix de référence pour calcul des écarts

### 2. Recherche et ajout de produits

**Interface de recherche:**
- Champ texte avec placeholder "🔍 Rechercher un produit (min. 3 car.)..."
- Dropdown de catégories (Toutes/Bières/Sodas/Vins/Eaux/Spiritueux)
- Debounce de 500ms pour éviter trop d'appels API
- Minimum 3 caractères avant déclenchement

**Résultats:**
- Maximum 20 résultats
- Affichage en cartes avec:
  - Image du produit
  - Nom, marque, type de casier
  - Prix de référence RAVITO
  - Formulaire inline:
    - Prix fournisseur (obligatoire, validation > 0)
    - Stock initial (optionnel, validation ≥ 0, défaut 0)
  - Bouton "Ajouter"

**Validation:**
```typescript
// Prix fournisseur
if (isNaN(supplierPrice) || supplierPrice <= 0) {
  error: "doit être > 0"
}

// Stock initial
if (isNaN(initialStock) || initialStock < 0) {
  error: "doit être ≥ 0"
}
```

### 3. Tableau des produits configurés

**Colonnes maintenues:**
1. Produit (nom, marque, type casier)
2. Prix {NomFournisseur} (éditable)
3. Référence (prix RAVITO)
4. Écart % (badge coloré: rouge/orange/jaune/vert)
5. Stock Initial (éditable)
6. Qté Vendue (lecture seule, mis à jour par commandes)
7. Stock Final (calculé: Initial - Vendue)
8. Actions (Modifier/Supprimer)

**Mode édition:**
- Clic sur icône crayon (✏️) active l'édition
- Champs Prix et Stock deviennent des inputs
- Boutons Sauvegarder (✓) et Annuler (✗)
- Sauvegarde dans `supplier_price_grids`

**Suppression:**
- Clic sur icône poubelle (🗑️)
- Modal de confirmation accessible (ARIA)
- Message: "Êtes-vous sûr de vouloir supprimer [nom] ?"
- Suppression définitive de `supplier_price_grids`

### 4. Calculs automatiques

**Écart %:**
```typescript
variance = ((supplierPrice - refPrice) / refPrice) * 100

if (variance < -10%) → rouge "prix très bas"
if (-10% ≤ variance < -5%) → orange "prix bas"
if (-5% ≤ variance < 5%) → jaune "prix équilibré"
if (variance ≥ 5%) → vert "prix élevé"
```

**Stock Final:**
```typescript
stockFinal = initialStock - soldQuantity
```

## Compatibilité avec le système existant

### Création d'offres fournisseurs

Le mécanisme existant dans `supplierOfferService.ts` continue de fonctionner:

```typescript
// getSupplierPrices() lit toujours supplier_price_grids
const { data } = await supabase
  .from('supplier_price_grids')
  .select('*')
  .eq('supplier_id', supplierId)
  .eq('is_active', true);
```

Les prix configurés sont automatiquement utilisés lors de la création d'offres.

### Mise à jour des quantités vendues

Les triggers de base de données existants continuent de mettre à jour `sold_quantity` automatiquement lors des commandes.

## Sécurité

### Protection contre les injections SQL

1. **Validation UUID:**
```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validIds = excludeProductIds.filter(id => uuidRegex.test(id));
```

2. **Utilisation de l'API Supabase:**
```typescript
// Bon ✅
queryBuilder.not('id', 'in', `(${validIds.join(',')})`)

// Évité ❌
queryBuilder.filter('id', 'not.in', `(${ids.join(',')})`)
```

### Validation des entrées utilisateur

- Prix: nombre > 0
- Stock: entier ≥ 0
- Tous les champs requis vérifiés avant soumission

## Accessibilité

### DeleteConfirmationModal

```jsx
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="delete-modal-title"
>
  <h2 id="delete-modal-title">Confirmer la suppression</h2>
  <button aria-label="Fermer">...</button>
</div>
```

### Navigation clavier

- Tous les boutons et inputs sont accessibles au clavier
- Focus visible sur les éléments interactifs
- Ordre de tabulation logique

## Performance

### Optimisations

1. **Debounce de recherche (500ms):**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // API call
  }, 500);
  return () => clearTimeout(timer);
}, [searchQuery]);
```

2. **Mémorisation des exclusions:**
```typescript
const excludeIds = useMemo(
  () => configuredProducts.map(p => p.id),
  [configuredProducts]
);
```

3. **Chargement conditionnel:**
- Ne charge pas tous les produits du catalogue
- Limite les résultats de recherche à 20

## Tests recommandés

### Tests fonctionnels

1. **Ajout de produit:**
   - [ ] Recherche avec moins de 3 caractères ne déclenche rien
   - [ ] Recherche avec 3+ caractères affiche résultats
   - [ ] Filtrage par catégorie fonctionne
   - [ ] Produits déjà ajoutés sont exclus
   - [ ] Validation du prix fonctionne
   - [ ] Validation du stock fonctionne
   - [ ] Ajout crée bien l'entrée dans supplier_price_grids

2. **Modification de produit:**
   - [ ] Clic sur crayon active le mode édition
   - [ ] Changement de prix se sauvegarde
   - [ ] Changement de stock se sauvegarde
   - [ ] Annulation restaure les valeurs

3. **Suppression de produit:**
   - [ ] Modal de confirmation s'affiche
   - [ ] Annulation ferme le modal sans supprimer
   - [ ] Confirmation supprime de la base
   - [ ] Message de succès s'affiche

4. **Calculs:**
   - [ ] Écart % correct vs prix référence
   - [ ] Stock final = Initial - Vendu
   - [ ] Couleurs de badge appropriées

### Tests d'intégration

5. **Création d'offres:**
   - [ ] Les prix configurés apparaissent dans CreateOfferModal
   - [ ] getSupplierPrices() retourne les bons prix

6. **Mise à jour quantités:**
   - [ ] Commande met à jour sold_quantity
   - [ ] Stock final se recalcule automatiquement
   - [ ] Réinitialisation remet à 0

### Tests de sécurité

7. **Validation:**
   - [ ] Impossible d'injecter SQL dans la recherche
   - [ ] UUID invalides sont filtrés
   - [ ] Prix négatifs rejetés
   - [ ] Stock négatifs rejetés

### Tests d'accessibilité

8. **ARIA:**
   - [ ] Screen reader peut naviguer le modal
   - [ ] Tous les boutons ont des labels
   - [ ] Focus est géré correctement

## Migration

### Pour les fournisseurs existants

Si un fournisseur avait déjà configuré des produits dans `supplier_price_grids`:
- ✅ Ses produits apparaissent immédiatement dans le tableau
- ✅ Aucune perte de données
- ✅ Fonctionnalité complète disponible

Si un fournisseur n'avait rien configuré:
- ✅ Tableau vide avec message invitant à ajouter des produits
- ✅ Peut commencer à construire sa liste

### Rollback

En cas de problème, il est possible de revenir à l'ancienne version:

```bash
git checkout src/components/Supplier/Pricing/PriceGridTable_BACKUP.tsx
mv PriceGridTable_BACKUP.tsx PriceGridTable.tsx
```

## Support et maintenance

### Fichiers à surveiller

1. `src/services/pricing/supplierPriceService.ts`
2. `src/components/Supplier/Pricing/PriceGridTable.tsx`
3. `src/components/Supplier/Pricing/DeleteConfirmationModal.tsx`

### Logs importants

Tous les erreurs sont loggées dans la console:
- `Error searching products for supplier`
- `Error loading configured products`
- `Error adding product`
- `Error updating grid`
- `Error deleting product`

### Métriques à suivre

- Temps de chargement initial de la page
- Temps de réponse de la recherche
- Nombre de produits configurés par fournisseur
- Taux d'utilisation de la recherche vs import bulk (si réimplémenté)

## Conclusion

Cette refonte améliore significativement l'expérience utilisateur pour les fournisseurs en:
- Réduisant le temps de chargement initial
- Simplifiant l'ajout de produits
- Maintenant toutes les fonctionnalités existantes
- Améliorant l'accessibilité et la sécurité

Le code est plus maintenable, mieux structuré et suit les meilleures pratiques React modernes.
