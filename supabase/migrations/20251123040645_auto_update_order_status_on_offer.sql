/*
  # Auto-update Order Status When Offer is Submitted
  
  1. Changes
    - Create a trigger function that automatically updates order status from 'pending-offers' to 'offers-received'
    - Trigger fires after a new supplier offer is inserted
    - This bypasses RLS since it runs with elevated privileges
  
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only updates orders that are in 'pending-offers' status
    - Safe and automated status transition
*/

-- Create function to update order status when offer is inserted
CREATE OR REPLACE FUNCTION update_order_status_on_offer()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update order status from pending-offers to offers-received
  UPDATE orders
  SET status = 'offers-received'
  WHERE id = NEW.order_id
  AND status = 'pending-offers';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_order_status_on_offer ON supplier_offers;

-- Create trigger on supplier_offers INSERT
CREATE TRIGGER trigger_update_order_status_on_offer
  AFTER INSERT ON supplier_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_offer();
