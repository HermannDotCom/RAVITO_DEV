/*
  # Fix RLS Policies for Approved Users

  1. Changes
    - Add RLS policies for products table (currently blocking all access)
    - Add policy for suppliers to view pending/available orders
    - Ensure approved users have full access to necessary resources

  2. Security
    - Products: Approved clients and suppliers can view active products
    - Orders: Suppliers can view pending orders (to accept them)
    - Admins have full access to products
*/

-- Products table policies
CREATE POLICY "Approved clients can view products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client' 
      AND profiles.is_approved = true
    )
  );

CREATE POLICY "Approved suppliers can view products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'supplier' 
      AND profiles.is_approved = true
    )
  );

CREATE POLICY "Admins can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Orders table: Add policy for suppliers to view pending orders
CREATE POLICY "Approved suppliers can view pending orders"
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
  );

-- Orders table: Allow suppliers to accept orders (update pending to accepted)
CREATE POLICY "Approved suppliers can accept pending orders"
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
  )
  WITH CHECK (
    supplier_id = auth.uid()
    AND status IN ('accepted', 'preparing', 'delivering')
  );
