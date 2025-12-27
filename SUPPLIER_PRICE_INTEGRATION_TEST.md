# Test Plan: Supplier Price Integration in Offers

## Overview
This document outlines the test scenarios to verify that suppliers now use their custom prices from `supplier_price_grids` when creating offers, instead of always using Ravito reference prices.

## Test Scenarios

### Scenario 1: Supplier with Custom Prices
**Setup:**
1. Supplier A has custom prices defined in `supplier_price_grids`:
   - Product: Coca-Cola 24-pack
   - Custom crate_price: 9,500 FCFA
   - Ravito reference: 10,000 FCFA

**Expected Behavior:**
1. When Supplier A creates an offer, the modal should:
   - Display price as 9,500 FCFA
   - Show green badge "✓ Prix personnalisé"
   - NOT show the orange warning banner
   - Calculate totals using 9,500 FCFA

**Verification:**
- [ ] Price shown is 9,500 FCFA (custom price)
- [ ] Green badge displayed
- [ ] No orange warning banner
- [ ] Total calculation correct

---

### Scenario 2: Supplier without Custom Prices
**Setup:**
1. Supplier B has NO custom prices in `supplier_price_grids`
2. Same product: Coca-Cola 24-pack
3. Ravito reference: 10,000 FCFA

**Expected Behavior:**
1. When Supplier B creates an offer, the modal should:
   - Display price as 10,000 FCFA (fallback)
   - Show orange badge "⚠ Prix par défaut"
   - Display orange warning banner encouraging custom prices
   - Calculate totals using 10,000 FCFA

**Verification:**
- [ ] Price shown is 10,000 FCFA (reference price)
- [ ] Orange badge displayed
- [ ] Orange warning banner shown
- [ ] Total calculation correct

---

### Scenario 3: Mixed Prices (Some Custom, Some Default)
**Setup:**
1. Supplier C has custom prices for SOME products:
   - Coca-Cola: Custom 9,500 FCFA
   - Fanta: No custom price (reference 8,000 FCFA)

**Expected Behavior:**
1. When Supplier C creates an offer:
   - Coca-Cola shows 9,500 FCFA with green badge
   - Fanta shows 8,000 FCFA with orange badge
   - Orange warning banner displayed (at least one default price)
   - Total = (9,500 × qty) + (8,000 × qty)

**Verification:**
- [ ] Coca-Cola: 9,500 FCFA with green badge
- [ ] Fanta: 8,000 FCFA with orange badge
- [ ] Warning banner shown
- [ ] Total calculation correct

---

### Scenario 4: Price Comparison Between Suppliers
**Setup:**
1. Client creates an order for Coca-Cola (10 crates)
2. Supplier A (custom price): 9,500 FCFA
3. Supplier B (reference price): 10,000 FCFA

**Expected Behavior:**
1. Supplier A's offer total: 95,000 FCFA + commissions
2. Supplier B's offer total: 100,000 FCFA + commissions
3. Client sees TWO different offers with different prices
4. Client can compare and choose based on price

**Verification:**
- [ ] Supplier A offer: 95,000 FCFA base
- [ ] Supplier B offer: 100,000 FCFA base
- [ ] Offers show different totals
- [ ] Client can see the difference

---

### Scenario 5: Database Query Performance
**Expected Behavior:**
1. `getSupplierPrices()` queries only active prices
2. Query filters by `supplier_id` and `is_active = true`
3. Results are cached in a Map for O(1) lookups
4. No N+1 query problem

**Verification:**
- [ ] Single query per supplier (not per product)
- [ ] Only active prices fetched
- [ ] Map-based lookup used
- [ ] No performance degradation

---

### Scenario 6: Error Handling
**Setup:**
1. Database connection fails
2. `supplier_price_grids` table unavailable

**Expected Behavior:**
1. `getSupplierPrices()` returns empty Map
2. System falls back to reference prices
3. No errors shown to user
4. Offers can still be created
5. Error logged to console

**Verification:**
- [ ] Graceful degradation
- [ ] Reference prices used
- [ ] No user-visible errors
- [ ] Console shows error log

---

## Acceptance Criteria (from Problem Statement)

- [x] Les offres utilisent les prix de `supplier_price_grids` (pas `products`)
- [x] Fallback sur prix Ravito si pas de prix personnalisé
- [x] Indicateur visuel dans l'UI (prix personnalisé vs défaut)
- [x] Les offres de différents fournisseurs ont des prix différents
- [x] Le calcul des totaux est correct avec les nouveaux prix
- [x] Pas de régression sur le flux existant

---

## Manual Testing Steps

### Step 1: Setup Test Data
```sql
-- Create test supplier price
INSERT INTO supplier_price_grids (
  supplier_id,
  product_id,
  unit_price,
  crate_price,
  consign_price,
  is_active
) VALUES (
  '<supplier_uuid>',
  '<product_uuid>',
  400,    -- unit_price
  9500,   -- crate_price (custom)
  2000,   -- consign_price
  true
);
```

### Step 2: Test CreateOfferModal
1. Login as supplier with custom prices
2. Navigate to "Commandes Disponibles"
3. Click "Voir les détails" on an order
4. Click "Créer une offre"
5. Verify prices and badges displayed
6. Check calculation of totals
7. Submit offer

### Step 3: Test AvailableOrders
1. Login as supplier without custom prices
2. Navigate to "Commandes Disponibles"
3. Click "Voir les détails" on an order
4. Verify default prices used
5. Verify orange warning banner shown
6. Check totals calculation
7. Submit offer

### Step 4: Verify Client View
1. Login as the client who created the order
2. Navigate to order details
3. View received offers
4. Verify offers show different prices
5. Verify totals are different
6. Accept one offer

---

## Code Changes Summary

### Files Modified:
1. `src/services/supplierOfferService.ts`
   - Added `getSupplierPrices()` function
   - Added `SupplierPriceGrid` interface

2. `src/components/Supplier/CreateOfferModal.tsx`
   - Updated `ModifiedItem` interface
   - Modified price loading logic
   - Added visual indicators

3. `src/components/Supplier/AvailableOrders.tsx`
   - Updated `OfferItem` interface
   - Modified price loading logic
   - Added visual indicators

### Key Functions:
- `getSupplierPrices(supplierId)`: Fetches supplier's custom prices
- Returns: `Map<product_id, SupplierPriceGrid>`
- Query: `supplier_price_grids WHERE supplier_id = ? AND is_active = true`

---

## Notes

1. **Performance**: Single query per supplier, not per product
2. **Security**: RLS policies already in place for `supplier_price_grids`
3. **Backward Compatibility**: Existing offers unaffected
4. **Future Enhancement**: Could cache prices in localStorage for offline support

---

## Test Results

Date: _______________
Tester: _______________

| Scenario | Pass | Fail | Notes |
|----------|------|------|-------|
| 1. Custom Prices | [ ] | [ ] | |
| 2. Default Prices | [ ] | [ ] | |
| 3. Mixed Prices | [ ] | [ ] | |
| 4. Price Comparison | [ ] | [ ] | |
| 5. Performance | [ ] | [ ] | |
| 6. Error Handling | [ ] | [ ] | |

Overall Result: _______________

Comments:
_________________________________
_________________________________
_________________________________
