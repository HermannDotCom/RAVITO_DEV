# 🗄️ SUPABASE BACKUP v1.5.7

**Date :** 29 Décembre 2025  
**Release :** v1.5.7  
**Précédent :** v1.5.6

---

## 📋 Résumé

Ce document constitue un **point de restauration** de la base de données Supabase pour la version v1.5.7.

### ✅ Vérifications v1.5.7

| Check | Status |
|-------|--------|
| handle_new_user trigger | ✅ |
| profiles INSERT policy | ✅ |
| accept_supplier_offer function | ✅ |
| get_users_by_status_with_email function | ✅ |
| delivery_code trigger | ✅ |
| generate_confirmation_code (8 chars) | ✅ |

### Changements depuis v1.5.6

| Élément | Ajouté/Modifié |
|---------|----------------|
| Trigger `handle_new_user` | 🔧 Modifié (search_path corrigé) |
| Trigger `create_notification_preferences_for_new_user` | 🔧 Modifié (bloc EXCEPTION ajouté) |
| Policy `profiles_insert_new_user` | ✨ Ajoutée |
| Policy `notification_preferences` INSERT | 🔧 Modifiée |
| Function `accept_supplier_offer` | ✨ Ajoutée |
| Function `get_users_by_status_with_email` | ✨ Ajoutée |
| Function `generate_confirmation_code` | 🔧 Modifiée (8 chars) |

---

## 1.  Tables (33 tables)

| # | Table |
|---|-------|
| 1 | available_modules |
| 2 | commission_settings |
| 3 | night_guard_schedule |
| 4 | notification_preferences |
| 5 | notifications |
| 6 | order_items |
| 7 | order_pricing_snapshot |
| 8 | orders |
| 9 | orders_with_coords |
| 10 | organization_members |
| 11 | organizations |
| 12 | payment_methods |
| 13 | price_analytics |
| 14 | pricing_categories |
| 15 | products |
| 16 | profiles |
| 17 | push_subscriptions |
| 18 | ratings |
| 19 | reference_prices |
| 20 | role_permissions |
| 21 | supplier_offers |
| 22 | supplier_price_grid_history |
| 23 | supplier_price_grids |
| 24 | supplier_zones |
| 25 | support_tickets |
| 26 | ticket_attachments |
| 27 | ticket_messages |
| 28 | transfer_orders |
| 29 | transfers |
| 30 | user_activity_log |
| 31 | user_module_permissions |
| 32 | zone_registration_requests |
| 33 | zones |

---

## 2. Triggers (18 triggers)

| Trigger | Event | Table | Function |
|---------|-------|-------|----------|
| trigger_log_order_activity | INSERT | orders | log_order_activity() |
| trigger_log_order_activity | UPDATE | orders | log_order_activity() |
| trigger_notify_order_status_change | UPDATE | orders | create_notification_on_order_status_change() |
| trigger_notify_suppliers_new_order | INSERT | orders | create_notification_on_new_order() |
| trigger_record_delivery_user | UPDATE | orders | record_delivery_user() |
| trigger_set_delivery_code | UPDATE | orders | set_delivery_confirmation_code() |
| trigger_update_sold_quantities | INSERT | orders | update_sold_quantities_on_order() |
| trigger_update_sold_quantities | UPDATE | orders | update_sold_quantities_on_order() |
| trigger_validate_delivery | UPDATE | orders | validate_delivery_before_delivered() |
| trigger_update_pricing_categories_updated_at | UPDATE | pricing_categories | update_pricing_categories_updated_at() |
| trigger_update_reference_prices_updated_at | UPDATE | reference_prices | update_reference_prices_updated_at() |
| trigger_notify_client_new_offer | INSERT | supplier_offers | create_notification_on_new_offer() |
| trigger_update_order_status_on_offer | INSERT | supplier_offers | update_order_status_on_offer() |
| trigger_log_supplier_price_grid_changes | DELETE | supplier_price_grids | log_supplier_price_grid_changes() |
| trigger_log_supplier_price_grid_changes | INSERT | supplier_price_grids | log_supplier_price_grid_changes() |
| trigger_log_supplier_price_grid_changes | UPDATE | supplier_price_grids | log_supplier_price_grid_changes() |
| trigger_update_supplier_price_grids_updated_at | UPDATE | supplier_price_grids | update_supplier_price_grids_updated_at() |
| user_module_permissions_updated_at | UPDATE | user_module_permissions | update_user_module_permissions_updated_at() |

---

## 3. Fonctions (63 fonctions)

| Function |
|----------|
| accept_supplier_offer |
| can_add_member |
| check_single_accepted_offer |
| create_notification_on_new_offer |
| create_notification_on_new_order |
| create_notification_on_order_status_change |
| create_notification_preferences_for_new_user |
| create_organization_with_owner |
| generate_confirmation_code |
| generate_ticket_number |
| get_client_info_for_order |
| get_client_profiles_for_supplier |
| get_organization_member_count |
| get_pending_ratings_for_user |
| get_profile_for_rating |
| get_reference_price |
| get_supplier_info_for_order |
| get_supplier_price_grid |
| get_supplier_profiles_for_client |
| get_user_permissions |
| get_users_by_status_with_email |
| handle_new_user |
| has_pending_ratings |
| has_permission |
| has_role |
| has_team_access |
| is_admin |
| is_approved |
| is_approved_user |
| is_client |
| is_current_user_admin |
| is_organization_owner |
| is_supplier |
| log_order_activity |
| log_profile_update_activity |
| log_rating_activity |
| log_supplier_price_grid_changes |
| notify_admins_new_zone_request |
| notify_supplier_request_reviewed |
| record_delivery_user |
| reset_supplier_sold_quantities |
| set_delivery_confirmation_code |
| update_order_status_on_offer |
| update_orders_on_transfer_completion |
| update_organization_members_updated_at |
| update_organizations_updated_at |
| update_pricing_categories_updated_at |
| update_reference_prices_updated_at |
| update_sold_quantities_on_order |
| update_supplier_price_grids_updated_at |
| update_supplier_zone_stats |
| update_ticket_timestamp |
| update_updated_at_column |
| update_user_module_permissions_updated_at |
| update_user_rating |
| update_zone_request_timestamp |
| validate_delivery_before_delivered |

---

## 4. Policies RLS (117 policies sur 32 tables)

| Table | Nb Policies |
|-------|-------------|
| available_modules | 1 |
| commission_settings | 4 |
| night_guard_schedule | 2 |
| notification_preferences | 3 |
| notifications | 6 |
| order_items | 5 |
| order_pricing_snapshot | 3 |
| orders | 8 |
| organization_members | 5 |
| organizations | 5 |
| payment_methods | 4 |
| price_analytics | 2 |
| pricing_categories | 2 |
| products | 4 |
| profiles | 5 |
| push_subscriptions | 3 |
| ratings | 4 |
| reference_prices | 2 |
| role_permissions | 1 |
| supplier_offers | 7 |
| supplier_price_grid_history | 2 |
| supplier_price_grids | 3 |
| supplier_zones | 6 |
| support_tickets | 6 |
| ticket_attachments | 4 |
| ticket_messages | 4 |
| transfer_orders | 4 |
| transfers | 4 |
| user_activity_log | 3 |
| user_module_permissions | 4 |
| zone_registration_requests | 5 |
| zones | 4 |

---

## 5. Dernières Migrations (20)

| Version | Name |
|---------|------|
| 20251229194945 | debug_trigger_with_detailed_logs |
| 20251229185519 | fix_profiles_insert_policy_for_trigger |
| 20251229180858 | fix_notification_prefs_rls_policy |
| 20251229180841 | fix_notification_prefs_trigger |
| 20251229005347 | fix_trigger_final_robust_v5 |
| 20251229005309 | fix_trigger_minimal_test_v4 |
| 20251229005229 | fix_trigger_remove_insert_policy |
| 20251229005151 | fix_trigger_ultra_simple_test |
| 20251229004854 | fix_registration_trigger_final_v3 |
| 20251229002313 | create_get_users_by_status_function |
| 20251229002203 | fix_registration_trigger_v2 |
| 20251229000146 | fix_registration_complete_final |
| 20251227053316 | restore_delivery_code_trigger |
| 20251224023045 | add_geolocation_columns |
| 20251223121939 | add_geolocation_columns |
| 20251223020032 | create_notification_system |
| 20251223002051 | create_module_permissions_system |
| 20251222024435 | fix_critical_rls_security_vulnerabilities |
| 20251222005158 | add_delivery_cost_to_orders |
| 20251221142154 | fix_order_items_visibility_for_suppliers_in_zones |

---

## 6. Fonctions Critiques - Code Source

### handle_new_user

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
```

### accept_supplier_offer

```sql
CREATE OR REPLACE FUNCTION accept_supplier_offer(
  p_offer_id UUID,
  p_order_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_offer RECORD;
  v_result JSON;
BEGIN
  -- Récupérer l'offre
  SELECT * INTO v_offer
  FROM supplier_offers
  WHERE id = p_offer_id AND order_id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Offre non trouvée');
  END IF;
  
  -- Mettre à jour l'offre si pas encore acceptée
  IF v_offer. status != 'accepted' THEN
    UPDATE supplier_offers
    SET status = 'accepted'
    WHERE id = p_offer_id;
  END IF;
  
  -- Mettre à jour la commande
  UPDATE orders
  SET 
    status = 'awaiting-payment',
    supplier_id = v_offer.supplier_id,
    total_amount = v_offer.total_amount,
    consigne_total = v_offer.consigne_total,
    supplier_commission = v_offer.supplier_commission,
    net_supplier_amount = v_offer.net_supplier_amount
  WHERE id = p_order_id
    AND status IN ('pending-offers', 'offers-received');
  
  RETURN json_build_object(
    'success', true,
    'message', 'Commande mise à jour',
    'offer_id', p_offer_id,
    'order_id', p_order_id,
    'supplier_id', v_offer.supplier_id
  );
END;
$$;
```

### generate_confirmation_code

```sql
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;
```

### get_users_by_status_with_email

```sql
CREATE OR REPLACE FUNCTION get_users_by_status_with_email(status_filter TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  approval_status TEXT,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier que l'appelant est admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    u.email:: TEXT,
    p.full_name,
    p.role:: TEXT,
    p.approval_status:: TEXT,
    p.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.approval_status:: TEXT = status_filter
  ORDER BY p.created_at DESC;
END;
$$;
```

---

## 7. Notes de Restauration

### En cas de régression

1. **Code source** : `git checkout v1.5.7`
2. **Base de données** :  Utiliser le Point-in-Time Recovery de Supabase
3. **Timestamp de référence** : 29 Décembre 2025, 05:30 UTC

### Vérification de l'Intégrité

```sql
-- Vérifier le nombre de tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Attendu : 33

-- Vérifier le nombre de triggers
SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';
-- Attendu : 18

-- Vérifier le nombre de fonctions
SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';
-- Attendu : ~63

-- Test code confirmation
SELECT generate_confirmation_code();
-- Attendu : Code 8 caractères alphanumériques (ex: M4PTRC76)
```

---

## 8. Comparaison v1.5.6 → v1.5.7

| Métrique | v1.5.6 | v1.5.7 | Delta |
|----------|--------|--------|-------|
| Tables | 33 | 33 | 0 |
| Triggers | ~14 | 18 | +4 |
| Fonctions | ~56 | 63 | +7 |
| Policies | ~110 | 117 | +7 |
| Migrations | ~88 | 100+ | +12 |

---

## 📞 Support

En cas de problème de restauration : 
1. Vérifier les logs dans Dashboard > Logs
2. Consulter la documentation :  https://supabase.com/docs
3. Contacter le support Supabase si nécessaire