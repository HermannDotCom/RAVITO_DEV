/*
  # Fix supplier_offers INSERT policy

  1. Changes
    - Drop existing INSERT policy for supplier_offers
    - Create new INSERT policy with corrected logic
    - Use explicit column references instead of table references in WITH CHECK

  2. Security
    - Suppliers can only create offers for orders in their zones
    - Suppliers must be approved
    - Orders must be in 'pending-offers' status
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Suppliers can create offers for zone orders" ON supplier_offers;

-- Create new policy with explicit column references
CREATE POLICY "Suppliers can create offers for zone orders"
  ON supplier_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be an approved supplier
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'supplier'
        AND profiles.is_approved = true
    )
    -- Supplier ID must match authenticated user
    AND supplier_id = auth.uid()
    -- Order must exist, be in pending-offers status, and be in supplier's zone
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
        AND orders.status = 'pending-offers'
        AND EXISTS (
          SELECT 1 FROM supplier_zones sz
          WHERE sz.zone_id = orders.zone_id
            AND sz.supplier_id = auth.uid()
        )
    )
  );