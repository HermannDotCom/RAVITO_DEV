# Correction - Produits non visibles dans Commandes Disponibles

## Problème

Dans l'interface Fournisseur > Commandes Disponibles:
- Liste affiche "0 produit commandé"
- Modal "Détails" n'affiche aucun produit sous "Produits demandés"

## Diagnostic

Le problème peut avoir 2 causes:

### Cause 1: order_items pas chargés depuis la base de données
La requête Supabase ne récupère pas correctement les items ou la relation échoue.

### Cause 2: order_items vide dans la base de données
La commande existe mais n'a pas d'items associés (problème lors de la création).

## Corrections appliquées

### 1. Protection contre order_items undefined

**Fichier:** `src/services/orderService.ts:226`

```typescript
// AVANT - Crash si order_items est undefined
const items: CartItem[] = dbOrder.order_items.map((item: any) => ({

// APRÈS - Protection
const items: CartItem[] = (dbOrder.order_items || []).map((item: any) => ({
```

### 2. Ajout de logging pour débogage

**Fichier:** `src/services/orderService.ts:224`

```typescript
function mapDatabaseOrderToApp(dbOrder: any): Order {
  console.log('Mapping order:', dbOrder.id, 'order_items:', dbOrder.order_items);
  // ...
}
```

### 3. Chargement du nom de la zone

**Ajout:** Type Order avec `deliveryZone`

```typescript
export interface Order {
  // ...
  deliveryZone?: string; // Nouveau champ
  // ...
}
```

**Requêtes Supabase mises à jour:**

```typescript
// getPendingOrders, getOrdersByClient, getOrdersBySupplier
.select(`
  *,
  order_items (
    *,
    product:products (*)
  ),
  zone:zones (name)  // ← Ajouté
`)
```

**Mapping mis à jour:**

```typescript
return {
  // ...
  deliveryZone: dbOrder.zone?.name || 'Zone non spécifiée',
  zoneId: dbOrder.zone_id,
  // ...
};
```

## Vérifications à faire

### 1. Vérifier les console.log

**Action:** Ouvrir la console navigateur (F12) et regarder les messages:

```
Mapping order: <order-id> order_items: [...]
```

**Si order_items est []:**
→ La commande n'a pas d'items dans la base de données

**Si order_items est undefined:**
→ La relation Supabase n'est pas chargée correctement

### 2. Vérifier dans Supabase directement

**Requête SQL à exécuter:**

```sql
-- Vérifier une commande spécifique
SELECT * FROM orders WHERE id = '<order-id-from-screenshot>';

-- Vérifier ses items
SELECT * FROM order_items WHERE order_id = '<order-id-from-screenshot>';

-- Vérifier avec JOIN
SELECT
  o.id,
  o.status,
  o.total_amount,
  COUNT(oi.id) as nb_items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status IN ('pending-offers', 'offers-received')
GROUP BY o.id;
```

### 3. Créer une nouvelle commande test

Si les commandes existantes n'ont pas d'items:

1. Se connecter en tant que client
2. Ajouter des produits au panier
3. Créer une commande
4. Se connecter en tant que fournisseur
5. Vérifier que les produits s'affichent

## Prochaines étapes

### Si order_items est [] dans les logs:

**Problème:** Les commandes en base n'ont pas d'items associés.

**Solution:**
1. Créer une nouvelle commande test avec un client
2. Ou insérer des order_items manuellement:

```sql
INSERT INTO order_items (order_id, product_id, quantity, with_consigne, unit_price, crate_price, consign_price, subtotal)
SELECT
  '<order-id>',
  p.id,
  2,
  true,
  p.unit_price,
  p.crate_price,
  p.consign_price,
  (p.crate_price * 2) + (p.consign_price * 2)
FROM products p
LIMIT 3;
```

### Si order_items est undefined dans les logs:

**Problème:** La requête Supabase ne récupère pas la relation.

**Solution:** Vérifier les politiques RLS sur order_items:

```sql
-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'order_items';

-- Si manquantes, ajouter:
CREATE POLICY "Fournisseurs peuvent voir order_items des commandes de leur zone"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (
        -- Admin peut tout voir
        auth.jwt() ->> 'email' IN (SELECT email FROM profiles WHERE role = 'admin')
        OR
        -- Client voit ses commandes
        o.client_id = auth.uid()
        OR
        -- Fournisseur voit commandes de ses zones
        o.zone_id IN (
          SELECT zone_id FROM supplier_zones
          WHERE supplier_id = auth.uid()
          AND approval_status = 'approved'
        )
      )
    )
  );
```

### Si les produits s'affichent maintenant:

✅ **Correction réussie!**

Le problème était soit:
- Protection contre undefined manquante
- Zone pas chargée causant un autre problème
- Combinaison des deux

## Build

✅ **Build réussi en 5.94s**
```
Bundle: 766KB
```

## Fichiers modifiés

1. `src/services/orderService.ts`
   - Ajout logging debug
   - Protection order_items
   - Chargement zone dans queries
   - Mapping deliveryZone

2. `src/types/index.ts`
   - Ajout champ `deliveryZone?: string`

## Test final

1. ✅ Rafraîchir l'application (Ctrl+F5)
2. ✅ Se connecter en tant que fournisseur
3. ✅ Aller sur "Commandes disponibles"
4. ✅ Ouvrir console navigateur (F12)
5. ✅ Regarder les logs "Mapping order"
6. ✅ Vérifier si produits s'affichent

Si toujours pas de produits, partager:
- Les messages console
- Résultat de la requête SQL ci-dessus
