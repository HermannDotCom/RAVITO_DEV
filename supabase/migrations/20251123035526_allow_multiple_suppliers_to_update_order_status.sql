/*
  # Allow Multiple Suppliers to Update Order Status
  
  1. Changes
    - Update RLS policy to allow suppliers to update order status from both 'pending-offers' and 'offers-received'
    - This allows multiple suppliers to submit offers even after the first offer is submitted
    - Once an offer is accepted, the order won't have these statuses anymore, preventing further offers
  
  2. Security
    - Only approved suppliers in the order's zone can update
    - Can only update to 'offers-received' status
*/

DROP POLICY IF EXISTS "Suppliers can update status when submitting offers" ON orders;

CREATE POLICY "Suppliers can update status when submitting offers"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    status IN ('pending-offers', 'offers-received')
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
    status = 'offers-received'
  );
