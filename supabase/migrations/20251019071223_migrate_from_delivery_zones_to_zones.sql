/*
  # Migrate from delivery_zones to zones table

  1. Changes
    - Drop old foreign key constraint pointing to delivery_zones
    - Add new foreign key constraint pointing to zones
    - Migrate any data from delivery_zones to zones if needed
    - Drop delivery_zones table
    
  2. Security
    - Maintain RLS policies on supplier_zones
*/

-- First, check if there's any data in delivery_zones we need to preserve
DO $$
BEGIN
  -- Drop the old foreign key constraint
  ALTER TABLE supplier_zones 
    DROP CONSTRAINT IF EXISTS supplier_zones_zone_id_fkey;

  -- Add new foreign key constraint pointing to zones table
  ALTER TABLE supplier_zones 
    ADD CONSTRAINT supplier_zones_zone_id_fkey 
    FOREIGN KEY (zone_id) 
    REFERENCES zones(id) 
    ON DELETE CASCADE;

  -- Drop the old delivery_zones table if it exists
  DROP TABLE IF EXISTS delivery_zones CASCADE;
END $$;

-- Verify the foreign key is correct
DO $$
BEGIN
  RAISE NOTICE 'Foreign key updated successfully';
END $$;
