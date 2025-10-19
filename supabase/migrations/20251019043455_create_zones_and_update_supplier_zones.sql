/*
  # Create Zones System with Approval Workflow

  1. New Tables
    - `zones` - List of delivery zones in Abidjan
      - `id` (uuid, primary key)
      - `name` (text) - Zone name (e.g., "Plateau", "Cocody")
      - `description` (text) - Zone description
      - `is_active` (boolean) - Whether zone is active
      - `created_at` (timestamptz)
      
  2. Changes to supplier_zones
    - Add `approval_status` column (pending, approved, rejected)
    - Add `requested_at` (timestamptz)
    - Add `approved_at` (timestamptz)
    - Add `approved_by` (uuid) - Admin who approved
    - Add `rejection_reason` (text)
    
  3. Security
    - Enable RLS on zones table
    - Enable RLS on supplier_zones table
    - Suppliers can request zone access
    - Only admins can approve/reject requests
*/

-- Create zones table
CREATE TABLE IF NOT EXISTS zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add approval workflow columns to supplier_zones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_zones' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE supplier_zones 
    ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_zones' AND column_name = 'requested_at'
  ) THEN
    ALTER TABLE supplier_zones ADD COLUMN requested_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_zones' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE supplier_zones ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_zones' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE supplier_zones ADD COLUMN approved_by uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'supplier_zones' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE supplier_zones ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Insert default zones for Abidjan
INSERT INTO zones (name, description) VALUES
  ('Plateau', 'Centre administratif et commercial d''Abidjan'),
  ('Cocody', 'Quartier résidentiel huppé avec ambassades'),
  ('Marcory', 'Zone résidentielle et commerciale'),
  ('Treichville', 'Zone portuaire et commerciale'),
  ('Adjamé', 'Grand marché et centre commercial'),
  ('Yopougon', 'Commune populaire de l''ouest'),
  ('Abobo', 'Grande commune du nord'),
  ('Koumassi', 'Zone industrielle et résidentielle'),
  ('Port-Bouët', 'Zone aéroportuaire'),
  ('Attecoubé', 'Zone résidentielle')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on zones
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Zones policies: Everyone can read active zones
CREATE POLICY "Anyone can view active zones"
  ON zones FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can manage zones
CREATE POLICY "Only admins can manage zones"
  ON zones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Supplier zones policies
-- Suppliers can view their own zone requests
CREATE POLICY "Suppliers can view own zone requests"
  ON supplier_zones FOR SELECT
  TO authenticated
  USING (supplier_id = auth.uid());

-- Suppliers can request new zones
CREATE POLICY "Suppliers can request zones"
  ON supplier_zones FOR INSERT
  TO authenticated
  WITH CHECK (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
    )
  );

-- Admins can view all zone requests
CREATE POLICY "Admins can view all zone requests"
  ON supplier_zones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can approve/reject zone requests
CREATE POLICY "Admins can manage zone requests"
  ON supplier_zones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_zones_approval ON supplier_zones(approval_status);
CREATE INDEX IF NOT EXISTS idx_supplier_zones_supplier ON supplier_zones(supplier_id);
CREATE INDEX IF NOT EXISTS idx_zones_active ON zones(is_active);
