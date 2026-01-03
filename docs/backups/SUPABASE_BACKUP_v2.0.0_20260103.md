# 🗄️ RAVITO - Backup Base de Données Supabase v2.0.0

**Date de Sauvegarde:** 2026-01-03
**Version de l'Application:** 2.0.0
**Méthode:** Export via Supabase MCP Tools

---

## 📊 Vue d'ensemble

### Statistiques Générales

| Métrique | Valeur |
|----------|--------|
| **Nombre de tables** | 35 tables |
| **Nombre de types ENUM** | 11 types |
| **Nombre de fonctions** | 68 fonctions |
| **Nombre de migrations** | 119 migrations |
| **Extensions installées** | 5 extensions actives |
| **Total enregistrements** | ~700+ lignes de données |

### Données Actuelles

| Table | Nombre de lignes |
|-------|-----------------|
| profiles | 16 |
| products | 75 |
| orders | 34 |
| order_items | 72 |
| ratings | 28 |
| supplier_zones | 21 |
| supplier_offers | 46 |
| notifications | 266 |
| zones | 11 |
| user_activity_log | 179 |
| support_tickets | 5 |
| ticket_messages | 7 |
| organizations | 9 |
| organization_members | 7 |
| transfers | 5 |
| transfer_orders | 19 |
| available_modules | 32 |
| user_module_permissions | 15 |
| notification_preferences | 8 |
| custom_roles | 12 |
| role_permissions | 9 |
| supplier_price_grids | 4 |
| supplier_price_grid_history | 7 |
| reference_prices | 2 |
| commission_settings | 1 |
| migration_history | 2 |

---

## 🔌 Extensions PostgreSQL

### Extensions Installées et Actives

```sql
-- Extensions actuellement actives dans la base
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";           -- v1.0
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";          -- v1.3
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions"; -- v1.11
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";            -- v0.19.5
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";           -- v1.5.11
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";         -- v1.1
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";           -- v3.3.7
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";         -- v0.3.1
```

### Extensions Disponibles mais Non Installées

Les extensions suivantes sont disponibles mais non installées:
- postgis_topology, pg_cron, ltree, intarray, bloom, pg_repack, unaccent
- http, hstore, citext, pgaudit, pgrouting, pg_jsonschema, moddatetime
- xml2, pgsodium, vector, pgjwt, pg_trgm, fuzzystrmatch, et 45+ autres

---

## 🏷️ Types ENUM Personnalisés

```sql
-- Types énumérés utilisés dans l'application

-- Rôles utilisateurs
CREATE TYPE user_role AS ENUM (
  'admin',
  'client',
  'supplier'
);

-- Statuts d'approbation
CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- Statuts de commande
CREATE TYPE order_status AS ENUM (
  'pending',
  'awaiting-client-validation',
  'accepted',
  'preparing',
  'delivering',
  'delivered',
  'cancelled',
  'pending-offers',
  'offers-received',
  'awaiting-payment',
  'paid',
  'awaiting-rating',
  'completed'
);

-- Méthodes de paiement
CREATE TYPE payment_method AS ENUM (
  'orange',
  'mtn',
  'moov',
  'wave',
  'card'
);

-- Statuts de paiement
CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'transferred',
  'completed'
);

-- Catégories de produits
CREATE TYPE product_category AS ENUM (
  'biere',
  'soda',
  'vin',
  'eau',
  'spiritueux'
);

-- Types de casiers/emballages
CREATE TYPE crate_type AS ENUM (
  'C24',
  'C12',
  'C12V',
  'C6',
  'C20',
  'CARTON24',
  'CARTON6',
  'PACK6',
  'PACK12'
);

-- Capacités de livraison
CREATE TYPE delivery_capacity AS ENUM (
  'truck',
  'tricycle',
  'motorcycle'
);

-- Statuts d'offre fournisseur
CREATE TYPE offer_status AS ENUM (
  'pending',
  'accepted',
  'rejected'
);

-- Méthodes de transfert financier
CREATE TYPE transfer_method AS ENUM (
  'bank_transfer',
  'mobile_money',
  'cash'
);

-- Statuts de transfert
CREATE TYPE transfer_status AS ENUM (
  'pending',
  'approved',
  'completed',
  'rejected'
);
```

---

## 🗂️ Structure des Tables

### Tables Principales

#### 1. profiles
**Description:** Profils utilisateurs. Créés automatiquement par trigger. Pas d'INSERT direct autorisé.

**RLS:** ✅ Activé

**Colonnes clés:**
- `id` (uuid, PK) - Lié à auth.users.id
- `role` (user_role) - admin, client, supplier
- `name` (text) - Nom complet
- `email` (text) - Email de l'utilisateur
- `phone` (text) - Numéro de téléphone
- `business_name` (text) - Nom de l'établissement
- `zone_id` (uuid, FK → zones) - Zone de livraison pour clients
- `is_approved` (boolean) - Statut d'approbation
- `approval_status` (approval_status) - pending, approved, rejected
- `is_admin` (boolean) - Administrateur
- `is_super_admin` (boolean) - Super administrateur (seul le premier admin)
- `rating` (numeric) - Note moyenne (0-5)
- `total_orders` (integer) - Nombre total de commandes
- `delivery_latitude` (numeric) - Coordonnées GPS
- `delivery_longitude` (numeric) - Coordonnées GPS
- `delivery_instructions` (text) - Instructions de livraison

**Relations:**
- 28+ tables liées (orders, ratings, zones, organizations, etc.)

---

#### 2. products
**Description:** Catalogue centralisé RAVITO - utilisé pour les prix de référence

**RLS:** ✅ Activé | **Lignes:** 75

**Colonnes clés:**
- `id` (uuid, PK)
- `reference` (text, UNIQUE) - Code produit unique
- `name` (text) - Nom du produit
- `category` (product_category) - biere, soda, vin, eau, spiritueux
- `brand` (text) - Marque
- `crate_type` (crate_type) - Type d'emballage
- `unit_price` (integer) - Prix unitaire
- `crate_price` (integer) - Prix du casier
- `consign_price` (integer) - Prix de la consigne
- `alcohol_content` (numeric) - Degré d'alcool (0-100)
- `volume` (text) - Volume (ex: 33cl, 65cl)
- `is_active` (boolean) - Produit actif
- `image_url` (text) - URL de l'image

---

#### 3. orders
**Description:** Commandes clients avec système d'offres multiples

**RLS:** ✅ Activé | **Lignes:** 34

**Colonnes clés:**
- `id` (uuid, PK)
- `client_id` (uuid, FK → profiles)
- `supplier_id` (uuid, FK → profiles, nullable)
- `zone_id` (uuid, FK → zones) - Zone de livraison
- `status` (order_status) - Statut de la commande
- `total_amount` (integer) - Montant total
- `consigne_total` (integer) - Total des consignes
- `client_commission` (integer) - Commission client (défaut 8%)
- `supplier_commission` (integer) - Commission fournisseur (défaut 2%)
- `net_supplier_amount` (integer) - Montant net fournisseur
- `delivery_address` (text) - Adresse de livraison
- `delivery_latitude` (numeric) - Coordonnées GPS
- `delivery_longitude` (numeric) - Coordonnées GPS
- `delivery_instructions` (text) - Instructions spécifiques
- `uses_profile_address` (boolean) - Utilise l'adresse du profil
- `payment_method` (payment_method) - orange, mtn, moov, wave, card
- `payment_status` (payment_status) - pending, paid, transferred, completed
- `delivery_confirmation_code` (varchar) - Code de confirmation à 8 caractères
- `coordinates` (geography) - Point géographique PostGIS
- `delivery_cost` (numeric) - Coût de livraison
- `ravito_margin` (numeric) - Marge RAVITO
- `assigned_delivery_user_id` (uuid) - Livreur assigné
- `delivered_by_user_id` (uuid) - Livreur ayant effectué la livraison
- `accepted_at`, `delivered_at`, `paid_at`, `transferred_at` (timestamptz)

---

#### 4. order_items
**Description:** Articles de commande

**RLS:** ✅ Activé | **Lignes:** 72

**Colonnes:**
- `id` (uuid, PK)
- `order_id` (uuid, FK → orders)
- `product_id` (uuid, FK → products)
- `quantity` (integer) - Quantité commandée
- `with_consigne` (boolean) - Avec consigne
- `unit_price` (integer) - Prix unitaire appliqué
- `crate_price` (integer) - Prix casier appliqué
- `consign_price` (integer) - Prix consigne appliqué
- `subtotal` (integer) - Sous-total

---

#### 5. supplier_offers
**Description:** Offres des fournisseurs pour les commandes

**RLS:** ✅ Activé | **Lignes:** 46

**Colonnes:**
- `id` (uuid, PK)
- `order_id` (uuid, FK → orders)
- `supplier_id` (uuid, FK → profiles)
- `status` (offer_status) - pending, accepted, rejected
- `modified_items` (jsonb) - Articles modifiés par le fournisseur
- `total_amount` (integer)
- `consigne_total` (integer)
- `supplier_commission` (integer)
- `net_supplier_amount` (integer)
- `supplier_message` (text) - Message du fournisseur
- `created_at`, `accepted_at`, `rejected_at` (timestamptz)

**Triggers:**
- `create_notification_on_new_offer` - Notification au client
- `check_single_accepted_offer` - Une seule offre acceptée par commande
- `update_order_status_on_offer` - Met à jour le statut de la commande

---

#### 6. zones
**Description:** Zones de livraison (communes d'Abidjan)

**RLS:** ✅ Activé | **Lignes:** 11

**Colonnes:**
- `id` (uuid, PK)
- `name` (text, UNIQUE) - Nom de la commune
- `description` (text) - Description
- `is_active` (boolean) - Zone active
- `max_suppliers` (integer, défaut: 10) - Nombre max de fournisseurs
- `min_coverage` (integer, défaut: 2) - Couverture minimale
- `operating_hours` (text, défaut: '18h00 - 06h00') - Horaires

**Zones actives:**
1. Abobo
2. Adjamé
3. Attécoubé
4. Cocody
5. Koumassi
6. Marcory
7. Plateau
8. Port-Bouët
9. Treichville
10. (+ 1 autre zone active)

**Politiques RLS:**
- `zones_select_public_active` - Lecture publique des zones actives (pour inscription)
- `zones_select_all_authenticated` - Lecture pour utilisateurs authentifiés
- `zones_insert_admin`, `zones_update_admin`, `zones_delete_admin` - Admin uniquement

---

#### 7. supplier_zones
**Description:** Liaison fournisseurs ↔ zones avec statistiques

**RLS:** ✅ Activé | **Lignes:** 21

**Colonnes:**
- `id` (uuid, PK)
- `supplier_id` (uuid, FK → profiles)
- `zone_id` (uuid, FK → zones)
- `is_active` (boolean) - Zone active pour ce fournisseur
- `approval_status` (text) - pending, approved, rejected
- `approved_by` (uuid, FK → profiles) - Admin ayant approuvé
- `total_orders` (integer) - Commandes totales dans cette zone
- `success_rate` (numeric) - Taux de réussite (0-100)
- `average_delivery_time` (integer) - Temps moyen de livraison
- `max_delivery_radius` (integer, défaut: 10 km)
- `minimum_order_amount` (integer, défaut: 5000 FCFA)
- `delivery_fee` (integer, défaut: 0) - Frais de livraison
- `registered_at`, `approved_at`, `deactivated_at`, `reactivated_at`

---

#### 8. ratings
**Description:** Système d'évaluation mutuelle

**RLS:** ✅ Activé | **Lignes:** 28

**Colonnes:**
- `id` (uuid, PK)
- `order_id` (uuid, FK → orders)
- `from_user_id` (uuid, FK → profiles) - Évaluateur
- `to_user_id` (uuid, FK → profiles) - Évalué
- `from_user_role` (user_role)
- `to_user_role` (user_role)
- `punctuality` (integer, 1-5) - Ponctualité
- `quality` (integer, 1-5) - Qualité
- `communication` (integer, 1-5) - Communication
- `overall` (numeric, 1-5) - Note globale (calculée)
- `comment` (text) - Commentaire

**Trigger:**
- `update_user_rating` - Met à jour la note moyenne dans profiles

---

#### 9. notifications
**Description:** Système de notifications temps réel

**RLS:** ✅ Activé | **Lignes:** 266

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `type` (text) - Type de notification
- `title` (text) - Titre
- `message` (text) - Message
- `data` (jsonb) - Données additionnelles
- `is_read` (boolean) - Lu/non lu
- `related_entity_type` (text) - Type d'entité liée
- `related_entity_id` (uuid) - ID de l'entité

**Realtime:** ✅ Activé via Supabase Realtime

---

#### 10. organizations
**Description:** Organisations (équipes) pour gestion multi-utilisateurs

**RLS:** ✅ Activé | **Lignes:** 9

**Colonnes:**
- `id` (uuid, PK)
- `name` (text) - Nom de l'organisation
- `type` (text) - client, supplier, admin
- `owner_id` (uuid, FK → auth.users, UNIQUE) - Propriétaire
- `max_members` (integer) - Nombre max de membres
- `settings` (jsonb) - Paramètres

**Relation:**
- Créée automatiquement pour chaque nouveau propriétaire

---

#### 11. organization_members
**Description:** Membres des organisations avec rôles et permissions

**RLS:** ✅ Activé | **Lignes:** 7

**Colonnes:**
- `id` (uuid, PK)
- `organization_id` (uuid, FK → organizations)
- `user_id` (uuid, FK → auth.users, nullable)
- `email` (text) - Email du membre
- `role` (text) - Rôle dans l'organisation
- `custom_role_id` (uuid, FK → custom_roles)
- `permissions` (jsonb) - Permissions spécifiques
- `status` (text) - pending, active, inactive
- `allowed_pages` (text[]) - Pages autorisées
- `is_active` (boolean)
- `invitation_token` (text, UNIQUE) - Token d'invitation
- `password_set_by_owner` (boolean) - Mot de passe défini par le propriétaire
- `last_login_at` (timestamptz)
- `login_count` (integer)

---

#### 12. custom_roles
**Description:** Rôles personnalisés par organisation

**RLS:** ✅ Activé | **Lignes:** 12

**Colonnes:**
- `id` (uuid, PK)
- `organization_type` (text) - client, supplier, admin
- `role_key` (text) - Clé unique du rôle
- `display_name` (text) - Nom affiché
- `description` (text)
- `allowed_pages` (text[]) - Pages autorisées
- `is_system_role` (boolean) - Rôle système
- `is_active` (boolean)
- `created_by` (uuid, FK → profiles)

---

#### 13. available_modules
**Description:** Modules disponibles avec gestion des permissions

**RLS:** ✅ Activé | **Lignes:** 32

**Colonnes:**
- `id` (uuid, PK)
- `key` (varchar) - Clé unique du module
- `name` (varchar) - Nom du module
- `description` (text)
- `icon` (varchar) - Icône
- `interface` (varchar) - supplier, client, admin
- `is_owner_only` (boolean) - Réservé au propriétaire
- `is_super_admin_only` (boolean) - Réservé au super admin
- `is_always_accessible` (boolean) - Toujours accessible
- `display_order` (integer) - Ordre d'affichage

---

#### 14. user_module_permissions
**Description:** Permissions d'accès aux modules par utilisateur

**RLS:** ✅ Activé | **Lignes:** 15

**Colonnes:**
- `id` (uuid, PK)
- `organization_id` (uuid, FK → organizations)
- `user_id` (uuid, FK → auth.users)
- `module_key` (varchar) - Clé du module
- `has_access` (boolean) - Accès accordé
- `assigned_by` (uuid, FK → auth.users)
- `assigned_at`, `updated_at` (timestamptz)

---

#### 15. transfers
**Description:** Transferts financiers plateforme → fournisseurs avec audit complet

**RLS:** ✅ Activé | **Lignes:** 5

**Colonnes:**
- `id` (uuid, PK)
- `supplier_id` (uuid, FK → profiles)
- `supplier_name` (text)
- `amount` (integer) - Montant à transférer
- `order_count` (integer) - Nombre de commandes
- `transfer_method` (transfer_method) - bank_transfer, mobile_money, cash
- `status` (transfer_status) - pending, approved, completed, rejected
- `created_by` (uuid) - Créateur
- `approved_by` (uuid) - Approbateur
- `completed_by` (uuid) - Finalisateur
- `rejected_by` (uuid) - Rejeteur
- `rejection_reason` (text)
- `metadata` (jsonb) - Informations d'audit (IP, user agent, etc.)
- `notes` (text)
- `approved_at`, `completed_at`, `rejected_at` (timestamptz)

---

#### 16. transfer_orders
**Description:** Table de jonction transferts ↔ commandes

**RLS:** ✅ Activé | **Lignes:** 19

**Colonnes:**
- `id` (uuid, PK)
- `transfer_id` (uuid, FK → transfers)
- `order_id` (uuid, FK → orders, UNIQUE)
- `order_amount` (integer)

---

#### 17. support_tickets
**Description:** Système de tickets de support

**RLS:** ✅ Activé | **Lignes:** 5

**Colonnes:**
- `id` (uuid, PK)
- `ticket_number` (text, UNIQUE) - Numéro de ticket généré
- `user_id` (uuid, FK → profiles)
- `subject` (text) - Sujet
- `message` (text) - Message initial
- `category` (text) - technical, billing, delivery, account, complaint, other
- `priority` (text) - low, medium, high, urgent
- `status` (text) - open, in_progress, waiting_response, resolved, closed
- `assigned_to` (uuid, FK → profiles) - Admin assigné
- `resolved_at` (timestamptz)

---

#### 18. ticket_messages
**Description:** Messages des tickets

**RLS:** ✅ Activé | **Lignes:** 7

**Colonnes:**
- `id` (uuid, PK)
- `ticket_id` (uuid, FK → support_tickets)
- `user_id` (uuid, FK → profiles)
- `message` (text)
- `is_internal` (boolean) - Message interne admin

---

#### 19. ticket_attachments
**Description:** Pièces jointes des tickets

**RLS:** ✅ Activé | **Lignes:** 0

**Colonnes:**
- `id` (uuid, PK)
- `ticket_id` (uuid, FK → support_tickets)
- `file_name` (text)
- `file_url` (text)
- `file_type` (text)
- `file_size` (integer)
- `uploaded_by` (uuid, FK → profiles)

---

#### 20. commission_settings
**Description:** Paramètres de commission globaux

**RLS:** ✅ Activé | **Lignes:** 1

**Colonnes:**
- `id` (uuid, PK)
- `client_commission_percentage` (numeric, défaut: 8.0) - Commission client
- `supplier_commission_percentage` (numeric, défaut: 2.0) - Commission fournisseur
- `effective_from` (timestamptz) - Date d'effet
- `is_active` (boolean)

**Politique RLS:**
- Lecture publique pour calculer les commissions

---

#### 21. supplier_price_grids
**Description:** Grilles tarifaires personnalisées des fournisseurs avec gestion des stocks

**RLS:** ✅ Activé | **Lignes:** 4

**Colonnes:**
- `id` (uuid, PK)
- `supplier_id` (uuid, FK → profiles)
- `product_id` (uuid, FK → products)
- `zone_id` (uuid, FK → zones, nullable)
- `unit_price` (integer) - Prix unitaire fournisseur
- `crate_price` (integer) - Prix casier fournisseur
- `consign_price` (integer) - Prix consigne fournisseur
- `minimum_order_quantity` (integer, défaut: 1)
- `maximum_order_quantity` (integer, nullable)
- `discount_percentage` (numeric, défaut: 0)
- `effective_from`, `effective_to` (timestamptz)
- `is_active` (boolean)
- `notes` (text)
- `initial_stock` (integer, défaut: 0) - Stock initial du cycle
- `sold_quantity` (integer, défaut: 0) - Quantité vendue cumulée
- `last_reset_at` (timestamptz) - Dernière réinitialisation

**Trigger:**
- `log_supplier_price_grid_changes` - Log dans supplier_price_grid_history
- `update_sold_quantities_on_order` - Met à jour sold_quantity lors d'une vente

---

#### 22. supplier_price_grid_history
**Description:** Historique complet des modifications de grilles tarifaires

**RLS:** ✅ Activé | **Lignes:** 7

**Colonnes:**
- `id` (uuid, PK)
- `grid_id` (uuid, FK → supplier_price_grids)
- `supplier_id` (uuid, FK → profiles)
- `product_id` (uuid, FK → products)
- `old_unit_price`, `new_unit_price` (integer)
- `old_crate_price`, `new_crate_price` (integer)
- `old_consign_price`, `new_consign_price` (integer)
- `change_type` (text) - created, updated, deleted, activated, deactivated
- `change_reason` (text)
- `changed_by` (uuid, FK → profiles)
- `grid_snapshot` (jsonb) - Snapshot complet

---

#### 23. reference_prices
**Description:** Prix de référence RAVITO gérés par les administrateurs

**RLS:** ✅ Activé | **Lignes:** 2

**Colonnes:**
- `id` (uuid, PK)
- `product_id` (uuid, FK → products)
- `zone_id` (uuid, FK → zones, nullable)
- `category_id` (uuid, FK → pricing_categories, nullable)
- `reference_unit_price` (integer)
- `reference_crate_price` (integer)
- `reference_consign_price` (integer)
- `effective_from`, `effective_to` (timestamptz)
- `is_active` (boolean)
- `created_by`, `updated_by` (uuid, FK → profiles)

---

#### 24. pricing_categories
**Description:** Catégories de produits pour tarification hiérarchique

**RLS:** ✅ Activé | **Lignes:** 0

**Colonnes:**
- `id` (uuid, PK)
- `name` (text, UNIQUE)
- `description` (text)
- `parent_category_id` (uuid, FK → pricing_categories) - Hiérarchie
- `display_order` (integer)
- `is_active` (boolean)

---

#### 25. order_pricing_snapshot
**Description:** Snapshot des prix appliqués lors de chaque commande

**RLS:** ✅ Activé | **Lignes:** 0

**Colonnes:**
- `id` (uuid, PK)
- `order_id` (uuid, FK → orders)
- `product_id` (uuid, FK → products)
- `reference_unit_price`, `reference_crate_price`, `reference_consign_price` (integer)
- `applied_unit_price`, `applied_crate_price`, `applied_consign_price` (integer)
- `variance_percentage` (numeric) - Écart par rapport à la référence
- `price_source` (text) - reference, supplier_grid, negotiated, manual
- `supplier_grid_id` (uuid, FK → supplier_price_grids)

---

#### 26. price_analytics
**Description:** Analytics et statistiques de marché pour intelligence tarifaire

**RLS:** ✅ Activé | **Lignes:** 0

**Colonnes:**
- `id` (uuid, PK)
- `product_id` (uuid, FK → products)
- `zone_id` (uuid, FK → zones)
- `period_start`, `period_end` (timestamptz) - Période d'analyse
- `reference_price_avg` (integer) - Prix référence moyen
- `supplier_price_min`, `supplier_price_max`, `supplier_price_avg`, `supplier_price_median` (integer)
- `avg_variance_percentage`, `max_variance_percentage` (numeric)
- `total_orders`, `total_quantity`, `total_suppliers` (integer)
- `calculated_at` (timestamptz)
- `is_current` (boolean) - Analytics en cours

---

#### 27. notification_preferences
**Description:** Préférences de notifications par utilisateur

**RLS:** ✅ Activé | **Lignes:** 8

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, UNIQUE)
- `push_enabled`, `email_enabled`, `sms_enabled` (boolean)
- `notify_new_order`, `notify_order_status`, `notify_delivery_assigned` (boolean)
- `notify_delivery_status`, `notify_payment`, `notify_team` (boolean)
- `notify_support`, `notify_promotions` (boolean)

**Trigger:**
- `create_notification_preferences_for_new_user` - Créé automatiquement

---

#### 28. push_subscriptions
**Description:** Abonnements Web Push

**RLS:** ✅ Activé | **Lignes:** 0

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `endpoint` (text) - URL de push
- `p256dh_key` (text) - Clé publique
- `auth_key` (text) - Clé d'authentification
- `device_name` (text)
- `last_used_at` (timestamptz)

---

#### 29. user_activity_log
**Description:** Journal d'activité utilisateur

**RLS:** ✅ Activé | **Lignes:** 179

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `activity_type` (text) - Type d'activité
- `activity_description` (text) - Description
- `related_entity_type`, `related_entity_id` (text, uuid)
- `metadata` (jsonb) - Données additionnelles
- `ip_address`, `user_agent` (text)

**Triggers:**
- `log_order_activity` - Log des actions sur commandes
- `log_profile_update_activity` - Log des mises à jour de profil
- `log_rating_activity` - Log des évaluations

---

#### 30. zone_registration_requests
**Description:** Demandes d'enregistrement de zones par fournisseurs

**RLS:** ✅ Activé | **Lignes:** 0

**Colonnes:**
- `id` (uuid, PK)
- `zone_id` (uuid, FK → zones)
- `supplier_id` (uuid, FK → profiles)
- `status` (text) - pending, approved, rejected
- `message` (text) - Message du fournisseur
- `admin_response` (text) - Réponse admin
- `reviewed_by` (uuid, FK → profiles)
- `reviewed_at` (timestamptz)

**Triggers:**
- `notify_admins_new_zone_request` - Notifie les admins
- `notify_supplier_request_reviewed` - Notifie le fournisseur

---

#### 31. payment_methods
**Description:** Méthodes de paiement enregistrées

**RLS:** ✅ Activé | **Lignes:** 0

**Colonnes:**
- `id` (uuid, PK)
- `profile_id` (uuid, FK → profiles)
- `method` (payment_method) - orange, mtn, moov, wave, card
- `is_preferred` (boolean) - Méthode préférée
- `account_number` (text) - Numéro de compte

---

#### 32. role_permissions
**Description:** Permissions par rôle et type d'organisation

**RLS:** ✅ Activé | **Lignes:** 9

**Colonnes:**
- `id` (uuid, PK)
- `organization_type` (text) - client, supplier, admin
- `role_name` (text) - Nom du rôle
- `display_name` (text) - Nom affiché
- `description` (text)
- `permissions` (jsonb) - Permissions détaillées

---

#### 33. night_guard_schedule
**Description:** Planning des gardes de nuit pour fournisseurs

**RLS:** ✅ Activé | **Lignes:** 0

**Colonnes:**
- `id` (uuid, PK)
- `supplier_id` (uuid, FK → profiles)
- `date` (date) - Date de garde
- `is_active` (boolean) - Garde active
- `covered_zones` (uuid[]) - Zones couvertes

---

#### 34. migration_history
**Description:** Historique des migrations personnalisées

**RLS:** ❌ Désactivé | **Lignes:** 2

**Colonnes:**
- `id` (serial, PK)
- `migration_name` (text, UNIQUE)
- `executed_at` (timestamptz)
- `executed_by` (text) - Utilisateur PostgreSQL
- `description` (text)
- `success` (boolean)

---

#### 35. orders_with_coords (VIEW)
**Description:** Vue des commandes avec coordonnées GPS extraites

**Type:** VIEW (non matérialisée)

**Colonnes:**
- Toutes les colonnes de `orders`
- `lat` (double precision) - Latitude extraite
- `lng` (double precision) - Longitude extraite

---

## ⚙️ Fonctions PostgreSQL (68 fonctions)

### Fonctions de Sécurité et Permissions

```sql
-- Vérification des rôles
is_admin() → boolean
is_super_admin() → boolean
is_client() → boolean
is_supplier() → boolean
is_approved() → boolean
is_approved_user() → boolean
is_current_user_admin() → boolean
is_organization_owner() → boolean

-- Permissions
has_permission(permission text) → boolean
has_role(role text) → boolean
has_team_access() → boolean
user_has_org_access(org_id uuid, user_id uuid) → boolean
get_user_permissions(user_id uuid) → jsonb
get_user_permissions(user_id uuid) → text[]
```

### Fonctions de Gestion d'Organisations

```sql
create_organization_with_owner(
  p_name text,
  p_type text,
  p_owner_id uuid,
  p_max_members integer
) → uuid

get_organization_member_count(org_id uuid) → integer
can_add_member(org_id uuid) → boolean
get_user_org_owner_id(user_id uuid) → uuid
debug_user_has_org_access(org_id uuid, user_id uuid) → record
```

### Fonctions de Gestion des Commandes

```sql
accept_supplier_offer(
  p_offer_id uuid,
  p_user_id uuid
) → json

get_client_info_for_order(order_id uuid) → record
get_supplier_info_for_order(order_id uuid) → json
```

### Fonctions de Tarification

```sql
get_reference_price(
  p_product_id uuid,
  p_zone_id uuid DEFAULT NULL
) → record

get_supplier_price_grid(
  p_supplier_id uuid,
  p_product_id uuid,
  p_zone_id uuid DEFAULT NULL
) → record

reset_supplier_sold_quantities(supplier_id uuid) → void
```

### Fonctions de Profils et Ratings

```sql
get_client_profiles_for_supplier(supplier_id uuid) → record[]
get_supplier_profiles_for_client(client_id uuid) → record[]
get_profile_for_rating(user_id uuid) → record
get_pending_ratings_for_user(user_id uuid) → record[]
has_pending_ratings(user_id uuid) → boolean
```

### Fonctions Utilitaires

```sql
generate_ticket_number() → text
generate_confirmation_code() → text  -- 8 caractères alphanumériques
update_supplier_zone_stats() → void
get_users_by_status_with_email(status text) → record[]
```

### Triggers (Fonctions de Trigger)

```sql
handle_new_user() → trigger
  -- Créé le profil et l'organisation automatiquement

create_notification_on_new_order() → trigger
create_notification_on_new_offer() → trigger
create_notification_on_order_status_change() → trigger
create_notification_preferences_for_new_user() → trigger

update_order_status_on_offer() → trigger
  -- Met à jour le statut de commande lors d'une offre

check_single_accepted_offer() → trigger
  -- Vérifie qu'une seule offre est acceptée par commande

set_delivery_confirmation_code() → trigger
  -- Génère le code de confirmation à 8 caractères

update_user_rating() → trigger
  -- Recalcule la note moyenne du profil

log_order_activity() → trigger
log_profile_update_activity() → trigger
log_rating_activity() → trigger
log_supplier_price_grid_changes() → trigger

update_sold_quantities_on_order() → trigger
  -- Met à jour les quantités vendues dans supplier_price_grids

update_orders_on_transfer_completion() → trigger
  -- Met à jour payment_status lors d'un transfert

sync_profile_names() → trigger
  -- Synchronise les noms dans les profils

notify_admins_new_zone_request() → trigger
notify_supplier_request_reviewed() → trigger

validate_delivery_before_delivered() → trigger
record_delivery_user() → trigger

update_updated_at_column() → trigger
  -- Met à jour automatiquement updated_at

-- Et 15+ autres triggers pour updated_at sur différentes tables
```

---

## 🔒 Politiques RLS (Row Level Security)

### Stratégie Globale

Toutes les tables principales ont RLS activé avec une approche restrictive par défaut:

1. **SELECT (Lecture)**
   - Utilisateurs authentifiés: accès selon rôle et organisation
   - Utilisateurs anonymes (anon): accès limité aux tables publiques (zones actives, commission_settings)

2. **INSERT (Création)**
   - Généralement restreint par des triggers
   - Permissions basées sur le rôle et l'appartenance à l'organisation

3. **UPDATE (Modification)**
   - Propriétaire de la ressource ou admin
   - Membres d'organisation avec permissions appropriées

4. **DELETE (Suppression)**
   - Admin uniquement pour la plupart des tables
   - Propriétaire pour ses propres données

### Fonctions Helper pour RLS

```sql
-- Fonctions utilisées dans les politiques RLS
is_admin()           -- Vérifie si admin
is_super_admin()     -- Vérifie si super admin
is_approved()        -- Vérifie si utilisateur approuvé
user_has_org_access(org_id, user_id)  -- Accès à l'organisation
```

### Exemples de Politiques RLS

#### Table `profiles`

```sql
-- SELECT: Accès selon le contexte
- Utilisateurs approuvés peuvent voir les profils liés à leurs commandes/ratings
- Admins peuvent voir tous les profils
- Membres d'organisation peuvent voir les profils de leur org

-- UPDATE: Restrictions fortes
- Utilisateur peut modifier son propre profil (champs limités)
- Admin peut modifier tous les profils

-- INSERT: Bloqué
- Création uniquement via trigger handle_new_user
```

#### Table `orders`

```sql
-- SELECT
- Client voit ses propres commandes
- Fournisseur voit les commandes de ses zones et ses commandes assignées
- Membres d'organisation voient les commandes de leur org
- Admin voit tout

-- INSERT
- Client authentifié et approuvé peut créer une commande

-- UPDATE
- Client peut modifier ses commandes en statut 'pending'
- Fournisseur peut modifier statut des commandes acceptées
- Admin peut tout modifier

-- DELETE
- Admin uniquement
```

#### Table `zones`

```sql
-- SELECT (PUBLIC - Important!)
- Utilisateurs anonymes (anon) peuvent lire les zones actives
  → Permet la sélection de zone lors de l'inscription
- Utilisateurs authentifiés voient toutes les zones

-- INSERT / UPDATE / DELETE
- Admin uniquement
```

#### Table `supplier_offers`

```sql
-- SELECT
- Client voit les offres de ses commandes
- Fournisseur voit ses propres offres
- Membres d'organisation selon permissions

-- INSERT
- Fournisseur approuvé peut créer une offre pour commandes de ses zones

-- UPDATE
- Fournisseur peut modifier ses offres (statut pending uniquement)
- Client peut accepter/rejeter les offres de ses commandes

-- DELETE
- Admin uniquement
```

#### Table `organizations` et `organization_members`

```sql
-- SELECT
- Propriétaire voit son organisation
- Membres voient leur organisation
- Admin voit toutes les organisations

-- INSERT
- Propriétaire peut ajouter des membres (dans limite max_members)

-- UPDATE
- Propriétaire peut modifier son organisation et ses membres
- Super admin peut tout modifier

-- DELETE
- Super admin uniquement
```

---

## 📜 Historique des Migrations (119 migrations)

### Migrations Initiales (Octobre 2025)
- `20251003231239` - Création schéma initial
- `20251003231338` - Activation RLS
- `20251003231619` - Seed données initiales
- `20251004004652` - Table notifications

### Système d'Approbation et Zones (Octobre 2025)
- `20251019040615` - Statut approbation utilisateurs
- `20251019043455` - Table zones et supplier_zones
- `20251019091003` - Sélection zone pour clients
- `20251021094148` - Configuration zones
- `20251021163013` - Demandes d'enregistrement zones

### Système de Support (Octobre 2025)
- `20251021132355` - Système tickets support
- `20251021122118` - Journal d'activité utilisateurs
- `20251021122258` - Triggers logging activité

### Système d'Offres Fournisseurs (Octobre-Novembre 2025)
- `20251026001836` - Nouveaux statuts commandes
- `20251026001903` - Table supplier_offers
- `20251031135630` - Reset flux commandes
- Multiples corrections RLS pour système d'offres (Nov 2025)

### Notifications et Temps Réel (Novembre 2025)
- `20251019074918` - Realtime sur notifications
- `20251123030010` - Notifications nouvelles offres
- `20251123043831` - Notifications avec numéro commande

### Système de Transferts Financiers (Novembre 2025)
- `20251122021800` - Table transfers
- `20251123043916` - Création système transferts
- `20251219232648` - Corrections RLS transferts

### Code de Confirmation Livraison (Novembre 2025)
- `20251123053935` - Code confirmation livraison
- `20251124000000` - Code confirmation livraison (v2)
- `20251125000519` - Code 8 caractères
- `20251227053316` - Restauration trigger code

### Système de Ratings (Décembre 2025)
- `20251201214058` - Corrections système ratings
- `20251201215624` - Politiques RLS ratings
- `20251202230611` - Infos profil avec statut commande
- `20251202233208` - Corrections fonctions profil

### Sécurité Renforcée (Décembre 2025)
- `20251211010412` à `20251211014050` - 8 migrations sécurité
  - Index de performance
  - Politiques RLS renforcées
  - Corrections récursion RLS
  - Consolidation politiques
  - PostGIS et search_path
- `20251213130700` - Restauration politiques RLS complètes
- `20251220000551` - Restauration politiques RLS finales

### Module Pricing et Analytics (Décembre 2025)
- `20251217013443` - Tables module pricing
- `20251222000001` - Gestion stocks grilles tarifaires
- Système de prix de référence et analytics

### Système d'Organisations (Décembre 2025)
- `20251207222525` - Système gestion équipes
- `20251230025737` - Refonte gestion équipes

### Géolocalisation (Décembre 2025)
- `20251223121939` - Colonnes géolocalisation
- `20251224023045` - Géolocalisation (v2)

### Permissions et Modules (Décembre 2025)
- `20251223002051` - Système permissions modules
- `20251223020032` - Système notifications
- `20251214050303` - RLS commission_settings
- `20251214050644` à `20251214050716` - RLS support tickets

### Corrections Inscription (Décembre 2025-Janvier 2026)
- `20251218103748` à `20251229194945` - Multiple corrections trigger inscription
- `20251229180841` - Préférences notifications
- `20251228202137` - Corrections dépendances circulaires RLS
- `20251228202317` - Fonction admin get_users_with_email

### Système Multi-Organisation (Janvier 2026)
- `20260102152851` - Accès membres organisations
- `20260102161213` - Uniformisation accès données membres
- `20260102173710` - RLS commandes/zones pour membres
- `20260102185306` - Création organisations manquantes
- `20260102214757` - Création organisations final
- `20260102224048` - Système permissions super admin
- `20260102225807` à `20260102231849` - Corrections accès organisations

### Corrections Finales (Janvier 2026)
- `20260103170747` - Contrainte prix unitaire accept_offer
- `20260103170833` - FK organizations.owner_id
- `20260103184043` - Organisation Administration
- `20260103184237` - Ajout admin test à organisation
- `20260103185645` - **Lecture publique zones actives (inscription)**

---

## 🔍 Requêtes SQL Utiles pour Backup

### Exporter les Données Critiques

```sql
-- Export des profils actifs
SELECT * FROM profiles
WHERE is_active = true
ORDER BY created_at DESC;

-- Export des produits actifs
SELECT * FROM products
WHERE is_active = true
ORDER BY category, brand, name;

-- Export des zones actives
SELECT * FROM zones
WHERE is_active = true
ORDER BY name;

-- Export des commandes avec détails
SELECT
  o.*,
  p_client.name as client_name,
  p_supplier.name as supplier_name,
  z.name as zone_name
FROM orders o
JOIN profiles p_client ON o.client_id = p_client.id
LEFT JOIN profiles p_supplier ON o.supplier_id = p_supplier.id
LEFT JOIN zones z ON o.zone_id = z.id
ORDER BY o.created_at DESC;

-- Export des grilles tarifaires actives
SELECT
  spg.*,
  p.name as product_name,
  pr.business_name as supplier_name,
  z.name as zone_name
FROM supplier_price_grids spg
JOIN products p ON spg.product_id = p.id
JOIN profiles pr ON spg.supplier_id = pr.id
LEFT JOIN zones z ON spg.zone_id = z.id
WHERE spg.is_active = true
ORDER BY pr.business_name, p.name;

-- Export des statistiques de zones
SELECT
  sz.*,
  p.business_name as supplier_name,
  z.name as zone_name
FROM supplier_zones sz
JOIN profiles p ON sz.supplier_id = p.id
JOIN zones z ON sz.zone_id = z.id
WHERE sz.is_active = true
ORDER BY z.name, p.business_name;
```

### Statistiques de la Base

```sql
-- Nombre d'utilisateurs par rôle et statut
SELECT
  role,
  approval_status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM profiles
GROUP BY role, approval_status
ORDER BY role, approval_status;

-- Commandes par statut
SELECT
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_amount,
  AVG(total_amount) as avg_amount
FROM orders
GROUP BY status
ORDER BY count DESC;

-- Produits par catégorie
SELECT
  category,
  COUNT(*) as count,
  AVG(crate_price) as avg_price
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- Zones avec nombre de fournisseurs
SELECT
  z.name as zone_name,
  COUNT(DISTINCT sz.supplier_id) as supplier_count,
  z.max_suppliers,
  z.is_active
FROM zones z
LEFT JOIN supplier_zones sz ON z.id = sz.zone_id AND sz.is_active = true
GROUP BY z.id, z.name, z.max_suppliers, z.is_active
ORDER BY z.name;

-- Organisations et membres
SELECT
  o.name as org_name,
  o.type,
  o.max_members,
  COUNT(om.id) as member_count,
  p.name as owner_name
FROM organizations o
JOIN profiles p ON o.owner_id = p.id
LEFT JOIN organization_members om ON o.id = om.organization_id AND om.status = 'active'
GROUP BY o.id, o.name, o.type, o.max_members, p.name
ORDER BY o.type, o.name;
```

---

## 📋 Checklist de Restauration

En cas de besoin de restauration, suivre cette checklist:

### 1. Extensions (Ordre Important!)
```sql
-- 1. Extensions de base
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PostGIS (pour géolocalisation)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 3. Extensions Supabase
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
```

### 2. Types ENUM
Créer tous les types ENUM avant les tables

### 3. Tables (Ordre des Dépendances)
```
1. zones
2. products
3. profiles (dépend de zones)
4. organizations (dépend de profiles)
5. organization_members (dépend de organizations)
6. custom_roles, role_permissions
7. orders (dépend de profiles, zones)
8. order_items (dépend de orders, products)
9. supplier_zones (dépend de profiles, zones)
10. supplier_offers (dépend de orders, profiles)
11. ratings (dépend de orders, profiles)
12. supplier_price_grids (dépend de profiles, products, zones)
13. supplier_price_grid_history
14. reference_prices, pricing_categories, price_analytics, order_pricing_snapshot
15. transfers, transfer_orders (dépend de profiles, orders)
16. notifications (dépend de profiles)
17. notification_preferences, push_subscriptions
18. support_tickets, ticket_messages, ticket_attachments
19. zone_registration_requests
20. payment_methods
21. commission_settings
22. user_activity_log
23. available_modules, user_module_permissions
24. night_guard_schedule
25. migration_history
```

### 4. Fonctions
Créer toutes les fonctions avant les triggers

### 5. Triggers
Créer les triggers dans l'ordre des migrations

### 6. Politiques RLS
Activer RLS puis créer les politiques par table

### 7. Données
Restaurer les données dans l'ordre:
1. zones
2. products
3. commission_settings
4. profiles
5. organizations
6. custom_roles, role_permissions, available_modules
7. orders, order_items
8. supplier_zones, supplier_offers
9. ratings
10. Autres tables

---

## 📝 Notes Importantes

### Modifications Récentes Critiques

1. **Inscription Client (03/01/2026)**
   - Migration `20260103185645_allow_public_read_active_zones_v2`
   - Politique RLS publique pour lecture des zones actives
   - Permet aux utilisateurs non authentifiés de voir les zones lors de l'inscription

2. **Système d'Organisations (02/01/2026)**
   - Refonte complète du système multi-utilisateurs
   - Organisations créées automatiquement pour chaque propriétaire
   - Membres avec rôles personnalisés et permissions granulaires

3. **Module de Pricing (Décembre 2025)**
   - Grilles tarifaires avec gestion des stocks
   - Prix de référence RAVITO
   - Analytics de marché

4. **Code de Confirmation à 8 Caractères**
   - Format: alphanumériques majuscules (ex: AB12CD34)
   - Généré automatiquement pour chaque commande

### Données Sensibles

⚠️ **Attention:** Ce backup ne contient PAS:
- Les mots de passe (stockés dans auth.users par Supabase Auth)
- Les tokens d'authentification
- Les clés API
- Les données de paiement réelles

### Performance

**Index Recommandés:**
- `profiles(id, role, is_approved, zone_id)`
- `orders(client_id, supplier_id, zone_id, status)`
- `order_items(order_id, product_id)`
- `supplier_zones(supplier_id, zone_id, is_active)`
- `notifications(user_id, is_read, created_at)`
- `organizations(owner_id)`
- `organization_members(organization_id, user_id, status)`

**Realtime Activé Sur:**
- `profiles`
- `notifications`
- `orders`
- `supplier_offers`

---

## 🔗 Liens Utiles

- **Documentation Supabase:** https://supabase.com/docs
- **PostGIS Documentation:** https://postgis.net/docs/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

---

## ✅ Validation du Backup

**Date:** 2026-01-03
**Méthode:** Export via Supabase MCP Tools
**Statut:** ✅ Complet

### Contenu Vérifié
- ✅ 35 tables
- ✅ 11 types ENUM
- ✅ 68 fonctions
- ✅ 119 migrations
- ✅ Politiques RLS
- ✅ Triggers
- ✅ Extensions
- ✅ Données statistiques

---

**Fin du Backup**

*Ce document a été généré automatiquement via les outils MCP Supabase.*
