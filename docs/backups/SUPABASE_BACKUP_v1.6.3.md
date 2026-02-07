# 📦 SUPABASE BACKUP v1.6.3

**Date :** 07 février 2026  
**Version :** v1.6.3  
**Précédente :** v1.6.2 (01 février 2026)  
**Projet :** RAVITO_DEV

---

## 🎯 Résumé

Ce document constitue le point de sauvegarde de la base de données Supabase pour la version **v1.6.3** qui apporte le **système complet d'abonnements Ravito Gestion** avec validation admin, les **notifications temps réel de paiements**, la **génération de reçus PDF**, et le **Dashboard Super Admin avec onglets**.

---

## 📊 Statistiques Générales

| Métrique | v1.6.2 | v1.6.3 | Δ |
|----------|--------|--------|---|
| **Tables** | 49 | 58 | +9 |
| **Fonctions** | 86 | 92 | +6 |
| **Triggers** | 40 | 34 | -6 |
| **Politiques RLS** | 184 | 203 | +19 |

---

## 🗄️ Tables (58)

| Table | Colonnes | Statut |
|-------|----------|--------|
| available_modules | 11 | - |
| commission_settings | 7 | - |
| crate_types | 11 | - |
| credit_customers | 17 | - |
| credit_transaction_items | 8 | - |
| credit_transactions | 11 | - |
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
| order_conversations | 8 | - |
| order_items | 10 | - |
| order_messages | 9 | - |
| order_pricing_snapshot | 13 | - |
| orders | 35 | - |
| organization_members | 18 | - |
| organizations | 8 | - |
| **payment_method_config** | 9 | ⭐ v1.6.3 |
| payment_methods | 13 | 🔄 Modifié |
| price_analytics | 18 | - |
| pricing_categories | 8 | - |
| products | 17 | - |
| profiles | 34 | - |
| push_subscriptions | 8 | - |
| ratings | 12 | - |
| reference_prices | 14 | - |
| role_permissions | 8 | - |
| sales_commission_payments | 19 | - |
| sales_commission_settings | 23 | - |
| sales_objectives | 9 | - |
| sales_representatives | 9 | - |
| **subscription_invoices** | 21 | ⭐ v1.6.3 |
| **subscription_payments** | 14 | ⭐ v1.6.3 |
| **subscription_plans** | 13 | ⭐ v1.6.3 |
| **subscription_reminders** | 8 | ⭐ v1.6.3 |
| **subscription_settings** | 8 | ⭐ v1.6.3 |
| **subscriptions** | 20 | ⭐ v1.6.3 |
| supplier_offers | 13 | - |
| supplier_price_grid_history | 15 | - |
| supplier_price_grids | 19 | - |
| supplier_zones | 22 | - |
| support_tickets | 12 | - |
| ticket_attachments | 8 | - |
| ticket_messages | 6 | - |
| transfer_orders | 5 | - |
| transfers | 19 | - |
| **trigger_debug_logs** | 6 | ⭐ v1.6.3 |
| user_activity_log | 10 | - |
| user_module_permissions | 8 | - |
| **user_payment_preferences** | 7 | ⭐ v1.6.3 |
| zone_registration_requests | 10 | - |
| zones | 8 | - |

> ⭐ Tables ajoutées dans v1.6.3

---

## 🆕 Nouvelles Tables v1.6.3 (Système d'Abonnements)

### subscription_plans (13 colonnes)
```
id uuid, name text, description text, price numeric, billing_cycle text, 
days_in_cycle integer, trial_days integer (default 30), is_active boolean, 
display_order integer, features jsonb, created_at timestamptz, 
updated_at timestamptz, free_months integer
```

### subscriptions (20 colonnes)
```
id uuid, organization_id uuid, plan_id uuid, status text (default 'trial'), 
is_first_subscription boolean, trial_start_date timestamptz, trial_end_date timestamptz, 
current_period_start timestamptz, current_period_end timestamptz, next_billing_date date, 
amount_due numeric, is_prorata boolean, prorata_days integer, subscribed_at timestamptz, 
activated_at timestamptz, suspended_at timestamptz, cancelled_at timestamptz, 
cancellation_reason text, created_at timestamptz, updated_at timestamptz
```

### subscription_invoices (21 colonnes)
```
id uuid, subscription_id uuid, invoice_number text, amount numeric, 
prorata_amount numeric, days_calculated integer, is_prorata boolean, 
period_start date, period_end date, due_date date, status text (default 'pending'), 
paid_at timestamptz, paid_amount numeric, notes text, created_at timestamptz, 
updated_at timestamptz, organization_id uuid, amount_due numeric, amount_paid numeric, 
transaction_reference text, payment_method_id uuid
```

### subscription_payments (14 colonnes)
```
id uuid, invoice_id uuid, subscription_id uuid, amount numeric, 
payment_method text, payment_date timestamptz, validated_by uuid, 
validation_date timestamptz, receipt_number text, transaction_reference text, 
notes text, created_at timestamptz, status text (default 'validated'), 
rejection_reason text
```

### subscription_reminders (8 colonnes)
```
id uuid, subscription_id uuid, reminder_type text, sent_at timestamptz, 
channel text, created_at timestamptz, ...
```

### subscription_settings (8 colonnes)
```
id uuid, key text, value jsonb, description text, 
created_at timestamptz, updated_at timestamptz, ...
```

---

## 🆕 Autres Nouvelles Tables v1.6.3

### payment_method_config (9 colonnes)
Configuration des méthodes de paiement acceptées pour les abonnements.

### user_payment_preferences (7 colonnes)
Préférences de paiement des utilisateurs.

### trigger_debug_logs (6 colonnes)
Logs de débogage des triggers (développement).

---

## 🔧 Fonctions (92)

### Nouvelles Fonctions v1.6.3 (Abonnements)

| Fonction | Description |
|----------|-------------|
| `calculate_period_end` | Calcule la fin de période d'abonnement |
| `check_and_suspend_overdue_subscriptions` | Suspend les abonnements impayés |
| `generate_invoice_number` | Génère numéro de facture unique (RG-YYYY-XXXXXX) |
| `mark_overdue_invoices` | Marque les factures en retard |
| `update_invoice_status` | Met à jour le statut des factures |

### Fonctions Existantes (87)

| Fonction | Type |
|----------|------|
| accept_supplier_offer | FUNCTION |
| add_commercial_to_sales_reps | FUNCTION |
| assign_driver_to_conversation | FUNCTION |
| can_add_member | FUNCTION |
| check_credit_limit | FUNCTION |
| check_single_accepted_offer | FUNCTION |
| create_daily_sheet_with_carryover | FUNCTION |
| create_notification_on_new_offer | FUNCTION |
| create_notification_on_new_order | FUNCTION |
| create_notification_on_order_status_change | FUNCTION |
| create_notification_preferences_for_new_user | FUNCTION |
| create_order_conversation | FUNCTION |
| create_organization_with_owner | FUNCTION |
| debug_user_has_org_access | FUNCTION |
| generate_confirmation_code | FUNCTION |
| generate_ticket_number | FUNCTION |
| get_client_info_for_order | FUNCTION |
| get_client_profiles_for_supplier | FUNCTION |
| get_organization_member_count | FUNCTION |
| get_pending_ratings_for_user | FUNCTION |
| get_profile_for_rating | FUNCTION |
| get_reference_price | FUNCTION |
| get_supplier_info_for_order | FUNCTION |
| get_supplier_price_grid | FUNCTION |
| get_supplier_profiles_for_client | FUNCTION |
| get_user_org_owner_id | FUNCTION |
| get_user_permissions | FUNCTION |
| get_users_by_status_with_email | FUNCTION |
| handle_new_user | FUNCTION |
| has_pending_ratings | FUNCTION |
| has_permission | FUNCTION |
| has_role | FUNCTION |
| has_team_access | FUNCTION |
| is_admin | FUNCTION |
| is_approved | FUNCTION |
| is_approved_user | FUNCTION |
| is_client | FUNCTION |
| is_current_user_admin | FUNCTION |
| is_organization_owner | FUNCTION |
| is_super_admin | FUNCTION |
| is_supplier | FUNCTION |
| log_order_activity | FUNCTION |
| log_profile_update_activity | FUNCTION |
| log_rating_activity | FUNCTION |
| log_supplier_price_grid_changes | FUNCTION |
| notify_admins_new_zone_request | FUNCTION |
| notify_supplier_request_reviewed | FUNCTION |
| record_delivery_user | FUNCTION |
| reset_supplier_sold_quantities | FUNCTION |
| set_delivery_confirmation_code | FUNCTION |
| sync_daily_packaging_types | FUNCTION |
| sync_profile_names | FUNCTION |
| sync_ravito_deliveries_to_daily_sheet | FUNCTION |
| update_crate_types_updated_at | FUNCTION |
| update_credit_customers_updated_at | FUNCTION |
| update_custom_roles_updated_at | FUNCTION |
| update_customer_balance | FUNCTION |
| update_daily_packaging_updated_at | FUNCTION |
| update_daily_sheet_credits | FUNCTION |
| update_daily_sheets_updated_at | FUNCTION |
| update_daily_stock_lines_updated_at | FUNCTION |
| update_establishment_products_updated_at | FUNCTION |
| update_last_payment_date | FUNCTION |
| update_order_status_on_offer | FUNCTION |
| update_orders_on_transfer_completion | FUNCTION |
| update_organization_members_updated_at | FUNCTION |
| update_organizations_updated_at | FUNCTION |
| update_pricing_categories_updated_at | FUNCTION |
| update_reference_prices_updated_at | FUNCTION |
| update_sold_quantities_on_order | FUNCTION |
| update_supplier_price_grids_updated_at | FUNCTION |
| update_supplier_zone_stats | FUNCTION |
| update_ticket_timestamp | FUNCTION |
| update_updated_at_column | FUNCTION |
| update_user_module_permissions_updated_at | FUNCTION |
| update_user_rating | FUNCTION |
| update_zone_request_timestamp | FUNCTION |
| user_has_org_access | FUNCTION |
| validate_delivery_before_delivered | FUNCTION |

---

## ⚡ Triggers (34)

| Trigger | Table | Timing | Event |
|---------|-------|--------|-------|
| crate_types_updated_at_trigger | crate_types | BEFORE | UPDATE |
| credit_customers_updated_at | credit_customers | BEFORE | UPDATE |
| trigger_check_credit_limit | credit_transactions | BEFORE | INSERT |
| trigger_update_customer_balance | credit_transactions | AFTER | INSERT |
| trigger_update_daily_sheet_credits | credit_transactions | AFTER | INSERT |
| trigger_update_last_payment_date | credit_transactions | AFTER | INSERT |
| trigger_custom_roles_updated_at | custom_roles | BEFORE | UPDATE |
| daily_packaging_updated_at | daily_packaging | BEFORE | UPDATE |
| daily_sheets_updated_at | daily_sheets | BEFORE | UPDATE |
| daily_stock_lines_updated_at | daily_stock_lines | BEFORE | UPDATE |
| establishment_products_updated_at | establishment_products | BEFORE | UPDATE |
| on_order_paid | orders | AFTER | UPDATE |
| trigger_log_order_activity | orders | AFTER | INSERT |
| trigger_notify_order_status_change | orders | AFTER | UPDATE |
| trigger_notify_suppliers_new_order | orders | AFTER | INSERT |
| trigger_record_delivery_user | orders | BEFORE | UPDATE |
| trigger_set_delivery_code | orders | BEFORE | UPDATE |
| trigger_set_delivery_confirmation_code | orders | BEFORE | UPDATE |
| trigger_update_sold_quantities | orders | AFTER | INSERT |
| trigger_validate_delivery | orders | BEFORE | UPDATE |
| trigger_add_commercial_to_sales_reps | organization_members | AFTER | INSERT |
| trigger_update_pricing_categories_updated_at | pricing_categories | BEFORE | UPDATE |
| trigger_sync_profile_names | profiles | BEFORE | INSERT |
| on_new_rating | ratings | AFTER | INSERT |
| trigger_update_reference_prices_updated_at | reference_prices | BEFORE | UPDATE |
| update_sales_commission_payments_updated_at | sales_commission_payments | BEFORE | UPDATE |
| update_sales_commission_settings_updated_at | sales_commission_settings | BEFORE | UPDATE |
| update_sales_objectives_updated_at | sales_objectives | BEFORE | UPDATE |
| update_sales_representatives_updated_at | sales_representatives | BEFORE | UPDATE |
| trigger_notify_client_new_offer | supplier_offers | AFTER | INSERT |
| trigger_update_order_status_on_offer | supplier_offers | AFTER | INSERT |
| trigger_log_supplier_price_grid_changes | supplier_price_grids | AFTER | INSERT |
| trigger_update_supplier_price_grids_updated_at | supplier_price_grids | BEFORE | UPDATE |
| user_module_permissions_updated_at | user_module_permissions | BEFORE | UPDATE |

---

## 🔒 Politiques RLS par Table (203 total)

| Table | Policies |
|-------|----------|
| available_modules | 1 |
| commission_settings | 4 |
| crate_types | 4 |
| credit_customers | 4 |
| credit_transaction_items | 4 |
| credit_transactions | 4 |
| custom_roles | 2 |
| daily_expenses | 1 |
| daily_packaging | 1 |
| daily_sheets | 1 |
| daily_stock_lines | 1 |
| establishment_products | 1 |
| night_guard_schedule | 2 |
| notification_preferences | 3 |
| notifications | 7 |
| order_conversations | 3 |
| order_items | 6 |
| order_messages | 3 |
| order_pricing_snapshot | 3 |
| orders | 9 |
| organization_members | 5 |
| organizations | 5 |
| **payment_method_config** | 4 |
| payment_methods | 3 |
| price_analytics | 2 |
| pricing_categories | 2 |
| products | 4 |
| profiles | 7 |
| push_subscriptions | 3 |
| ratings | 7 |
| reference_prices | 2 |
| role_permissions | 1 |
| sales_commission_payments | 2 |
| sales_commission_settings | 2 |
| sales_objectives | 1 |
| sales_representatives | 2 |
| **subscription_invoices** | 5 |
| **subscription_payments** | 6 |
| **subscription_plans** | 2 |
| **subscription_reminders** | 2 |
| **subscription_settings** | 2 |
| **subscriptions** | 4 |
| supplier_offers | 7 |
| supplier_price_grid_history | 3 |
| supplier_price_grids | 7 |
| supplier_zones | 4 |
| support_tickets | 6 |
| ticket_attachments | 6 |
| ticket_messages | 4 |
| transfer_orders | 4 |
| transfers | 4 |
| trigger_debug_logs | 1 |
| user_activity_log | 4 |
| user_module_permissions | 4 |
| **user_payment_preferences** | 2 |
| zone_registration_requests | 5 |
| zones | 5 |

---

## 🔒 Politiques RLS Abonnements (Détail)

| Table | Policy | Permissive | Cmd |
|-------|--------|------------|-----|
| subscription_invoices | Admins can view all invoices | PERMISSIVE | SELECT |
| subscription_invoices | Admins gèrent factures | PERMISSIVE | ALL |
| subscription_invoices | Super admins can manage all invoices | PERMISSIVE | ALL |
| subscription_invoices | Users can view their organization invoices | PERMISSIVE | SELECT |
| subscription_invoices | Users voient leurs factures | PERMISSIVE | SELECT |
| subscription_payments | Admins can view all payments | PERMISSIVE | SELECT |
| subscription_payments | Admins gèrent paiements | PERMISSIVE | ALL |
| subscription_payments | Super admins can manage payments | PERMISSIVE | ALL |
| subscription_payments | Users can submit payment claims | PERMISSIVE | INSERT |
| subscription_payments | Users can view their payments | PERMISSIVE | SELECT |
| subscription_payments | Users voient leurs paiements | PERMISSIVE | SELECT |
| subscription_plans | Admins gèrent plans | PERMISSIVE | ALL |
| subscription_plans | Plans visibles par tous | PERMISSIVE | SELECT |
| subscription_reminders | Admins gèrent rappels | PERMISSIVE | ALL |
| subscription_reminders | Admins voient rappels | PERMISSIVE | SELECT |
| subscription_settings | Admins modifient paramètres | PERMISSIVE | ALL |
| subscription_settings | Admins voient paramètres | PERMISSIVE | SELECT |
| subscriptions | subscriptions_all_super_admin | PERMISSIVE | ALL |
| subscriptions | subscriptions_insert_own | PERMISSIVE | INSERT |
| subscriptions | subscriptions_select_admin | PERMISSIVE | SELECT |
| subscriptions | subscriptions_select_own | PERMISSIVE | SELECT |

---

## ✅ Vérifications v1.6.3

| Check | Status |
|-------|--------|
| subscription_plans table | ✅ |
| subscriptions table | ✅ |
| subscription_invoices table | ✅ |
| subscription_payments table | ✅ |
| subscription_reminders table | ✅ |
| subscription_settings table | ✅ |
| status column on subscription_payments | ✅ |
| rejection_reason column on subscription_payments | ✅ |
| validated_at column on subscription_payments | ❌ |
| validated_by column on subscription_payments | ✅ |
| RLS enabled on subscription_payments | ✅ |
| Realtime enabled on subscription_payments | ❌ |

> ⚠️ **Note :** La colonne `validated_at` n'existe pas, remplacée par `validation_date`. Realtime non activé sur `subscription_payments` (à activer si notifications temps réel requises).

---

## ✅ Vérifications v1.6.2 (Héritage)

| Check | Status |
|-------|--------|
| sales_objectives table | ✅ |
| sales_commission_settings table | ✅ |
| sales_commission_payments table | ✅ |
| sales_representatives table | ✅ |
| credit_sales column on daily_sheets | ✅ |
| credit_payments column on daily_sheets | ✅ |
| is_super_admin column on profiles | ✅ |

---

## 📊 Données Abonnements

| Métrique | Valeur |
|----------|--------|
| Plans d'abonnement | 3 |
| Abonnements (trial) | 2 |
| Abonnements (active) | 1 |
| Factures (pending) | 2 |
| Factures (paid) | 1 |
| Paiements (pending_validation) | 1 |

---

## 📜 Migrations Récentes (depuis v1.6.2)

| Version | Nom | Date |
|---------|-----|------|
| 20260207034858 | add_payment_validation_workflow | 07 Feb 2026, 03:48:58 |
| 20260207021924 | fix_user_has_org_access_ambiguous_user_id | 07 Feb 2026, 02:19:24 |
| 20260207002220 | create_organizations_and_subscription_system_v2 | 07 Feb 2026, 00:22:20 |
| 20260205002429 | create_payment_config_table | 05 Feb 2026, 00:24:29 |
| 20260204132100 | create_automatic_suspension_functions | 04 Feb 2026, 13:21:00 |
| 20260204132000 | update_invoices_table_structure | 04 Feb 2026, 13:20:00 |
| 20260204131901 | create_invoices_table | 04 Feb 2026, 13:19:01 |
| 20260204131900 | create_payment_methods_table | 04 Feb 2026, 13:19:00 |
| 20260204044800 | update_subscription_plans_pricing | 04 Feb 2026, 04:48:00 |
| 20260204034231 | 20260204_debug_registration_trigger | 04 Feb 2026, 03:42:31 |
| 20260203011220 | 20260203000420_create_subscription_system_ravito_gestion | 03 Feb 2026, 01:12:20 |
| 20260203000420 | create_subscription_system_ravito_gestion | 03 Feb 2026, 00:04:20 |

---

## 🏗️ Structure Tables Abonnements

### Table `subscription_plans`

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  billing_cycle TEXT NOT NULL,
  days_in_cycle INTEGER NOT NULL,
  trial_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  free_months INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `subscriptions`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trial',
  is_first_subscription BOOLEAN DEFAULT true,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_billing_date DATE,
  amount_due NUMERIC DEFAULT 0,
  is_prorata BOOLEAN DEFAULT false,
  prorata_days INTEGER,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `subscription_payments`

```sql
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES subscription_invoices(id),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL,
  validated_by UUID REFERENCES auth.users(id),
  validation_date TIMESTAMPTZ DEFAULT NOW(),
  receipt_number TEXT,
  transaction_reference TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'validated',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔄 Procédure de Restauration

### Option 1 : Depuis GitHub

```bash
git checkout v1.6.3
cd supabase
supabase db reset
supabase db push
```

### Option 2 : Rollback vers v1.6.2

```bash
git checkout v1.6.2
supabase db reset
supabase db push
```

### Option 3 : Rollback partiel (abonnements seulement)

```sql
-- Supprimer tables abonnements
DROP TABLE IF EXISTS subscription_payments CASCADE;
DROP TABLE IF EXISTS subscription_reminders CASCADE;
DROP TABLE IF EXISTS subscription_invoices CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS subscription_settings CASCADE;

-- Supprimer tables paiement config
DROP TABLE IF EXISTS payment_method_config CASCADE;
DROP TABLE IF EXISTS user_payment_preferences CASCADE;
```

---

## ✅ Validation post-restauration

```sql
-- Vérifier tables abonnements
SELECT COUNT(*) FROM subscription_plans;
SELECT COUNT(*) FROM subscriptions;
SELECT COUNT(*) FROM subscription_invoices;
SELECT COUNT(*) FROM subscription_payments;

-- Vérifier policies RLS abonnements
SELECT tablename, policyname FROM pg_policies 
WHERE tablename LIKE 'subscription%';

-- Vérifier fonctions abonnements
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname LIKE '%subscription%' OR proname LIKE '%invoice%';

-- Statistiques abonnements
SELECT status, COUNT(*) FROM subscriptions GROUP BY status;
SELECT status, COUNT(*) FROM subscription_invoices GROUP BY status;
SELECT status, COUNT(*) FROM subscription_payments GROUP BY status;
```

---

## 📌 Point de Restauration

```bash
# Restaurer cette version
git checkout v1.6.3

# Vérifier le tag
git describe --tags
```

---

## ⚠️ Actions Recommandées

1. **Activer Realtime** sur `subscription_payments` pour les notifications admin :
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_payments;
```

2. **Vérifier la colonne** `validation_date` vs `validated_at` dans le code frontend

---

**Généré le :** 07/02/2026  
**Hermann N'GUESSAN - RAVITO**