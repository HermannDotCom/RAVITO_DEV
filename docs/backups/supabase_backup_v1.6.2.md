# 📦 SUPABASE BACKUP v1.6.2

**Date :** 01 février 2026  
**Version :** v1.6.2  
**Projet :** RAVITO_DEV

---

## 📊 Statistiques Générales

| Métrique | Valeur |
|----------|--------|
| Tables | 49 |
| Fonctions | 86 |
| Triggers | 40 |
| Politiques RLS | 184 |

---

## 🗄️ Tables (49)

| Table | Colonnes |
|-------|----------|
| available_modules | 11 |
| commission_settings | 7 |
| crate_types | 11 |
| credit_customers | 17 |
| credit_transaction_items | 8 |
| credit_transactions | 11 |
| custom_roles | 11 |
| daily_expenses | 6 |
| daily_packaging | 13 |
| daily_sheets | 17 |
| daily_stock_lines | 9 |
| establishment_products | 8 |
| migration_history | 6 |
| night_guard_schedule | 6 |
| notification_preferences | 15 |
| notifications | 10 |
| order_conversations | 8 |
| order_items | 10 |
| order_messages | 9 |
| order_pricing_snapshot | 13 |
| orders | 35 |
| organization_members | 18 |
| organizations | 8 |
| payment_methods | 7 |
| price_analytics | 18 |
| pricing_categories | 8 |
| products | 17 |
| profiles | 34 |
| push_subscriptions | 8 |
| ratings | 12 |
| reference_prices | 14 |
| role_permissions | 8 |
| sales_commission_payments | 19 |
| sales_commission_settings | 23 |
| sales_objectives | 9 |
| sales_representatives | 9 |
| supplier_offers | 13 |
| supplier_price_grid_history | 15 |
| supplier_price_grids | 19 |
| supplier_zones | 22 |
| support_tickets | 12 |
| ticket_attachments | 8 |
| ticket_messages | 6 |
| transfer_orders | 5 |
| transfers | 19 |
| user_activity_log | 10 |
| user_module_permissions | 8 |
| zone_registration_requests | 10 |
| zones | 8 |

---

## 🆕 Nouvelles Tables v1.6.2 (Commerciaux)

### sales_commission_payments (19 colonnes)
```
id uuid, period_year integer, period_month integer, sales_rep_id uuid, 
chr_activated integer, depot_activated integer, prime_inscriptions integer, 
bonus_objectives integer, bonus_overshoot integer, bonus_special integer, 
commission_ca integer, total_amount integer, status character varying, 
validated_at timestamp with time zone, validated_by uuid, 
paid_at timestamp with time zone, paid_by uuid, 
created_at timestamp with time zone, updated_at timestamp with time zone
```

### sales_commission_settings (23 colonnes)
```
id uuid, prime_per_chr_activated integer, chr_activation_threshold integer, 
prime_per_depot_activated integer, depot_activation_deliveries integer, 
ca_commission_enabled boolean, ca_tier1_max integer, ca_tier1_rate numeric, 
ca_tier2_max integer, ca_tier2_rate numeric, ca_tier3_max integer, 
ca_tier3_rate numeric, ca_tier4_rate numeric, bonus_chr_objective integer, 
bonus_depot_objective integer, bonus_combined integer, 
overshoot_tier1_threshold integer, overshoot_tier1_bonus integer, 
overshoot_tier2_threshold integer, overshoot_tier2_bonus integer, 
bonus_best_of_month integer, updated_at timestamp with time zone, updated_by uuid
```

### sales_objectives (9 colonnes)
```
id uuid, sales_rep_id uuid, period_year integer, period_month integer, 
objective_chr integer, objective_depots integer, 
created_at timestamp with time zone, updated_at timestamp with time zone, created_by uuid
```

### sales_representatives (9 colonnes)
```
id uuid, user_id uuid, name character varying, phone character varying, 
email character varying, zone_id uuid, is_active boolean, 
created_at timestamp with time zone, updated_at timestamp with time zone
```

---

## 📦 Tables v1.6.1 (Messagerie & Crédits)

### order_conversations (8 colonnes)
```
id uuid, order_id uuid, client_id uuid, supplier_id uuid, driver_id uuid, 
is_active boolean, created_at timestamp with time zone, closed_at timestamp with time zone
```

### order_messages (9 colonnes)
```
id uuid, conversation_id uuid, sender_id uuid, sender_role text, 
content text, message_type text, is_read boolean, 
read_at timestamp with time zone, created_at timestamp with time zone
```

### credit_transactions (11 colonnes)
```
id uuid, organization_id uuid, customer_id uuid, daily_sheet_id uuid, 
transaction_type character varying, amount integer, payment_method character varying, 
notes text, transaction_date date, created_at timestamp with time zone, created_by uuid
```

---

## 🔧 Colonnes Crédits dans daily_sheets

| Colonne | Type | Default |
|---------|------|---------|
| cash_difference | integer | null |
| credit_balance_eod | integer | 0 |
| credit_payments | integer | 0 |
| credit_sales | integer | 0 |

---

## 📍 Colonnes Géolocalisation Dépôt (profiles)

| Colonne | Type |
|---------|------|
| depot_address | text |
| depot_latitude | numeric |
| depot_longitude | numeric |

---

## 👥 Colonnes Commerciaux (profiles)

| Colonne | Type |
|---------|------|
| is_super_admin | boolean |
| storefront_image_url | text |

> ⚠️ **Note :** La colonne `sales_rep_id` n'existe pas dans `profiles`. Le lien commercial se fait via `sales_representatives.user_id`.

---

## 🔧 Fonctions (86)

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

## ⚡ Triggers (40)

| Trigger | Table | Event | Timing |
|---------|-------|-------|--------|
| crate_types_updated_at_trigger | crate_types | UPDATE | BEFORE |
| credit_customers_updated_at | credit_customers | UPDATE | BEFORE |
| trigger_check_credit_limit | credit_transactions | INSERT | BEFORE |
| trigger_update_customer_balance | credit_transactions | INSERT | AFTER |
| trigger_update_daily_sheet_credits | credit_transactions | INSERT | AFTER |
| trigger_update_last_payment_date | credit_transactions | INSERT | AFTER |
| trigger_custom_roles_updated_at | custom_roles | UPDATE | BEFORE |
| daily_packaging_updated_at | daily_packaging | UPDATE | BEFORE |
| daily_sheets_updated_at | daily_sheets | UPDATE | BEFORE |
| daily_stock_lines_updated_at | daily_stock_lines | UPDATE | BEFORE |
| establishment_products_updated_at | establishment_products | UPDATE | BEFORE |
| on_order_paid | orders | UPDATE | AFTER |
| trigger_log_order_activity | orders | UPDATE | AFTER |
| trigger_log_order_activity | orders | INSERT | AFTER |
| trigger_notify_order_status_change | orders | UPDATE | AFTER |
| trigger_notify_suppliers_new_order | orders | INSERT | AFTER |
| trigger_record_delivery_user | orders | UPDATE | BEFORE |
| trigger_set_delivery_code | orders | UPDATE | BEFORE |
| trigger_set_delivery_confirmation_code | orders | UPDATE | BEFORE |
| trigger_update_sold_quantities | orders | INSERT | AFTER |
| trigger_update_sold_quantities | orders | UPDATE | AFTER |
| trigger_validate_delivery | orders | UPDATE | BEFORE |
| trigger_add_commercial_to_sales_reps | organization_members | UPDATE | AFTER |
| trigger_add_commercial_to_sales_reps | organization_members | INSERT | AFTER |
| trigger_update_pricing_categories_updated_at | pricing_categories | UPDATE | BEFORE |
| trigger_sync_profile_names | profiles | INSERT | BEFORE |
| trigger_sync_profile_names | profiles | UPDATE | BEFORE |
| on_new_rating | ratings | INSERT | AFTER |
| trigger_update_reference_prices_updated_at | reference_prices | UPDATE | BEFORE |
| update_sales_commission_payments_updated_at | sales_commission_payments | UPDATE | BEFORE |
| update_sales_commission_settings_updated_at | sales_commission_settings | UPDATE | BEFORE |
| update_sales_objectives_updated_at | sales_objectives | UPDATE | BEFORE |
| update_sales_representatives_updated_at | sales_representatives | UPDATE | BEFORE |
| trigger_notify_client_new_offer | supplier_offers | INSERT | AFTER |
| trigger_update_order_status_on_offer | supplier_offers | INSERT | AFTER |
| trigger_log_supplier_price_grid_changes | supplier_price_grids | DELETE | AFTER |
| trigger_log_supplier_price_grid_changes | supplier_price_grids | INSERT | AFTER |
| trigger_log_supplier_price_grid_changes | supplier_price_grids | UPDATE | AFTER |
| trigger_update_supplier_price_grids_updated_at | supplier_price_grids | UPDATE | BEFORE |
| user_module_permissions_updated_at | user_module_permissions | UPDATE | BEFORE |

---

## 🔒 Politiques RLS par Table (184 total)

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
| payment_methods | 4 |
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

## 🔒 Politiques RLS Commerciaux (Détail)

| Table | Policy | Permissive | Cmd |
|-------|--------|------------|-----|
| sales_commission_payments | Super admins can manage commission payments | PERMISSIVE | ALL |
| sales_commission_payments | Admins can view commission payments | PERMISSIVE | SELECT |
| sales_commission_settings | Super admins can manage commission settings | PERMISSIVE | ALL |
| sales_commission_settings | Admins can view commission settings | PERMISSIVE | SELECT |
| sales_objectives | admin_full_access_sales_objectives | PERMISSIVE | ALL |
| sales_representatives | Admins can manage sales representatives | PERMISSIVE | ALL |
| sales_representatives | Public can view active sales reps for registration | PERMISSIVE | SELECT |

---

## 🔒 Politiques RLS Messagerie (Détail)

| Table | Policy | Permissive | Cmd |
|-------|--------|------------|-----|
| order_conversations | Participants can insert conversation | PERMISSIVE | INSERT |
| order_conversations | Participants can view conversation | PERMISSIVE | SELECT |
| order_conversations | Participants can update conversation | PERMISSIVE | UPDATE |
| order_messages | Users can send messages in their conversations | PERMISSIVE | INSERT |
| order_messages | Users can view messages in their conversations | PERMISSIVE | SELECT |
| order_messages | Users can update messages in their conversations | PERMISSIVE | UPDATE |

---

## ✅ Vérifications v1.6.2

| Check | Status |
|-------|--------|
| sales_objectives table | ✅ |
| sales_commission_settings table | ✅ |
| sales_commission_payments table | ✅ |
| sales_representatives table | ✅ |
| credit_sales column on daily_sheets | ✅ |
| credit_payments column on daily_sheets | ✅ |
| is_super_admin column on profiles | ✅ |
| sales_rep_id column on profiles | ❌ |
| storefront_image_url column on profiles | ✅ |
| RLS enabled on sales_objectives | ✅ |

> ⚠️ **Note :** `sales_rep_id` n'existe pas dans `profiles`. L'association commercial ↔ utilisateur se fait via la table `sales_representatives` (colonne `user_id`).

---

## ✅ Vérifications v1.6.1

| Check | Status |
|-------|--------|
| order_conversations table | ✅ |
| order_messages table | ✅ |
| depot_latitude column on profiles | ✅ |
| depot_longitude column on profiles | ✅ |
| RLS enabled on order_conversations | ✅ |
| RLS enabled on order_messages | ✅ |
| Realtime enabled on order_messages | ✅ |

---

## 📊 Données Messagerie

| Métrique | Valeur |
|----------|--------|
| Conversations | 34 |
| Conversations avec livreur | 10 |
| Messages | 24 |

---

## 📊 Données Crédits CHR

| Métrique | Valeur |
|----------|--------|
| Clients à crédit | 3 |
| Transactions crédit | 13 |
| Solde total crédit | 21 900 FCFA |

---

## 📌 Point de Restauration

```bash
git checkout v1.6.2
```

---

## 🔄 Restauration Base de Données

En cas de besoin de restauration, contacter l'administrateur Supabase ou utiliser les backups automatiques du projet Pro.

---

**Généré le :** 01/02/2026  
**Par :** Script SUPABASE_BACKUP v1.6.2