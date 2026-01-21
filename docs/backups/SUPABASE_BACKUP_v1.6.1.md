# 📦 SUPABASE BACKUP - RAVITO v1.6.1

**Date :** 21 janvier 2026  
**Version :** v1.6.1  
**Précédente :** v1.6.0 (13 janvier 2026)  
**Projet :** RAVITO_DEV  

---

## 🎯 Résumé

Ce document constitue le point de sauvegarde de la base de données Supabase pour la version **v1.6.1** qui apporte les **exports PDF**, les **clôtures périodiques**, le **module crédits CHR**, la **géolocalisation des dépôts fournisseurs**, et la **messagerie in-app améliorée**.

---

## 📊 Statistiques Générales

| Métrique | Valeur |
|----------|--------|
| **Tables publiques** | 45 |
| **Fonctions** | 85 |
| **Triggers** | 34 |
| **Politiques RLS** | 169 |
| **Migrations appliquées** | 135+ |

---

## 🗄️ Tables (45)

| Table | Colonnes | Statut |
|-------|----------|--------|
| available_modules | 11 | - |
| commission_settings | 7 | - |
| crate_types | 11 | - |
| **credit_customers** | 17 | ⭐ v1.6.1 |
| **credit_transaction_items** | 8 | ⭐ v1.6.1 |
| **credit_transactions** | 11 | ⭐ v1.6.1 |
| custom_roles | 11 | - |
| daily_expenses | 6 | - |
| daily_packaging | 13 | - |
| daily_sheets | 17 | - |
| daily_stock_lines | 9 | - |
| establishment_products | 8 | - |
| migration_history | 6 | - |
| night_guard_schedule | 6 | - |
| notification_preferences | 15 | - |
| notifications | 10 | - |
| **order_conversations** | 8 | ⭐ v1.6.1 |
| order_items | 10 | - |
| **order_messages** | 9 | ⭐ v1.6.1 |
| order_pricing_snapshot | 13 | - |
| orders | 35 | - |
| organization_members | 18 | - |
| organizations | 8 | - |
| payment_methods | 7 | - |
| price_analytics | 18 | - |
| pricing_categories | 8 | - |
| products | 16 | - |
| profiles | 32 | 🔄 Modifié |
| push_subscriptions | 8 | - |
| ratings | 12 | - |
| reference_prices | 14 | - |
| role_permissions | 8 | - |
| supplier_offers | 13 | - |
| supplier_price_grid_history | 15 | - |
| supplier_price_grids | 19 | - |
| supplier_zones | 22 | - |
| support_tickets | 12 | - |
| ticket_attachments | 8 | - |
| ticket_messages | 6 | - |
| transfer_orders | 5 | - |
| transfers | 19 | - |
| user_activity_log | 10 | - |
| user_module_permissions | 8 | - |
| zone_registration_requests | 10 | - |
| zones | 8 | - |

> ⭐ Tables ajoutées dans v1.6.1

---

## 🆕 Changements depuis v1.6.0

### Nouvelles Tables

| Table | Colonnes | Description |
|-------|----------|-------------|
| `order_conversations` | id, order_id, client_id, supplier_id, driver_id, is_active, created_at, closed_at | Conversations liées aux commandes |
| `order_messages` | id, conversation_id, sender_id, sender_role, content, message_type, is_read, read_at, created_at | Messages des conversations |
| `credit_customers` | 17 colonnes | Clients crédit/ardoise CHR |
| `credit_transactions` | 11 colonnes | Mouvements de crédit |
| `credit_transaction_items` | 8 colonnes | Détails des transactions crédit |

### Nouvelles Colonnes (profiles)

| Colonne | Type | Description |
|---------|------|-------------|
| `depot_latitude` | numeric | GPS latitude dépôt fournisseur |
| `depot_longitude` | numeric | GPS longitude dépôt fournisseur |
| `depot_address` | text | Adresse dépôt fournisseur |
| `access_instructions` | text | Instructions d'accès |

---

## 🔧 Fonctions (85)

### Fonctions Messagerie (v1.6.1)

| Fonction | Description |
|----------|-------------|
| `assign_driver_to_conversation` | Assigne livreur à conversation |
| `create_order_conversation` | Crée conversation pour commande |

### Fonctions Module Crédits (v1.6.1)

| Fonction | Description |
|----------|-------------|
| `check_credit_limit` | Vérifie plafond crédit client |
| `update_customer_balance` | Met à jour solde client |
| `update_daily_sheet_credits` | Sync crédits feuille journalière |
| `update_last_payment_date` | MAJ date dernier paiement |
| `update_credit_customers_updated_at` | Trigger updated_at |

### Fonctions Module Gestion Activité

| Fonction | Description |
|----------|-------------|
| `create_daily_sheet_with_carryover` | Crée feuille avec report J-1 |
| `sync_daily_packaging_types` | Sync types emballages |
| `sync_ravito_deliveries_to_daily_sheet` | Sync livraisons RAVITO |

### Fonctions Commandes & Offres

| Fonction | Description |
|----------|-------------|
| `accept_supplier_offer` | Accepte offre + packaging_snapshot |
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

### Fonctions Rating

| Fonction | Description |
|----------|-------------|
| `update_user_rating` | MAJ note moyenne utilisateur |
| `get_pending_ratings_for_user` | Évaluations en attente |
| `get_profile_for_rating` | Profil pour évaluation |
| `has_pending_ratings` | A des évaluations en attente |
| `log_rating_activity` | Log activité évaluation |

---

## ⚡ Triggers (34)

### Triggers Module Crédits (v1.6.1)

| Trigger | Table | Événement |
|---------|-------|-----------|
| credit_customers_updated_at | credit_customers | BEFORE UPDATE |
| trigger_check_credit_limit | credit_transactions | BEFORE INSERT |
| trigger_update_customer_balance | credit_transactions | AFTER INSERT |
| trigger_update_daily_sheet_credits | credit_transactions | AFTER INSERT |
| trigger_update_last_payment_date | credit_transactions | AFTER INSERT |

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
| on_order_paid | orders | AFTER UPDATE |
| trigger_log_order_activity | orders | AFTER INSERT/UPDATE |
| trigger_notify_order_status_change | orders | AFTER UPDATE |
| trigger_notify_suppliers_new_order | orders | AFTER INSERT |
| trigger_record_delivery_user | orders | BEFORE UPDATE |
| trigger_set_delivery_code | orders | BEFORE UPDATE |
| trigger_set_delivery_confirmation_code | orders | BEFORE UPDATE |
| trigger_update_sold_quantities | orders | AFTER INSERT/UPDATE |
| trigger_validate_delivery | orders | BEFORE UPDATE |

### Triggers Offres & Pricing

| Trigger | Table | Événement |
|---------|-------|-----------|
| trigger_notify_client_new_offer | supplier_offers | AFTER INSERT |
| trigger_update_order_status_on_offer | supplier_offers | AFTER INSERT |
| trigger_log_supplier_price_grid_changes | supplier_price_grids | AFTER INSERT/UPDATE/DELETE |
| trigger_update_supplier_price_grids_updated_at | supplier_price_grids | BEFORE UPDATE |

### Triggers Profils & Ratings

| Trigger | Table | Événement |
|---------|-------|-----------|
| trigger_sync_profile_names | profiles | BEFORE INSERT/UPDATE |
| on_new_rating | ratings | AFTER INSERT |

---

## 🔒 Politiques RLS (169)

| Table | Nombre de Policies |
|-------|-------------------|
| available_modules | 1 |
| commission_settings | 4 |
| crate_types | 4 |
| **credit_customers** | 4 |
| **credit_transaction_items** | 4 |
| **credit_transactions** | 4 |
| custom_roles | 2 |
| daily_expenses | 1 |
| daily_packaging | 1 |
| daily_sheets | 1 |
| daily_stock_lines | 1 |
| establishment_products | 1 |
| night_guard_schedule | 2 |
| notification_preferences | 3 |
| notifications | 7 |
| **order_conversations** | 3 |
| order_items | 6 |
| **order_messages** | 3 |
| order_pricing_snapshot | 3 |
| orders | 9 |
| organization_members | 5 |
| organizations | 5 |
| payment_methods | 4 |
| price_analytics | 2 |
| pricing_categories | 2 |
| products | 4 |
| profiles | 7 |
| push_subscriptions | 3 |
| ratings | 7 |
| reference_prices | 2 |
| role_permissions | 1 |
| supplier_offers | 7 |
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

## 🔒 Politiques RLS Messagerie (Détail)

| Table | Policy | Commande |
|-------|--------|----------|
| order_conversations | Participants can view conversation | SELECT |
| order_conversations | Participants can insert conversation | INSERT |
| order_conversations | Participants can update conversation | UPDATE |
| order_messages | Users can view messages in their conversations | SELECT |
| order_messages | Users can send messages in their conversations | INSERT |
| order_messages | Users can update messages in their conversations | UPDATE |

---

## ✅ Vérifications v1.6.1

| Check | Status |
|-------|--------|
| `order_conversations` table | ✅ |
| `order_messages` table | ✅ |
| `depot_latitude` column on profiles | ✅ |
| `depot_longitude` column on profiles | ✅ |
| RLS enabled on `order_conversations` | ✅ |
| RLS enabled on `order_messages` | ✅ |
| Realtime enabled on `order_messages` | ✅ |
| `credit_customers` table | ✅ |
| `credit_transactions` table | ✅ |

---

## 📊 Données Messagerie

| Métrique | Valeur |
|----------|--------|
| Conversations créées | 34 |
| Conversations avec livreur | 10 |
| Messages échangés | 24 |

---

## 📜 Migrations Récentes (depuis v1.6.0)

| Version | Nom | Description |
|---------|-----|-------------|
| 20260121001500 | create_messaging_system | Tables messagerie (conversations + messages) |
| 20260120233000 | add_depot_geolocation_columns | Colonnes GPS dépôt fournisseur |
| 20260117003343 | add_credit_alerts_and_status_management | Alertes et statuts crédits |
| 20260115023609 | create_credit_management_module | Module crédits CHR |
| 20260113024300 | fix_cash_difference_calculation | Recalcul écart caisse |
| 20260112215154 | sync_daily_packaging_types | Fonction sync emballages |
| 20260112203617 | create_crate_types_table | Table configuration emballages |
| 20260111234653 | refonte_gestion_emballages | Refonte packaging consignes |
| 20260111035732 | create_activity_management_tables | Tables module gestion activité |
| 20260110224513 | recreate_orders_with_coords_with_security_invoker | Vue security_invoker |
| 20260110224426 | add_packaging_snapshot_to_orders_and_view | packaging_snapshot |
| 20260110153711 | fix_carton_exclusion_from_consigne | Exclure CARTON consignes |
| 20260110044416 | add_packaging_snapshot_to_orders | Snapshot emballages |
| 20260110025659 | fix_delivery_trigger_search_path | Fix search_path livraison |
| 20260110024214 | allow_drivers_to_update_assigned_orders | Livreurs MAJ commandes |
| 20260110024116 | allow_drivers_to_view_client_profiles | Livreurs voir clients |
| 20260110024055 | create_get_client_info_for_order_function | RPC infos client |
| 20260110024018 | fix_delivery_code_trigger_recreate | Trigger code livraison |
| 20260110015606 | fix_orders_with_coords_view_add_delivery_columns | Vue colonnes livraison |

---

## 🏗️ Structure Nouvelles Tables

### Table `order_conversations`

```sql
CREATE TABLE order_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL UNIQUE,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  supplier_id UUID REFERENCES profiles(id) NOT NULL,
  driver_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);
```

### Table `order_messages`

```sql
CREATE TABLE order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES order_conversations(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'supplier', 'driver')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'quick', 'system')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `credit_customers`

```sql
CREATE TABLE credit_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  notes TEXT,
  credit_limit INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  total_credited INTEGER DEFAULT 0,
  total_paid INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'disabled')),
  last_payment_date DATE,
  freeze_reason TEXT,
  frozen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `credit_transactions`

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  daily_sheet_id UUID,
  transaction_type VARCHAR(20) NOT NULL, -- 'credit' | 'payment'
  amount INTEGER NOT NULL,
  payment_method VARCHAR(20),
  notes TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);
```

---

## 🔄 Procédure de Restauration

### Option 1 :  Depuis GitHub

```bash
git checkout v1.6.1
cd supabase
supabase db reset
supabase db push
```

### Option 2 : Rollback vers v1.6.0

```bash
git checkout v1.6.0
supabase db reset
supabase db push
```

### Option 3 : Rollback partiel (messagerie seulement)

```sql
-- Supprimer tables messagerie
DROP TABLE IF EXISTS order_messages CASCADE;
DROP TABLE IF EXISTS order_conversations CASCADE;

-- Supprimer colonnes géoloc dépôt
ALTER TABLE profiles DROP COLUMN IF EXISTS depot_latitude;
ALTER TABLE profiles DROP COLUMN IF EXISTS depot_longitude;
ALTER TABLE profiles DROP COLUMN IF EXISTS depot_address;
ALTER TABLE profiles DROP COLUMN IF EXISTS access_instructions;
```

---

## ✅ Validation post-restauration

```sql
-- Vérifier table order_conversations
SELECT COUNT(*) FROM order_conversations;

-- Vérifier table order_messages  
SELECT COUNT(*) FROM order_messages;

-- Vérifier colonnes géoloc dépôt
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name LIKE 'depot%';

-- Vérifier policies RLS messagerie
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('order_conversations', 'order_messages');

-- Vérifier Realtime
SELECT * FROM pg_publication_tables WHERE tablename = 'order_messages';

-- Vérifier tables crédits
SELECT COUNT(*) FROM credit_customers;
SELECT COUNT(*) FROM credit_transactions;
```

---

## 📌 Point de Restauration

```bash
# Restaurer cette version
git checkout v1.6.1

# Vérifier le tag
git describe --tags
```

---

**Généré le :** 21 janvier 2026  
**Hermann N'GUESSAN - RAVITO**