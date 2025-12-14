/*
  # Add RLS policies for commission_settings table

  1. Changes
    - Add SELECT policy for all authenticated users to read commission settings
    - Add UPDATE policy for admin users to modify commission settings
    - Add INSERT policy for admin users to create new commission settings

  2. Security
    - Authenticated users can read active commission settings
    - Only admin users can modify or create commission settings
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read commission settings" ON commission_settings;
DROP POLICY IF EXISTS "Allow admin to update commission settings" ON commission_settings;
DROP POLICY IF EXISTS "Allow admin to insert commission settings" ON commission_settings;

-- Allow all authenticated users to read active commission settings
CREATE POLICY "Allow authenticated users to read commission settings"
  ON commission_settings
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow admin users to update commission settings
CREATE POLICY "Allow admin to update commission settings"
  ON commission_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admin users to insert new commission settings
CREATE POLICY "Allow admin to insert commission settings"
  ON commission_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
