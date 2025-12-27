# Sauvegarde du Schéma de Base de Données Supabase - Version v1.5.6

**Projet :** RAVITO_DEV  
**Date :** 27 Décembre 2025  
**Dernière migration appliquée :** `20251224023045_20251223121939_add_geolocation_columns`

---

## 1. Tables du Schéma public

| # | Table |
|---|-------|
| 1 | zones |
| 2 | user_activity_log |
| 3 | profiles |
| 4 | orders |
| 5 | ratings |
| 6 | supplier_zones |
| 7 | payment_methods |
| 8 | ticket_messages |
| 9 | commission_settings |
| 10 | ticket_attachments |
| 11 | pricing_categories |
| 12 | order_items |
| 13 | notifications |
| 14 | support_tickets |
| 15 | zone_registration_requests |
| 16 | products |
| 17 | reference_prices |
| 18 | price_analytics |
| 19 | orders_with_coords |
| 20 | supplier_price_grid_history |
| 21 | organization_members |
| 22 | supplier_offers |
| 23 | organizations |
| 24 | transfers |
| 25 | transfer_orders |
| 26 | role_permissions |
| 27 | order_pricing_snapshot |
| 28 | night_guard_schedule |
| 29 | available_modules |
| 30 | supplier_price_grids |
| 31 | user_module_permissions |
| 32 | notification_preferences |
| 33 | push_subscriptions |

**Total : 33 tables**

---

## 2. Triggers

| Trigger | Event | Table | Function |
|---------|-------|-------|----------|
| trigger_notify_suppliers_new_order | INSERT | orders | create_notification_on_new_order() |
| trigger_notify_order_status_change | UPDATE | orders | create_notification_on_order_status_change() |
| trigger_log_order_activity | INSERT, UPDATE | orders | log_order_activity() |
| trigger_set_delivery_code | UPDATE | orders | set_delivery_confirmation_code() |
| trigger_validate_delivery | UPDATE | orders | validate_delivery_before_delivered() |
| trigger_update_sold_quantities | INSERT, UPDATE | orders | update_sold_quantities_on_order() |
| trigger_record_delivery_user | UPDATE | orders | record_delivery_user() |
| trigger_update_pricing_categories_updated_at | UPDATE | pricing_categories | update_pricing_categories_updated_at() |
| trigger_update_reference_prices_updated_at | UPDATE | reference_prices | update_reference_prices_updated_at() |
| trigger_update_supplier_price_grids_updated_at | UPDATE | supplier_price_grids | update_supplier_price_grids_updated_at() |
| trigger_notify_client_new_offer | INSERT | supplier_offers | create_notification_on_new_offer() |
| trigger_update_order_status_on_offer | INSERT | supplier_offers | update_order_status_on_offer() |
| trigger_log_supplier_price_grid_changes | INSERT, UPDATE, DELETE | supplier_price_grids | log_supplier_price_grid_changes() |
| user_module_permissions_updated_at | UPDATE | user_module_permissions | update_user_module_permissions_updated_at() |

**Total : 14 triggers**

---

## 3. Fonctions (56 fonctions)

### Fonctions d'authentification et permissions
- `is_admin()` - Vérifie si l'utilisateur est admin
- `is_client()` - Vérifie si l'utilisateur est client
- `is_supplier()` - Vérifie si l'utilisateur est fournisseur
- `is_approved()` - Vérifie si l'utilisateur est approuvé
- `is_approved_user()` - Vérifie si l'utilisateur est approuvé
- `has_role()` - Vérifie le rôle de l'utilisateur
- `has_permission()` - Vérifie les permissions
- `get_user_permissions()` - Récupère les permissions utilisateur
- `has_team_access()` - Vérifie l'accès équipe

### Fonctions de gestion des commandes
- `set_delivery_confirmation_code()` - Génère le code de confirmation (8 chars)
- `generate_confirmation_code()` - Génère un code alphanumérique
- `validate_delivery_before_delivered()` - Valide avant livraison
- `record_delivery_user()` - Enregistre le livreur
- `log_order_activity()` - Log les activités commande
- `update_order_status_on_offer()` - Met à jour le statut sur offre

### Fonctions de notifications
- `create_notification_on_new_order()` - Notification nouvelle commande
- `create_notification_on_order_status_change()` - Notification changement statut
- `create_notification_on_new_offer()` - Notification nouvelle offre
- `create_notification_preferences_for_new_user()` - Préférences notification

### Fonctions de profils et ratings
- `handle_new_user()` - Gère les nouveaux utilisateurs
- `update_user_rating()` - Met à jour la note utilisateur
- `get_pending_ratings_for_user()` - Récupère les ratings en attente
- `has_pending_ratings()` - Vérifie si ratings en attente
- `get_profile_for_rating()` - Récupère le profil pour rating
- `get_supplier_profiles_for_client()` - Profils fournisseurs pour client
- `get_client_profiles_for_supplier()` - Profils clients pour fournisseur
- `log_profile_update_activity()` - Log les mises à jour profil
- `log_rating_activity()` - Log les activités rating

### Fonctions d'organisations
- `create_organization_with_owner()` - Crée une organisation
- `is_organization_owner()` - Vérifie si propriétaire
- `get_organization_member_count()` - Compte les membres
- `can_add_member()` - Vérifie si peut ajouter membre
- `update_organizations_updated_at()` - Met à jour timestamp
- `update_organization_members_updated_at()` - Met à jour timestamp membres

### Fonctions de pricing
- `get_reference_price()` - Récupère le prix de référence
- `get_supplier_price_grid()` - Récupère la grille de prix
- `update_pricing_categories_updated_at()` - Met à jour timestamp
- `update_reference_prices_updated_at()` - Met à jour timestamp
- `update_supplier_price_grids_updated_at()` - Met à jour timestamp
- `log_supplier_price_grid_changes()` - Log les changements de grille

### Fonctions de zones
- `update_supplier_zone_stats()` - Met à jour les stats de zone
- `update_zone_request_timestamp()` - Met à jour timestamp demande
- `notify_admins_new_zone_request()` - Notifie les admins
- `notify_supplier_request_reviewed()` - Notifie le fournisseur

### Fonctions de support
- `generate_ticket_number()` - Génère un numéro de ticket
- `update_ticket_timestamp()` - Met à jour timestamp ticket

### Autres fonctions
- `update_updated_at_column()` - Met à jour colonne updated_at
- `check_single_accepted_offer()` - Vérifie offre unique acceptée
- `update_orders_on_transfer_completion()` - Met à jour commandes sur transfert
- `reset_supplier_sold_quantities()` - Réinitialise quantités vendues
- `update_sold_quantities_on_order()` - Met à jour quantités vendues
- `get_client_info_for_order()` - Info client pour commande
- `get_supplier_info_for_order()` - Info fournisseur pour commande
- `update_user_module_permissions_updated_at()` - Met à jour timestamp permissions

---

## 4. Politiques RLS (Row Level Security)

### Tables avec RLS activé

| Table | Nombre de politiques |
|-------|---------------------|
| available_modules | 1 |
| commission_settings | 4 |
| night_guard_schedule | 2 |
| notification_preferences | 3 |
| notifications | 6 |
| order_items | 5 |
| order_pricing_snapshot | 3 |
| orders | 7 |
| organization_members | 5 |
| organizations | 5 |
| payment_methods | 4 |
| price_analytics | 2 |
| pricing_categories | 2 |
| products | 4 |
| profiles | 6 |
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

**Total : 101 politiques RLS**

---

## 5. Notes de Restauration

### En cas de régression
1. **Code source** : `git checkout v1.5.6`
2. **Base de données** : Utiliser le Point-in-Time Recovery de Supabase Pro
3. **Timestamp de référence** : 27 Décembre 2025, avant migration `20251227053316`

### Migrations incluses jusqu'à v1.5.6
- Toutes les migrations jusqu'à `20251223121939_add_geolocation_columns.sql`

### Migrations POST v1.5.6 (à appliquer pour v1.5.7+)
- `20251227053316_restore_delivery_code_trigger.sql`

---

## 6. Vérification de l'intégrité

```sql
-- Vérifier le nombre de tables
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Attendu : 33

-- Vérifier le nombre de triggers
SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';
-- Attendu : 14+

-- Vérifier le nombre de fonctions
SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public';
-- Attendu : 56+

-- Vérifier le trigger de confirmation code
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name LIKE '%delivery%' AND trigger_schema = 'public';
-- Attendu : trigger_set_delivery_code
```
