/*
  # Fix Supplier Offers Insert Policy - Add Zone Approval Check
  
  1. Changes
    - Update the INSERT policy for supplier_offers to check zone approval status
    - Ensure suppliers can only create offers if they are approved in the zone
    - This prevents unapproved suppliers from submitting offers
  
  2. Security
    - Supplier must be approved
    - Supplier must have an approved zone registration (approval_status = 'approved')
    - Order must be in 'pending-offers' or 'offers-received' status
*/

DROP POLICY IF EXISTS "Suppliers can create offers for zone orders" ON supplier_offers;

CREATE POLICY "Suppliers can create offers for zone orders"
  ON supplier_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
      AND profiles.is_approved = true
    )
    AND supplier_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = supplier_offers.order_id
      AND orders.status IN ('pending-offers', 'offers-received')
      AND EXISTS (
        SELECT 1 FROM supplier_zones sz
        WHERE sz.zone_id = orders.zone_id
        AND sz.supplier_id = auth.uid()
        AND sz.approval_status = 'approved'
        AND sz.is_active = true
      )
    )
  );
