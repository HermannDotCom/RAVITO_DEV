/*
  # Add image_path column to products table
  
  ## Purpose
  Add support for storing product images in Supabase Storage.
  The image_path column will store the path to the image in the storage bucket.
  
  ## Changes
  1. Add image_path TEXT column to products table
  2. Add comment to document the column purpose
*/

-- Add image_path column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Add comment to document the column
COMMENT ON COLUMN products.image_path IS 'Chemin vers l''image stockée dans Supabase Storage (bucket: product-images)';
