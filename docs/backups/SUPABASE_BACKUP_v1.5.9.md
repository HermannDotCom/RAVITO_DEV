# SUPABASE BACKUP v1.5.9

**Date :** 11 Janvier 2026  
**Release :** v1.5.9  
**Précédent :** v1.5.8

---

## 📋 Résumé

Ce document constitue un **point de restauration** de la base de données Supabase pour la version v1.5.9. Cette version apporte une cohérence totale de la gestion des emballages/casiers, l'exclusion des CARTON du système de consigne, et le pipeline CI/CD automatisé.

---

## ✅ Vérifications v1.5.9

| Check | Status |
|-------|--------|
| `packaging_snapshot` column on orders | ✅ |
| `get_client_info_for_order` function | ✅ |
| `update_user_rating` function | ✅ |
| `on_new_rating` trigger | ✅ |
| `orders_with_coords` view with `security_invoker` | ✅ |
| `accept_supplier_offer` excludes CARTON | ✅ |
| `set_delivery_confirmation_code` trigger | ✅ |
| Drivers can view assigned order client profiles | ✅ |
| Drivers can update assigned orders | ✅ |

---

## Changements depuis v1.5.8

| Élément | Ajouté/Modifié |
|---------|----------------|
| Column `orders.packaging_snapshot` | ✨ Ajoutée |
| Function `get_client_info_for_order` | ✨ Ajoutée |
| Function `update_user_rating` | ✨ Ajoutée |
| Function `accept_supplier_offer` | 🔄 Modifiée (CARTON exclusion + packaging_snapshot) |
| Trigger `on_new_rating` | ✨ Ajouté |
| View `orders_with_coords` | 🔄 Recréée avec `security_invoker = true` |
| Policy `drivers_view_client_profiles` | ✨ Ajoutée |
| Policy `drivers_update_assigned_orders` | ✨ Ajoutée |
| Function `is_admin` | ❌ Supprimée (remplacée par sous-requête) |

---

## 🆕 Migrations ajoutées depuis v1.5.8

```
20260108011733_fix_admin_rating_dependencies.sql
20260108120000_fix_rating_update_trigger.sql
20260110015606_fix_orders_with_coords_view_add_delivery_columns.sql
20260110024018_fix_delivery_code_trigger_recreate.sql
20260110024055_create_get_client_info_for_order_function.sql
20260110024116_allow_drivers_to_view_client_profiles.sql
20260110024214_allow_drivers_to_update_assigned_orders.sql
20260110025659_fix_delivery_trigger_search_path.sql
20260110044416_add_packaging_snapshot_to_orders.sql
20260110153711_fix_carton_exclusion_from_consigne.sql
20260110224426_add_packaging_snapshot_to_orders_and_view.sql
20260110224513_recreate_orders_with_coords_with_security_invoker.sql
```

---

## 🔧 Changements majeurs de schéma

### Nouvelle colonne : `orders.packaging_snapshot`

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packaging_snapshot JSONB;
COMMENT ON COLUMN orders.packaging_snapshot IS 
  'Snapshot des casiers groupés par type, calculé à l''acceptation de l''offre. Exclut CARTON%.';
```

### Nouvelle fonction : `get_client_info_for_order`

```sql
CREATE OR REPLACE FUNCTION get_client_info_for_order(p_order_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  business_name TEXT,
  phone TEXT,
  rating NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql;
```

### Nouvelle fonction : `update_user_rating`

```sql
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET rating = (
    SELECT COALESCE(AVG(score), 0)
    FROM ratings
    WHERE to_user_id = NEW.to_user_id
  )
  WHERE id = NEW.to_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Vue recréée : `orders_with_coords`

```sql
CREATE OR REPLACE VIEW orders_with_coords
WITH (security_invoker = true)
AS SELECT 
  o.*,
  o.packaging_snapshot,
  p.lat,
  p.lng
FROM orders o
LEFT JOIN profiles p ON o.client_id = p.id;
```

### Fonction mise à jour : `accept_supplier_offer`

```sql
-- Calcule packaging_snapshot à l'acceptation
-- EXCLUT les CARTON% du calcul des consignes
SELECT jsonb_object_agg(crate_type, total_quantity)
INTO v_packaging_snapshot
FROM (
  SELECT 
    p.crate_type::text AS crate_type,
    SUM((item->>'quantity')::INTEGER) AS total_quantity
  FROM jsonb_array_elements(v_offer.modified_items::jsonb) AS item
  INNER JOIN products p ON p.id = (item->>'productId')::UUID
  WHERE p.consign_price > 0
    AND p.crate_type NOT LIKE 'CARTON%'  -- EXCLUSION CARTONS
    AND item->>'quantity' IS NOT NULL
    AND (item->>'quantity')::INTEGER > 0
  GROUP BY p.crate_type
) AS grouped_packaging;
```

---

## 📋 Règles métier implémentées

### Consignes / Emballages

```
CONSIGNABLE = consign_price > 0 
            AND crate_type NOT LIKE 'CARTON%'
```

**Types consignables :** C12, C12V, C24, C6  
**Types NON consignables :** CARTON24, CARTON12, CARTON6

### Commissions

```
Commission Client = 4% de base_amount
Commission Fournisseur = 1% de total_amount
```

---

## 📦 Tables principales

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs (clients, fournisseurs, admins) |
| `organizations` | Organisations multi-tenant |
| `organization_members` | Membres d'équipe |
| `orders` | Commandes avec `packaging_snapshot` |
| `order_items` | Lignes de commande |
| `supplier_offers` | Offres fournisseurs |
| `products` | Catalogue produits avec `crate_type` |
| `ratings` | Évaluations |
| `notifications` | Notifications temps réel |
| `zones` | Zones de livraison |
| `supplier_zones` | Zones par fournisseur |

---

## 🔐 Fonctions RPC principales

| Fonction | Description |
|----------|-------------|
| `accept_supplier_offer` | Accepte offre + calcule `packaging_snapshot` |
| `get_client_info_for_order` | Infos client pour livreur assigné |
| `update_user_rating` | Met à jour notation moyenne |
| `user_has_org_access` | Vérifie accès organisation |
| `generate_confirmation_code` | Génère code livraison |

---

## 🚨 Triggers actifs

| Trigger | Table | Action |
|---------|-------|--------|
| `on_new_rating` | `ratings` | → `update_user_rating()` |
| `set_delivery_confirmation_code` | `orders` | → Génère code à `paid` |
| `on_order_status_change` | `orders` | → Notification temps réel |
| `on_new_offer` | `supplier_offers` | → Notification client |
| `handle_new_user` | `auth.users` | → Crée profil + organisation |

---

## 🔄 Procédure de restauration

### Option 1 : Depuis GitHub

```bash
git checkout v1.5.9
cd supabase
supabase db reset
supabase db push
```

### Option 2 : Depuis les migrations

```bash
supabase migration repair --status applied 20260110224513
supabase db push
```

### Option 3 : Rollback vers v1.5.8

```bash
git checkout v1.5.8
supabase db reset
supabase db push
```

---

## ✅ Validation post-restauration

```sql
-- Vérifier packaging_snapshot existe
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'packaging_snapshot';

-- Vérifier fonction get_client_info_for_order
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'get_client_info_for_order';

-- Vérifier vue orders_with_coords contient packaging_snapshot
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders_with_coords' AND column_name = 'packaging_snapshot';

-- Vérifier trigger on_new_rating
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_new_rating';

-- Vérifier exclusion CARTON dans accept_supplier_offer
SELECT prosrc FROM pg_proc WHERE proname = 'accept_supplier_offer';
```

---

## 📊 Statistiques attendues

| Métrique | Valeur |
|----------|--------|
| Dernière migration | `20260110224513` |
| Total migrations | ~120 |
| Tables principales | 25+ |
| Fonctions RPC | 30+ |
| Triggers | 24 |
| Politiques RLS | Complètes |

---

**Fin du backup v1.5.9**
