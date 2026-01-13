# 📦 SUPABASE BACKUP - RAVITO v1.6.0

**Date :** 13 janvier 2026  
**Version :** v1.6.0  
**Projet :** RAVITO_DEV  

---

## 🎯 Résumé

Ce document constitue le point de sauvegarde de la base de données Supabase pour la version **v1.6.0** qui introduit le **Module Gestion Activité CHR**. 

---

## 📊 Statistiques Générales

| Métrique | Valeur |
|----------|--------|
| **Tables publiques** | 40 |
| **Fonctions** | 77 |
| **Triggers** | 28 |
| **Politiques RLS** | 139 |
| **Migrations appliquées** | 120+ |

---

## 🗄️ Tables (40)

| Table | Colonnes | Lignes |
|-------|----------|--------|
| available_modules | 11 | - |
| commission_settings | 7 | - |
| **crate_types** ⭐ | 11 | - |
| custom_roles | 11 | - |
| **daily_expenses** ⭐ | 6 | 6 |
| **daily_packaging** ⭐ | 13 | 81 |
| **daily_sheets** ⭐ | 14 | 12 |
| **daily_stock_lines** ⭐ | 9 | 29 |
| **establishment_products** ⭐ | 8 | 11 |
| migration_history | 6 | - |
| night_guard_schedule | 6 | - |
| notification_preferences | 15 | - |
| notifications | 10 | - |
| order_items | 10 | - |
| order_pricing_snapshot | 13 | - |
| orders | 35 | 43 |
| organization_members | 18 | - |
| organizations | 8 | 9 |
| payment_methods | 7 | - |
| price_analytics | 18 | - |
| pricing_categories | 8 | - |
| products | 16 | 75 |
| profiles | 28 | 18 |
| push_subscriptions | 8 | - |
| ratings | 12 | - |
| reference_prices | 14 | - |
| role_permissions | 8 | - |
| supplier_offers | 13 | - |
| supplier_price_grid_history | 15 | - |
| supplier_price_grids | 19 | - |
| supplier_zones | 22 | - |
| support_tickets | 12 | 5 |
| ticket_attachments | 8 | - |
| ticket_messages | 6 | - |
| transfer_orders | 5 | - |
| transfers | 19 | - |
| user_activity_log | 10 | - |
| user_module_permissions | 8 | - |
| zone_registration_requests | 10 | - |
| zones | 8 | - |

> ⭐ Tables ajoutées/modifiées dans v1.6.0 (Module Gestion Activité)

---

## 🔧 Fonctions (77)

### Fonctions Module Gestion Activité (v1.6.0)
| Fonction | Description |
|----------|-------------|
| `create_daily_sheet_with_carryover` | Crée feuille journalière avec report J-1 |
| `sync_daily_packaging_types` | Synchronise types emballages consignables |
| `sync_ravito_deliveries_to_daily_sheet` | Sync livraisons RAVITO vers feuille |
| `update_daily_sheets_updated_at` | Trigger updated_at |
| `update_daily_stock_lines_updated_at` | Trigger updated_at |
| `update_daily_packaging_updated_at` | Trigger updated_at |
| `update_establishment_products_updated_at` | Trigger updated_at |

### Fonctions Commandes & Offres
| Fonction | Description |
|----------|-------------|
| `accept_supplier_offer` | Accepte offre avec commission client 4% |
| `check_single_accepted_offer` | Vérifie unicité offre acceptée |
| `create_notification_on_new_offer` | Notifie client nouvelle offre |
| `create_notification_on_new_order` | Notifie fournisseurs nouvelle commande |
| `create_notification_on_order_status_change` | Notifie changement statut |
| `update_order_status_on_offer` | MAJ statut commande sur offre |
| `log_order_activity` | Log activité commande |

### Fonctions Livraison
| Fonction | Description |
|----------|-------------|
| `generate_confirmation_code` | Génère code 4L+3C mélangé |
| `set_delivery_confirmation_code` | Set code au passage "delivering" |
| `validate_delivery_before_delivered` | Valide code avant "delivered" |
| `record_delivery_user` | Enregistre livreur |
| `get_client_info_for_order` | Infos client pour livreur |

### Fonctions Authentification & Permissions
| Fonction | Description |
|----------|-------------|
| `handle_new_user` | Trigger création profil |
| `is_admin` | Vérifie rôle admin |
| `is_supplier` | Vérifie rôle fournisseur |
| `is_client` | Vérifie rôle client |
| `is_super_admin` | Vérifie super admin |
| `has_permission` | Vérifie permission module |
| `has_team_access` | Vérifie accès équipe |
| `user_has_org_access` | Vérifie accès organisation |
| `get_user_permissions` | Liste permissions utilisateur |

### Fonctions Organisation & Équipe
| Fonction | Description |
|----------|-------------|
| `create_organization_with_owner` | Crée organisation avec owner |
| `can_add_member` | Vérifie quota membres |
| `get_organization_member_count` | Compte membres organisation |
| `get_user_org_owner_id` | ID propriétaire organisation |
| `is_organization_owner` | Vérifie propriétaire |

### Fonctions Tarification
| Fonction | Description |
|----------|-------------|
| `get_reference_price` | Prix référence produit |
| `get_supplier_price_grid` | Grille prix fournisseur |
| `log_supplier_price_grid_changes` | Log changements prix |
| `reset_supplier_sold_quantities` | Reset quantités vendues |
| `update_sold_quantities_on_order` | MAJ quantités sur commande |

### Fonctions Rating
| Fonction | Description |
|----------|-------------|
| `update_user_rating` | MAJ note moyenne utilisateur |
| `get_pending_ratings_for_user` | Évaluations en attente |
| `get_profile_for_rating` | Profil pour évaluation |
| `has_pending_ratings` | A des évaluations en attente |
| `log_rating_activity` | Log activité évaluation |

### Fonctions Support
| Fonction | Description |
|----------|-------------|
| `generate_ticket_number` | Génère numéro ticket |
| `update_ticket_timestamp` | MAJ timestamp ticket |

### Fonctions Zones
| Fonction | Description |
|----------|-------------|
| `update_supplier_zone_stats` | MAJ stats zone fournisseur |
| `notify_admins_new_zone_request` | Notifie admins demande zone |
| `notify_supplier_request_reviewed` | Notifie fournisseur review |
| `update_zone_request_timestamp` | MAJ timestamp demande |

### Fonctions Profils
| Fonction | Description |
|----------|-------------|
| `sync_profile_names` | Sync noms profils |
| `log_profile_update_activity` | Log MAJ profil |
| `get_client_profiles_for_supplier` | Profils clients pour fournisseur |
| `get_supplier_profiles_for_client` | Profils fournisseurs pour client |
| `get_supplier_info_for_order` | Infos fournisseur commande |
| `get_users_by_status_with_email` | Liste utilisateurs par statut |

### Fonctions Notifications
| Fonction | Description |
|----------|-------------|
| `create_notification_preferences_for_new_user` | Prefs notification nouvel user |

### Fonctions Transfers
| Fonction | Description |
|----------|-------------|
| `update_orders_on_transfer_completion` | MAJ commandes sur transfert |

---

## ⚡ Triggers (28)

### Triggers Module Gestion Activité
| Trigger | Table | Événement |
|---------|-------|-----------|
| daily_sheets_updated_at | daily_sheets | BEFORE UPDATE |
| daily_stock_lines_updated_at | daily_stock_lines | BEFORE UPDATE |
| daily_packaging_updated_at | daily_packaging | BEFORE UPDATE |
| establishment_products_updated_at | establishment_products | BEFORE UPDATE |
| crate_types_updated_at_trigger | crate_types | BEFORE UPDATE |

### Triggers Commandes
| Trigger | Table | Événement |
|---------|-------|-----------|
| trigger_log_order_activity | orders | AFTER INSERT/UPDATE |
| trigger_notify_order_status_change | orders | AFTER UPDATE |
| trigger_notify_suppliers_new_order | orders | AFTER INSERT |
| trigger_record_delivery_user | orders | BEFORE UPDATE |
| trigger_set_delivery_code | orders | BEFORE UPDATE |
| trigger_set_delivery_confirmation_code | orders | BEFORE UPDATE |
| trigger_update_sold_quantities | orders | AFTER INSERT/UPDATE |
| trigger_validate_delivery | orders | BEFORE UPDATE |

### Triggers Offres
| Trigger | Table | Événement |
|---------|-------|-----------|
| trigger_notify_client_new_offer | supplier_offers | AFTER INSERT |
| trigger_update_order_status_on_offer | supplier_offers | AFTER INSERT |

### Triggers Pricing
| Trigger | Table | Événement |
|---------|-------|-----------|
| trigger_log_supplier_price_grid_changes | supplier_price_grids | AFTER INSERT/UPDATE/DELETE |
| trigger_update_supplier_price_grids_updated_at | supplier_price_grids | BEFORE UPDATE |
| trigger_update_pricing_categories_updated_at | pricing_categories | BEFORE UPDATE |
| trigger_update_reference_prices_updated_at | reference_prices | BEFORE UPDATE |

### Triggers Profils & Ratings
| Trigger | Table | Événement |
|---------|-------|-----------|
| trigger_sync_profile_names | profiles | BEFORE INSERT/UPDATE |
| on_new_rating | ratings | AFTER INSERT |

### Triggers Autres
| Trigger | Table | Événement |
|---------|-------|-----------|
| trigger_custom_roles_updated_at | custom_roles | BEFORE UPDATE |
| user_module_permissions_updated_at | user_module_permissions | BEFORE UPDATE |

---

## 🔒 Politiques RLS (139)

| Table | Nombre de Policies |
|-------|-------------------|
| available_modules | 1 |
| commission_settings | 4 |
| crate_types | 4 |
| custom_roles | 2 |
| daily_expenses | 1 |
| daily_packaging | 1 |
| daily_sheets | 1 |
| daily_stock_lines | 1 |
| establishment_products | 1 |
| night_guard_schedule | 2 |
| notification_preferences | 3 |
| notifications | 7 |
| order_items | 6 |
| order_pricing_snapshot | 3 |
| **orders** | **9** |
| organization_members | 5 |
| organizations | 5 |
| payment_methods | 4 |
| price_analytics | 2 |
| pricing_categories | 2 |
| products | 4 |
| **profiles** | **7** |
| push_subscriptions | 3 |
| ratings | 7 |
| reference_prices | 2 |
| role_permissions | 1 |
| **supplier_offers** | **7** |
| supplier_price_grid_history | 3 |
| supplier_price_grids | 7 |
| supplier_zones | 4 |
| support_tickets | 6 |
| ticket_attachments | 6 |
| ticket_messages | 4 |
| transfer_orders | 4 |
| transfers | 4 |
| user_activity_log | 4 |
| user_module_permissions | 4 |
| zone_registration_requests | 5 |
| zones | 5 |

---

## 📜 Migrations Récentes (20 dernières)

| Version | Nom | Description |
|---------|-----|-------------|
| 20260113024300 | fix_cash_difference_calculation | Recalcul cash_difference pour sheets clôturées |
| 20260112215154 | sync_daily_packaging_types | Fonction sync types emballages |
| 20260112203617 | create_crate_types_table | Table configuration emballages |
| 20260111234653 | refonte_gestion_emballages | Refonte packaging avec consignes payées |
| 20260111035732 | create_activity_management_tables | Tables module gestion activité |
| 20260110224513 | recreate_orders_with_coords_with_security_invoker | Vue avec security_invoker |
| 20260110224426 | add_packaging_snapshot_to_orders_and_view | packaging_snapshot dans orders |
| 20260110153711 | fix_carton_exclusion_from_consigne | Exclure CARTON des consignes |
| 20260110044416 | add_packaging_snapshot_to_orders | Snapshot emballages à l'acceptation |
| 20260110025659 | fix_delivery_trigger_search_path | Fix search_path trigger livraison |
| 20260110024214 | allow_drivers_to_update_assigned_orders | Livreurs MAJ commandes assignées |
| 20260110024116 | allow_drivers_to_view_client_profiles | Livreurs voir profils clients |
| 20260110024055 | create_get_client_info_for_order_function | Fonction RPC infos client |
| 20260110024018 | fix_delivery_code_trigger_recreate | Recréer trigger code livraison |
| 20260110015606 | fix_orders_with_coords_view_add_delivery_columns | Vue avec colonnes livraison |
| 20260108120000 | fix_rating_update_trigger | Placeholder migration rating |
| 20260108011733 | fix_admin_rating_dependencies | Fix dépendances admin/rating |
| 20260107210242 | fix_accept_offer_use_supplier_prices | Utiliser prix fournisseur |
| 20260107181329 | fix_accept_offer_add_unit_price | Ajout unit_price order_items |
| 20260107172634 | add_client_commission_to_orders | Commission client 4% dans orders |

---

## 🏗️ Structure Module Gestion Activité

### Table `daily_sheets`
```sql
CREATE TABLE daily_sheets (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  sheet_date DATE NOT NULL,
  status TEXT DEFAULT 'open', -- 'open' | 'closed'
  opening_cash INTEGER DEFAULT 0,
  closing_cash INTEGER,
  theoretical_revenue INTEGER DEFAULT 0,
  expenses_total INTEGER DEFAULT 0,
  cash_difference INTEGER,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(organization_id, sheet_date)
);
```

### Table `daily_stock_lines`
```sql
CREATE TABLE daily_stock_lines (
  id UUID PRIMARY KEY,
  daily_sheet_id UUID NOT NULL,
  product_id UUID NOT NULL,
  initial_stock INTEGER DEFAULT 0,
  ravito_supply INTEGER DEFAULT 0,
  external_supply INTEGER DEFAULT 0,
  final_stock INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(daily_sheet_id, product_id)
);
```

### Table `daily_packaging`
```sql
CREATE TABLE daily_packaging (
  id UUID PRIMARY KEY,
  daily_sheet_id UUID NOT NULL,
  crate_type TEXT NOT NULL,
  qty_full_start INTEGER DEFAULT 0,
  qty_empty_start INTEGER DEFAULT 0,
  qty_received INTEGER DEFAULT 0,
  qty_returned INTEGER DEFAULT 0,
  qty_full_end INTEGER,
  qty_empty_end INTEGER,
  qty_consignes_paid INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(daily_sheet_id, crate_type)
);
```

### Table `daily_expenses`
```sql
CREATE TABLE daily_expenses (
  id UUID PRIMARY KEY,
  daily_sheet_id UUID NOT NULL,
  label TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ
);
```

### Table `establishment_products`
```sql
CREATE TABLE establishment_products (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  product_id UUID NOT NULL,
  selling_price INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  min_stock_alert INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(organization_id, product_id)
);
```

### Table `crate_types`
```sql
CREATE TABLE crate_types (
  id UUID PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  short_label VARCHAR(50),
  description TEXT,
  is_consignable BOOLEAN DEFAULT false,
  icon VARCHAR(10) DEFAULT '📦',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 📊 Formules de Calcul

```
Ventes = Stock Initial + Entrées RAVITO + Achats Externes - Stock Final
CA Théorique = Σ (Ventes × establishment_products.selling_price)
Caisse Attendue = Fond de Caisse + CA Théorique - Dépenses
Écart de Caisse = Caisse Comptée - Caisse Attendue
```

---

## 🔄 Scripts de Correction Appliqués

### Recalcul CA avec prix de vente établissement
```sql
UPDATE daily_sheets ds
SET theoretical_revenue = sub. total_revenue
FROM (
  SELECT dsl.daily_sheet_id,
    COALESCE(SUM(
      (dsl.initial_stock + dsl.ravito_supply + dsl.external_supply - dsl.final_stock) 
      * ep.selling_price
    ), 0) AS total_revenue
  FROM daily_stock_lines dsl
  JOIN daily_sheets ds2 ON ds2.id = dsl.daily_sheet_id
  JOIN establishment_products ep ON ep.product_id = dsl.product_id 
    AND ep.organization_id = ds2.organization_id
  WHERE dsl.final_stock IS NOT NULL
  GROUP BY dsl.daily_sheet_id
) sub
WHERE ds.id = sub.daily_sheet_id AND ds.status = 'closed';
```

### Recalcul cash_difference
```sql
UPDATE daily_sheets
SET cash_difference = closing_cash - (opening_cash + theoretical_revenue - expenses_total)
WHERE status = 'closed' AND closing_cash IS NOT NULL;
```

---

## 📌 Point de Restauration

```bash
# Restaurer cette version
git checkout v1.6.0

# Vérifier le tag
git describe --tags
```

---

## ✅ Validation

- [x] 40 tables présentes
- [x] 77 fonctions opérationnelles
- [x] 28 triggers actifs
- [x] 139 politiques RLS configurées
- [x] Module Gestion Activité fonctionnel
- [x] Calculs CA et écart caisse corrects

---

**Généré le :** 13 janvier 2026  
**Hermann N'GUESSAN - RAVITO**