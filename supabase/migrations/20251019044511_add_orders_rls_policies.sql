/*
  # Add RLS Policies for Orders Table

  1. Security Policies
    - Clients can view their own orders
    - Suppliers can view orders assigned to them
    - Admins can view all orders
    - Clients can create orders
    - Suppliers can update order status
    - Admins can manage all orders
*/

-- Clients can view their own orders
CREATE POLICY "Clients can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

-- Suppliers can view orders assigned to them
CREATE POLICY "Suppliers can view assigned orders"
  ON orders FOR SELECT
  TO authenticated
  USING (supplier_id = auth.uid());

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Clients can create orders
CREATE POLICY "Clients can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'client'
    )
  );

-- Clients can update their pending orders
CREATE POLICY "Clients can update own pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid()
    AND status = 'pending'
  );

-- Suppliers can update assigned orders
CREATE POLICY "Suppliers can update assigned orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
    )
  );

-- Admins can manage all orders
CREATE POLICY "Admins can manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
