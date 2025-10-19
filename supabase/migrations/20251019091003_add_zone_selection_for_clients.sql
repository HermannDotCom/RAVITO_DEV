/*
  # Add Zone Selection for Clients and Order Assignment

  1. Changes
    - Add zone_id to profiles table (for clients to select their delivery zone/commune)
    - Add zone_id to orders table (to track which zone an order belongs to)
    - Update RLS policies to filter orders by zone for suppliers
    - Add indexes for performance

  2. Security
    - Clients must select their zone during registration
    - Orders are automatically assigned the client's zone
    - Suppliers only see orders in their registered zones
*/

-- Add zone_id to profiles table (nullable for existing users, but should be required for new clients)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'zone_id'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN zone_id uuid REFERENCES zones(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_zone_id ON profiles(zone_id);
  END IF;
END $$;

-- Add zone_id to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'zone_id'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN zone_id uuid REFERENCES zones(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_orders_zone_id ON orders(zone_id);
  END IF;
END $$;

-- Drop old policies that don't consider zones
DROP POLICY IF EXISTS "Approved suppliers can view pending orders" ON orders;
DROP POLICY IF EXISTS "Approved suppliers can accept pending orders" ON orders;

-- New policy: Suppliers can only see pending orders in zones they cover
CREATE POLICY "Approved suppliers can view pending orders in their zones"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    status = 'pending' 
    AND supplier_id IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'supplier'
      AND profiles.is_approved = true
    )
    AND EXISTS (
      SELECT 1 FROM supplier_zones
      WHERE supplier_zones.supplier_id = auth.uid()
      AND supplier_zones.zone_id = orders.zone_id
      AND supplier_zones.approval_status = 'approved'
      AND supplier_zones.is_active = true
    )
  );

-- New policy: Suppliers can accept pending orders in zones they cover
CREATE POLICY "Approved suppliers can accept pending orders in their zones"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    status = 'pending' 
    AND supplier_id IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'supplier'
      AND profiles.is_approved = true
    )
    AND EXISTS (
      SELECT 1 FROM supplier_zones
      WHERE supplier_zones.supplier_id = auth.uid()
      AND supplier_zones.zone_id = orders.zone_id
      AND supplier_zones.approval_status = 'approved'
      AND supplier_zones.is_active = true
    )
  )
  WITH CHECK (
    supplier_id = auth.uid()
    AND status IN ('accepted', 'preparing', 'delivering')
  );

-- Add comment for documentation
COMMENT ON COLUMN profiles.zone_id IS 'The delivery zone (commune) for clients. Used to match orders with suppliers covering this zone.';
COMMENT ON COLUMN orders.zone_id IS 'The delivery zone for this order. Automatically set from client profile. Determines which suppliers can see and accept the order.';
