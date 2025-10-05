/*
  # Schéma Initial DISTRI-NIGHT

  ## Vue d'ensemble
  Ce schéma crée l'infrastructure complète pour la plateforme de distribution nocturne de boissons.
  Il gère les utilisateurs multi-rôles (admin, client, fournisseur), les produits, les commandes,
  les évaluations, les zones de livraison et la trésorerie.

  ## 1. Tables Principales

  ### `profiles`
  Extension du système auth.users de Supabase
  - `id` (uuid, FK vers auth.users) - Identifiant utilisateur
  - `role` (enum) - Rôle : admin, client, supplier
  - `name` (text) - Nom complet
  - `phone` (text) - Téléphone
  - `address` (text) - Adresse complète
  - `coordinates` (point) - Coordonnées GPS (PostGIS)
  - `business_name` (text, nullable) - Nom commercial
  - `business_hours` (text, nullable) - Horaires d'ouverture
  - `responsible_person` (text, nullable) - Personne responsable (clients)
  - `coverage_zone` (text, nullable) - Zone de couverture (fournisseurs)
  - `delivery_capacity` (text, nullable) - Capacité livraison (truck/tricycle/motorcycle)
  - `rating` (numeric) - Note moyenne (0-5)
  - `total_orders` (integer) - Nombre total de commandes
  - `is_active` (boolean) - Compte actif
  - `is_approved` (boolean) - Compte approuvé
  - `approval_status` (enum) - Statut : pending, approved, rejected
  - `approved_at` (timestamptz) - Date d'approbation
  - `rejected_at` (timestamptz) - Date de rejet
  - `rejection_reason` (text) - Raison du rejet
  - Timestamps : created_at, updated_at

  ### `products`
  Catalogue de produits (bières, sodas, vins, eaux, spiritueux)
  - `id` (uuid, PK)
  - `reference` (text, unique) - Référence produit
  - `name` (text) - Nom du produit
  - `category` (enum) - Catégorie
  - `brand` (text) - Marque
  - `crate_type` (enum) - Type de casier (C24, C12, C12V, C6)
  - `unit_price` (integer) - Prix unitaire en FCFA
  - `crate_price` (integer) - Prix du casier en FCFA
  - `consign_price` (integer) - Prix de la consigne en FCFA
  - `description` (text) - Description
  - `alcohol_content` (numeric) - Degré d'alcool (%)
  - `volume` (text) - Volume (33cl, 66cl, etc.)
  - `is_active` (boolean) - Produit actif
  - `image_url` (text) - URL de l'image
  - Timestamps : created_at, updated_at

  ### `orders`
  Commandes clients
  - `id` (uuid, PK)
  - `client_id` (uuid, FK profiles) - Client
  - `supplier_id` (uuid, FK profiles, nullable) - Fournisseur assigné
  - `status` (enum) - Statut de la commande
  - `total_amount` (integer) - Montant total en FCFA
  - `consigne_total` (integer) - Total consignes en FCFA
  - `client_commission` (integer) - Commission client (8%)
  - `supplier_commission` (integer) - Commission fournisseur (2%)
  - `net_supplier_amount` (integer) - Montant net fournisseur
  - `delivery_address` (text) - Adresse de livraison
  - `coordinates` (point) - Coordonnées GPS livraison
  - `payment_method` (enum) - Méthode de paiement
  - `payment_status` (enum) - Statut paiement
  - `estimated_delivery_time` (integer) - Temps estimé en minutes
  - `accepted_at` (timestamptz) - Date d'acceptation
  - `delivered_at` (timestamptz) - Date de livraison
  - `paid_at` (timestamptz) - Date de paiement
  - `transferred_at` (timestamptz) - Date de transfert au fournisseur
  - Timestamps : created_at, updated_at

  ### `order_items`
  Détails des articles commandés
  - `id` (uuid, PK)
  - `order_id` (uuid, FK orders) - Commande
  - `product_id` (uuid, FK products) - Produit
  - `quantity` (integer) - Quantité
  - `with_consigne` (boolean) - Avec consigne
  - `unit_price` (integer) - Prix unitaire au moment de la commande
  - `crate_price` (integer) - Prix casier au moment de la commande
  - `consign_price` (integer) - Prix consigne au moment de la commande
  - `subtotal` (integer) - Sous-total ligne

  ### `ratings`
  Évaluations mutuelles client/fournisseur
  - `id` (uuid, PK)
  - `order_id` (uuid, FK orders) - Commande évaluée
  - `from_user_id` (uuid, FK profiles) - Évaluateur
  - `to_user_id` (uuid, FK profiles) - Évalué
  - `from_user_role` (enum) - Rôle évaluateur
  - `to_user_role` (enum) - Rôle évalué
  - `punctuality` (integer) - Note ponctualité (1-5)
  - `quality` (integer) - Note qualité (1-5)
  - `communication` (integer) - Note communication (1-5)
  - `overall` (numeric) - Note globale (1-5)
  - `comment` (text) - Commentaire
  - Timestamp : created_at

  ### `delivery_zones`
  Zones de livraison (communes d'Abidjan)
  - `id` (uuid, PK)
  - `commune_name` (text, unique) - Nom de la commune
  - `is_active` (boolean) - Zone active
  - `max_suppliers` (integer) - Nombre max de fournisseurs
  - `minimum_coverage` (integer) - Couverture minimum requise
  - `operating_hours` (text) - Horaires d'opération
  - Timestamps : created_at, updated_at

  ### `supplier_zones`
  Association fournisseurs/zones avec métriques
  - `id` (uuid, PK)
  - `supplier_id` (uuid, FK profiles) - Fournisseur
  - `zone_id` (uuid, FK delivery_zones) - Zone
  - `is_active` (boolean) - Attribution active
  - `registered_at` (timestamptz) - Date d'inscription
  - `approved_at` (timestamptz) - Date d'approbation
  - `deactivated_at` (timestamptz) - Date de désactivation
  - `deactivation_reason` (text) - Raison désactivation
  - `reactivated_at` (timestamptz) - Date de réactivation
  - `total_orders` (integer) - Total commandes dans cette zone
  - `success_rate` (numeric) - Taux de succès (%)
  - `average_delivery_time` (integer) - Temps moyen en minutes
  - `last_order_date` (timestamptz) - Date dernière commande
  - `max_delivery_radius` (integer) - Rayon max en km
  - `minimum_order_amount` (integer) - Montant minimum en FCFA
  - `delivery_fee` (integer) - Frais de livraison en FCFA
  - Timestamps : created_at, updated_at

  ### `payment_methods`
  Méthodes de paiement acceptées par profil
  - `id` (uuid, PK)
  - `profile_id` (uuid, FK profiles) - Utilisateur
  - `method` (enum) - Méthode (orange, mtn, moov, wave, card)
  - `is_preferred` (boolean) - Méthode préférée
  - `account_number` (text) - Numéro de compte
  - Timestamps : created_at, updated_at

  ### `commission_settings`
  Configuration des commissions (admin)
  - `id` (uuid, PK)
  - `client_commission_percentage` (numeric) - Commission client (%)
  - `supplier_commission_percentage` (numeric) - Commission fournisseur (%)
  - `effective_from` (timestamptz) - Date d'effet
  - `is_active` (boolean) - Configuration active
  - Timestamps : created_at, updated_at

  ## 2. Security (RLS)
  - Toutes les tables ont RLS activé
  - Policies restrictives par défaut
  - Accès basé sur auth.uid() et les rôles

  ## 3. Indexes
  - Indexes sur les FK pour performance
  - Indexes sur les champs fréquemment filtrés (status, role, etc.)
  - Index spatial sur coordinates (PostGIS)

  ## 4. Triggers
  - updated_at automatique sur toutes les tables
  - Calcul automatique des notes moyennes
  - Mise à jour des statistiques zones

  ## 5. Extensions
  - postgis pour géolocalisation
  - uuid-ossp pour génération UUID
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Types énumérés
CREATE TYPE user_role AS ENUM ('admin', 'client', 'supplier');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE product_category AS ENUM ('biere', 'soda', 'vin', 'eau', 'spiritueux');
CREATE TYPE crate_type AS ENUM ('C24', 'C12', 'C12V', 'C6');
CREATE TYPE payment_method AS ENUM ('orange', 'mtn', 'moov', 'wave', 'card');
CREATE TYPE order_status AS ENUM ('pending', 'awaiting-client-validation', 'accepted', 'preparing', 'delivering', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'transferred', 'completed');
CREATE TYPE delivery_capacity AS ENUM ('truck', 'tricycle', 'motorcycle');

-- Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  coordinates geography(POINT, 4326),
  business_name text,
  business_hours text,
  responsible_person text,
  coverage_zone text,
  delivery_capacity delivery_capacity,
  rating numeric(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_orders integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_approved boolean DEFAULT false,
  approval_status approval_status DEFAULT 'pending',
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference text UNIQUE NOT NULL,
  name text NOT NULL,
  category product_category NOT NULL,
  brand text NOT NULL,
  crate_type crate_type NOT NULL,
  unit_price integer NOT NULL CHECK (unit_price > 0),
  crate_price integer NOT NULL CHECK (crate_price > 0),
  consign_price integer NOT NULL CHECK (consign_price >= 0),
  description text,
  alcohol_content numeric(4, 2) CHECK (alcohol_content >= 0 AND alcohol_content <= 100),
  volume text NOT NULL,
  is_active boolean DEFAULT true,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  supplier_id uuid REFERENCES profiles(id) ON DELETE RESTRICT,
  status order_status DEFAULT 'pending' NOT NULL,
  total_amount integer NOT NULL CHECK (total_amount > 0),
  consigne_total integer DEFAULT 0 CHECK (consigne_total >= 0),
  client_commission integer DEFAULT 0 CHECK (client_commission >= 0),
  supplier_commission integer DEFAULT 0 CHECK (supplier_commission >= 0),
  net_supplier_amount integer DEFAULT 0 CHECK (net_supplier_amount >= 0),
  delivery_address text NOT NULL,
  coordinates geography(POINT, 4326) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  estimated_delivery_time integer,
  accepted_at timestamptz,
  delivered_at timestamptz,
  paid_at timestamptz,
  transferred_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: order_items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  with_consigne boolean DEFAULT false,
  unit_price integer NOT NULL CHECK (unit_price > 0),
  crate_price integer NOT NULL CHECK (crate_price > 0),
  consign_price integer NOT NULL CHECK (consign_price >= 0),
  subtotal integer NOT NULL CHECK (subtotal > 0),
  created_at timestamptz DEFAULT now()
);

-- Table: ratings
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_user_role user_role NOT NULL,
  to_user_role user_role NOT NULL,
  punctuality integer NOT NULL CHECK (punctuality >= 1 AND punctuality <= 5),
  quality integer NOT NULL CHECK (quality >= 1 AND quality <= 5),
  communication integer NOT NULL CHECK (communication >= 1 AND communication <= 5),
  overall numeric(3, 2) NOT NULL CHECK (overall >= 1 AND overall <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_rating_per_order_and_user UNIQUE (order_id, from_user_id)
);

-- Table: delivery_zones
CREATE TABLE IF NOT EXISTS delivery_zones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  commune_name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  max_suppliers integer DEFAULT 10 CHECK (max_suppliers > 0),
  minimum_coverage integer DEFAULT 1,
  operating_hours text DEFAULT '18:00-06:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: supplier_zones
CREATE TABLE IF NOT EXISTS supplier_zones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  registered_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  deactivated_at timestamptz,
  deactivation_reason text,
  reactivated_at timestamptz,
  total_orders integer DEFAULT 0,
  success_rate numeric(5, 2) DEFAULT 100.0 CHECK (success_rate >= 0 AND success_rate <= 100),
  average_delivery_time integer DEFAULT 0,
  last_order_date timestamptz,
  max_delivery_radius integer DEFAULT 10 CHECK (max_delivery_radius > 0),
  minimum_order_amount integer DEFAULT 5000 CHECK (minimum_order_amount >= 0),
  delivery_fee integer DEFAULT 0 CHECK (delivery_fee >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_supplier_zone UNIQUE (supplier_id, zone_id)
);

-- Table: payment_methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  method payment_method NOT NULL,
  is_preferred boolean DEFAULT false,
  account_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_profile_method UNIQUE (profile_id, method)
);

-- Table: commission_settings
CREATE TABLE IF NOT EXISTS commission_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_commission_percentage numeric(5, 2) NOT NULL DEFAULT 8.0 CHECK (client_commission_percentage >= 0 AND client_commission_percentage <= 100),
  supplier_commission_percentage numeric(5, 2) NOT NULL DEFAULT 2.0 CHECK (supplier_commission_percentage >= 0 AND supplier_commission_percentage <= 100),
  effective_from timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_approved ON profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_profiles_coordinates ON profiles USING GIST(coordinates);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_coordinates ON orders USING GIST(coordinates);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_ratings_order_id ON ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_ratings_from_user_id ON ratings(from_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user_id ON ratings(to_user_id);

CREATE INDEX IF NOT EXISTS idx_supplier_zones_supplier_id ON supplier_zones(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_zones_zone_id ON supplier_zones(zone_id);
CREATE INDEX IF NOT EXISTS idx_supplier_zones_is_active ON supplier_zones(is_active);

CREATE INDEX IF NOT EXISTS idx_payment_methods_profile_id ON payment_methods(profile_id);

-- Fonction: mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_zones_updated_at BEFORE UPDATE ON supplier_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_settings_updated_at BEFORE UPDATE ON commission_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction: mise à jour automatique de la note moyenne d'un utilisateur
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET rating = (
    SELECT COALESCE(AVG(overall), 5.0)
    FROM ratings
    WHERE to_user_id = NEW.to_user_id
  )
  WHERE id = NEW.to_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique des notes
CREATE TRIGGER update_user_rating_on_new_rating
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

-- Fonction: mise à jour des statistiques de zone
CREATE OR REPLACE FUNCTION update_supplier_zone_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND NEW.supplier_id IS NOT NULL THEN
    UPDATE supplier_zones sz
    SET 
      total_orders = total_orders + 1,
      last_order_date = NEW.delivered_at,
      average_delivery_time = (
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - accepted_at)) / 60), 0)
        FROM orders
        WHERE supplier_id = NEW.supplier_id
          AND status = 'delivered'
          AND delivered_at IS NOT NULL
          AND accepted_at IS NOT NULL
      )
    FROM delivery_zones dz
    WHERE sz.supplier_id = NEW.supplier_id
      AND sz.zone_id = dz.id
      AND sz.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour statistiques
CREATE TRIGGER update_supplier_zone_stats_on_delivery
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION update_supplier_zone_stats();

-- Insérer la configuration de commissions par défaut
INSERT INTO commission_settings (
  client_commission_percentage,
  supplier_commission_percentage,
  is_active
) VALUES (8.0, 2.0, true)
ON CONFLICT DO NOTHING;
