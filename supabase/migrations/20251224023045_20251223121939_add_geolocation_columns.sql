-- Migration: Add geolocation columns for delivery addresses
-- Description: Adds latitude, longitude, and delivery instructions to profiles and orders tables
-- Author: RAVITO Team
-- Date: 2025-12-23

-- ============================================
-- 1. PROFILES TABLE - Default delivery address
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;

-- ============================================
-- 2. ORDERS TABLE - Order-specific address
-- ============================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
ADD COLUMN IF NOT EXISTS uses_profile_address BOOLEAN DEFAULT true;

-- ============================================
-- 3. INDEXES for geospatial queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_delivery_coordinates 
ON profiles (delivery_latitude, delivery_longitude) 
WHERE delivery_latitude IS NOT NULL AND delivery_longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_coordinates 
ON orders (delivery_latitude, delivery_longitude) 
WHERE delivery_latitude IS NOT NULL AND delivery_longitude IS NOT NULL;

-- ============================================
-- 4. COMMENTS for documentation
-- ============================================

COMMENT ON COLUMN profiles.delivery_latitude IS 'Latitude GPS de l''adresse de livraison par défaut';
COMMENT ON COLUMN profiles.delivery_longitude IS 'Longitude GPS de l''adresse de livraison par défaut';
COMMENT ON COLUMN profiles.delivery_instructions IS 'Instructions pour le livreur (repères, indications)';

COMMENT ON COLUMN orders.delivery_latitude IS 'Latitude GPS pour cette commande spécifique';
COMMENT ON COLUMN orders.delivery_longitude IS 'Longitude GPS pour cette commande spécifique';
COMMENT ON COLUMN orders.delivery_instructions IS 'Instructions livreur pour cette commande';
COMMENT ON COLUMN orders.uses_profile_address IS 'true = utilise adresse profil, false = adresse personnalisée pour cette commande';
