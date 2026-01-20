-- Migration: Add depot geolocation columns for suppliers
-- Description: Adds latitude, longitude, and access instructions for supplier depot address
-- Author: RAVITO Team
-- Date: 2026-01-20

-- ============================================
-- 1. PROFILES TABLE - Depot geolocation for suppliers
-- ============================================

-- Add depot geolocation columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS depot_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS depot_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS depot_address TEXT,
ADD COLUMN IF NOT EXISTS access_instructions TEXT;

-- ============================================
-- 2. INDEXES for geospatial queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_depot_coordinates 
ON profiles (depot_latitude, depot_longitude) 
WHERE depot_latitude IS NOT NULL AND depot_longitude IS NOT NULL;

-- ============================================
-- 3. COMMENTS for documentation
-- ============================================

COMMENT ON COLUMN profiles.depot_latitude IS 'Latitude GPS de l''adresse du dépôt (fournisseurs)';
COMMENT ON COLUMN profiles.depot_longitude IS 'Longitude GPS de l''adresse du dépôt (fournisseurs)';
COMMENT ON COLUMN profiles.depot_address IS 'Adresse complète du dépôt (fournisseurs)';
COMMENT ON COLUMN profiles.access_instructions IS 'Indications d''accès au dépôt (fournisseurs)';
