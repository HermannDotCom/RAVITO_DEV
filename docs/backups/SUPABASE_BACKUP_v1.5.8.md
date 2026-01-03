# 🗄️ SUPABASE BACKUP v1.5.8

**Date :** 03 Janvier 2026  
**Release :** v1.5.8  
**Précédent :** v1.5.7

---

## 📋 Résumé

Ce document constitue un **point de restauration** de la base de données Supabase pour la version v1.5.8. Cette version représente une refonte architecturale majeure du système multi-tenant et de la gestion des permissions.

### ✅ Vérifications v1.5.8

| Check | Status |
|-------|--------|
| user_has_org_access function | ✅ |
| is_super_admin function | ✅ |
| get_organization_owner_id function | ❌ (Implémenté côté frontend) |
| profiles.is_super_admin column | ✅ |
| custom_roles table | ✅ |
| Organisation Administration RAVITO | ✅ |
| zones_select_public_active policy | ✅ |
| handle_new_user trigger | ✅ |
| accept_supplier_offer function | ✅ |

### Changements depuis v1.5.7

| Élément | Ajouté/Modifié |
|---------|----------------|
| Function `user_has_org_access` | 🔧 Modifiée (COALESCE pour propriétaires) |
| Function `is_super_admin` | ✨ Ajoutée |
| Table `custom_roles` | ✨ Ajoutée |
| Table `migration_history` | ✨ Ajoutée |
| Colonne `profiles.is_super_admin` | ✨ Ajoutée |
| Colonne `profiles.full_name` | ✨ Ajoutée |
| Colonnes `organization_members` | ✨ Ajoutées (custom_role_id, is_active, allowed_pages, password_set_by_owner, last_login_at, login_count) |
| Policy `zones_select_public_active` | ✨ Ajoutée (accès anon) |
| Policy `supplier_zones_select_all` | 🗑️ Supprimée (dangereuse) |
| Trigger `trigger_custom_roles_updated_at` | ✨ Ajouté |
| Trigger `trigger_sync_profile_names` | ✨ Ajouté |
| Organisation "Administration RAVITO" | ✨ Créée |

---

## 1.  Tables (34 tables)

| # | Table |
|---|-------|
| 1 | available_modules |
| 2 | commission_settings |
| 3 | custom_roles |
| 4 | migration_history |
| 5 | night_guard_schedule |
| 6 | notification_preferences |
| 7 | notifications |
| 8 | order_items |
| 9 | order_pricing_snapshot |
| 10 | orders |
| 11 | organization_members |
| 12 | organizations |
| 13 | payment_methods |
| 14 | price_analytics |
| 15 | pricing_categories |
| 16 | products |
| 17 | profiles |
| 18 | push_subscriptions |
| 19 | ratings |
| 20 | reference_prices |
| 21 | role_permissions |
| 22 | supplier_offers |
| 23 | supplier_price_grid_history |
| 24 | supplier_price_grids |
| 25 | supplier_zones |
| 26 | support_tickets |
| 27 | ticket_attachments |
| 28 | ticket_messages |
| 29 | transfer_orders |
| 30 | transfers |
| 31 | user_activity_log |
| 32 | user_module_permissions |
| 33 | zone_registration_requests |
| 34 | zones |

---

## 2. Triggers (21 triggers)

| Trigger | Event | Table | Function |
|---------|-------|-------|----------|
| trigger_custom_roles_updated_at | UPDATE | custom_roles | update_custom_roles_updated_at() |
| trigger_log_order_activity | INSERT | orders | log_order_activity() |
| trigger_log_order_activity | UPDATE | orders | log_order_activity() |
| trigger_notify_order_status_change | UPDATE | orders | create_notification_on_order_status_change() |
| trigger_notify_suppliers_new_order | INSERT | orders | create_notification_on_new_order() |
| trigger_record_delivery_user | UPDATE | orders | record_delivery_user() |
| trigger_set_delivery_code | UPDATE | orders | set_delivery_confirmation_code() |
| trigger_update_sold_quantities | UPDATE | orders | update_sold_quantities_on_order() |
| trigger_update_sold_quantities | INSERT | orders | update_sold_quantities_on_order() |
| trigger_validate_delivery | UPDATE | orders | validate_delivery_before_delivered() |
| trigger_update_pricing_categories_updated_at | UPDATE | pricing_categories | update_pricing_categories_updated_at() |
| trigger_sync_profile_names | UPDATE | profiles | sync_profile_names() |
| trigger_sync_profile_names | INSERT | profiles | sync_profile_names() |
| trigger_update_reference_prices_updated_at | UPDATE | reference_prices | update_reference_prices_updated_at() |
| trigger_notify_client_new_offer | INSERT | supplier_offers | create_notification_on_new_offer() |
| trigger_update_order_status_on_offer | INSERT | supplier_offers | update_order_status_on_offer() |
| trigger_log_supplier_price_grid_changes | INSERT | supplier_price_grids | log_supplier_price_grid_changes() |
| trigger_log_supplier_price_grid_changes | UPDATE | supplier_price_grids | log_supplier_price_grid_changes() |
| trigger_log_supplier_price_grid_changes | DELETE | supplier_price_grids | log_supplier_price_grid_changes() |
| trigger_update_supplier_price_grids_updated_at | UPDATE | supplier_price_grids | update_supplier_price_grids_updated_at() |
| user_module_permissions_updated_at | UPDATE | user_module_permissions | update_user_module_permissions_updated_at() |

---

## 3. Fonctions (70 fonctions)

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
| is_super_admin |
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
| sync_profile_names |
| update_custom_roles_updated_at |
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
| user_has_org_access |
| validate_delivery_before_delivered |
| ...  *(70 fonctions au total)* |

---

## 4. Policies RLS (140 policies sur 33 tables)

| Table | Nb Policies |
|-------|-------------|
| available_modules | 1 |
| commission_settings | 4 |
| custom_roles | 2 |
| night_guard_schedule | 2 |
| notification_preferences | 3 |
| notifications | 7 |
| order_items | 6 |
| order_pricing_snapshot | 3 |
| orders | 8 |
| organization_members | 5 |
| organizations | 5 |
| payment_methods | 4 |
| price_analytics | 2 |
| pricing_categories | 2 |
| products | 4 |
| profiles | 6 |
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

## 5. Dernières Migrations (20)

| Version | Name |
|---------|------|
| 20260103185645 | allow_public_read_active_zones_v2 |
| 20260103184237 | add_admin_test_to_organization |
| 20260103184043 | create_administration_organization |
| 20260103170833 | add_organizations_owner_fk |
| 20260103170747 | fix_accept_offer_unit_price_constraint |
| 20260102231849 | add_debug_function_for_org_access |
| 20260102231822 | fix_user_has_org_access_with_coalesce |
| 20260102225807 | fix_user_has_org_access_for_owners |
| 20260102224048 | fix_permissions_system_super_admin |
| 20260102214757 | create_missing_organizations_final |
| 20260102185306 | create_missing_organizations_for_existing_users_v2 |
| 20260102173710 | fix_rls_orders_and_supplier_zones_for_members |
| 20260102161213 | fix_rls_uniform_data_access_for_members_v2 |
| 20260102152851 | fix_rls_organization_members_access |
| 20251229194945 | debug_trigger_with_detailed_logs |
| 20251229185519 | fix_profiles_insert_policy_for_trigger |
| 20251229180858 | fix_notification_prefs_rls_policy |
| 20251229180841 | fix_notification_prefs_trigger |
| 20251229005347 | fix_trigger_final_robust_v5 |
| 20251229005309 | fix_trigger_minimal_test_v4 |

---

## 6. Fonctions Critiques - Code Source

### user_has_org_access

```sql
CREATE OR REPLACE FUNCTION public.user_has_org_access(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_org_id uuid;
  v_target_org_id uuid;
BEGIN
  -- Si c'est le même utilisateur, accès autorisé
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;

  -- Obtenir l'organisation de l'utilisateur connecté
  -- Cherche d'abord si propriétaire, sinon si membre
  SELECT COALESCE(
    (SELECT id FROM organizations WHERE owner_id = auth.uid() LIMIT 1),
    (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active' LIMIT 1)
  ) INTO v_current_org_id;

  -- Si pas d'organisation, pas d'accès
  IF v_current_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Obtenir l'organisation de l'utilisateur cible
  -- Cherche d'abord si propriétaire, sinon si membre
  SELECT COALESCE(
    (SELECT id FROM organizations WHERE owner_id = target_user_id LIMIT 1),
    (SELECT organization_id FROM organization_members WHERE user_id = target_user_id AND status = 'active' LIMIT 1)
  ) INTO v_target_org_id;

  -- Si l'utilisateur cible n'a pas d'organisation, pas d'accès
  IF v_target_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Vérifier si les deux utilisateurs sont dans la même organisation
  RETURN v_current_org_id = v_target_org_id;
END;
$function$;
```

### is_super_admin

```sql
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$function$;
```

### accept_supplier_offer

```sql
-- (Inchangée depuis v1.5.7)
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
  IF v_offer.status != 'accepted' THEN
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
-- (Inchangée depuis v1.5.7)
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

---

## 7. Colonnes organization_members

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| organization_id | uuid | NO | null |
| user_id | uuid | YES | null |
| email | text | NO | null |
| role | text | NO | null |
| permissions | jsonb | YES | '{}'::jsonb |
| status | text | NO | 'pending'::text |
| invitation_token | text | YES | null |
| invited_at | timestamp with time zone | NO | now() |
| accepted_at | timestamp with time zone | YES | null |
| created_at | timestamp with time zone | NO | now() |
| updated_at | timestamp with time zone | NO | now() |
| **custom_role_id** | uuid | YES | null |
| **is_active** | boolean | YES | true |
| **allowed_pages** | ARRAY | YES | null |
| **password_set_by_owner** | boolean | YES | false |
| **last_login_at** | timestamp with time zone | YES | null |
| **login_count** | integer | YES | 0 |

> **Note :** Les colonnes en **gras** ont été ajoutées dans v1.5.8

---

## 8. Colonnes profiles

| Column | Type | Nullable |
|--------|------|----------|
| id | uuid | NO |
| role | USER-DEFINED | NO |
| name | text | NO |
| phone | text | YES |
| address | text | YES |
| business_name | text | YES |
| business_hours | text | YES |
| responsible_person | text | YES |
| coverage_zone | text | YES |
| delivery_capacity | USER-DEFINED | YES |
| rating | numeric | YES |
| total_orders | integer | YES |
| is_active | boolean | YES |
| is_approved | boolean | YES |
| approval_status | USER-DEFINED | YES |
| approved_at | timestamp with time zone | YES |
| rejected_at | timestamp with time zone | YES |
| rejection_reason | text | YES |
| created_at | timestamp with time zone | YES |
| updated_at | timestamp with time zone | YES |
| is_admin | boolean | YES |
| email | text | YES |
| zone_id | uuid | YES |
| delivery_latitude | numeric | YES |
| delivery_longitude | numeric | YES |
| delivery_instructions | text | YES |
| **full_name** | text | YES |
| **is_super_admin** | boolean | YES |

> **Note :** Les colonnes en **gras** ont été ajoutées dans v1.5.8

---

## 9. Notes de Restauration

### En cas de régression

1. **Code source** : `git checkout v1.5.8`
2. **Base de données** :  Utiliser le Point-in-Time Recovery de Supabase
3. **Timestamp de référence** : 03 Janvier 2026, 19:00 UTC

### Vérification de l'Intégrité

```sql
-- Vérifier le nombre de tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Attendu : 34

-- Vérifier le nombre de triggers
SELECT COUNT(*) FROM information_schema.triggers 
WHERE trigger_schema = 'public';
-- Attendu : 21

-- Vérifier le nombre de fonctions
SELECT COUNT(*) FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
-- Attendu : 70

-- Vérifier le nombre de policies
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- Attendu : 140

-- Vérifier is_super_admin
SELECT is_super_admin FROM profiles WHERE email = 'hnguessan@hotmail.com';
-- Attendu : true

-- Vérifier organisation Admin
SELECT name, type, owner_id FROM organizations WHERE name = 'Administration RAVITO';
-- Attendu : 1 ligne

-- Test code confirmation
SELECT generate_confirmation_code();
-- Attendu : Code 8 caractères alphanumériques (ex: M4PTRC76)

-- Test user_has_org_access
SELECT user_has_org_access(auth.uid());
-- Attendu : true (si connecté)

-- Test is_super_admin
SELECT is_super_admin();
-- Attendu : true/false selon l'utilisateur
```

---

## 10. Comparaison v1.5.7 → v1.5.8

| Métrique | v1.5.7 | v1.5.8 | Delta |
|----------|--------|--------|-------|
| Tables | 33 | 34 | **+1** |
| Triggers | 18 | 21 | **+3** |
| Fonctions | 63 | 70 | **+7** |
| Policies | 117 | 140 | **+23** |
| Migrations | ~100 | 120+ | **+20** |

### Nouvelles Tables v1.5.8
- `custom_roles` - Rôles personnalisables par organisation
- `migration_history` - Historique des migrations

### Nouveaux Triggers v1.5.8
- `trigger_custom_roles_updated_at` - Mise à jour timestamp custom_roles
- `trigger_sync_profile_names` (INSERT) - Synchronisation noms profils
- `trigger_sync_profile_names` (UPDATE) - Synchronisation noms profils

### Nouvelles Fonctions v1.5.8
- `is_super_admin()` - Vérifie si l'utilisateur est Super Admin
- `user_has_org_access()` - Vérifie l'accès organisation (refactorisée avec COALESCE)
- `sync_profile_names()` - Synchronise les noms de profils
- `update_custom_roles_updated_at()` - Met à jour le timestamp des rôles
- +3 autres fonctions utilitaires

---

## 📞 Support

En cas de problème de restauration : 
1. Vérifier les logs dans Dashboard > Logs
2. Consulter la documentation :  https://supabase.com/docs
3. Contacter le support Supabase si nécessaire

---

## 🏷️ Tags de Release

- **Git Tag** : v1.5.8
- **Commit** : [À compléter après création de la release]
- **Date** : 03 Janvier 2026