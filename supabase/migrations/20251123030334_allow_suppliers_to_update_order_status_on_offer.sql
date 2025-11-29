/*
  # Allow suppliers to update order status when submitting offers
  
  When a supplier submits an offer, they need to update the order status from
  'pending-offers' to 'offers-received'. This migration adds the necessary RLS policy.
  
  Changes:
  - Add policy allowing suppliers to update order status when they have an active offer
  - Only allows changing status from 'pending-offers' to 'offers-received'
  - Supplier must be in the order's zone
*/

-- Drop the policy if it exists
DROP POLICY IF EXISTS "Suppliers can update status when submitting offers" ON orders;

-- Create the new policy
CREATE POLICY "Suppliers can update status when submitting offers"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    -- Order must be in pending-offers status
    status = 'pending-offers'
    -- User must be an approved supplier
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
      AND profiles.is_approved = true
    )
    -- Supplier must be in the order's zone
    AND EXISTS (
      SELECT 1 FROM supplier_zones
      WHERE supplier_zones.supplier_id = auth.uid()
      AND supplier_zones.zone_id = orders.zone_id
      AND supplier_zones.approval_status = 'approved'
      AND supplier_zones.is_active = true
    )
  )
  WITH CHECK (
    -- Can only change status to offers-received
    status = 'offers-received'
  );
