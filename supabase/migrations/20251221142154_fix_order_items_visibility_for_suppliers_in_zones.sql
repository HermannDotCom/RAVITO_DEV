/*
  # Fix Order Items Visibility for Suppliers in Zones

  1. Problem:
    - Suppliers can see pending orders in their zones (via orders_select_supplier_zone)
    - BUT they cannot see the order_items because order_items_select_supplier only checks:
      a) supplier_id = auth.uid() (NULL for pending orders)
      b) supplier has made an offer
    - Missing: check if order is pending in supplier's approved zone
  
  2. Solution:
    - Add a new policy for suppliers to see order_items of pending orders in their zones
  
  3. Changes:
    - Create order_items_select_supplier_zone policy
*/

-- Drop if exists
DROP POLICY IF EXISTS "order_items_select_supplier_zone" ON order_items;

-- Suppliers can see order items of pending orders in their approved zones
CREATE POLICY "order_items_select_supplier_zone"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM orders o
      INNER JOIN supplier_zones sz ON sz.zone_id = o.zone_id
      WHERE o.id = order_items.order_id
      AND o.status IN ('pending-offers', 'offers-received')
      AND o.zone_id IS NOT NULL
      AND sz.supplier_id = auth.uid()
      AND sz.approval_status = 'approved'
      AND sz.is_active = true
    )
  );
