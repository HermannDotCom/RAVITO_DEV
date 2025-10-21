/*
  # Add Zone Configuration Fields

  1. Changes
    - Add `max_suppliers` column to zones table (default: 10)
    - Add `min_coverage` column to zones table (default: 2)
    - Add `operating_hours` column to zones table (default: '18h00 - 06h00')
    
  2. Purpose
    - Allow admins to configure zone parameters
    - Store max suppliers allowed per zone
    - Store minimum coverage required per zone
    - Store operating hours for each zone
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zones' AND column_name = 'max_suppliers'
  ) THEN
    ALTER TABLE zones ADD COLUMN max_suppliers INTEGER DEFAULT 10 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zones' AND column_name = 'min_coverage'
  ) THEN
    ALTER TABLE zones ADD COLUMN min_coverage INTEGER DEFAULT 2 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zones' AND column_name = 'operating_hours'
  ) THEN
    ALTER TABLE zones ADD COLUMN operating_hours TEXT DEFAULT '18h00 - 06h00' NOT NULL;
  END IF;
END $$;