/*
  # Add Storefront Columns to Profiles
  
  ## Description
  Ajoute les colonnes pour les photos de devanture et le tracking des commerciaux
  
  ## Changes
  - `registered_by_sales_rep_id` - Référence vers le commercial qui a inscrit le profil
  - `storefront_image_url` - URL de la photo de la devanture/dépôt
  
  ## Purpose
  - Tracker qui a inscrit chaque CHR/dépôt (phase pré-lancement)
  - Stocker la photo de devanture pour faciliter les livraisons
*/

-- Add registered_by_sales_rep_id column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS registered_by_sales_rep_id UUID REFERENCES sales_representatives(id) ON DELETE SET NULL;

-- Add storefront_image_url column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS storefront_image_url TEXT;

-- Create index for stats by sales rep
CREATE INDEX IF NOT EXISTS idx_profiles_sales_rep ON profiles(registered_by_sales_rep_id);

-- Comments
COMMENT ON COLUMN profiles.registered_by_sales_rep_id IS 'Commercial qui a inscrit ce profil (optionnel)';
COMMENT ON COLUMN profiles.storefront_image_url IS 'URL de la photo de la devanture ou du dépôt';
