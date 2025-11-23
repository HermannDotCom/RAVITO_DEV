/*
  # Fix update_supplier_zone_stats Function - Remove delivery_zones Reference
  
  1. Changes
    - Update function to work without delivery_zones table
    - Use zone_id directly from orders table
    - Simplify the update logic
  
  2. Security
    - Maintains existing trigger behavior
    - No changes to RLS policies
*/

CREATE OR REPLACE FUNCTION update_supplier_zone_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'delivered' AND NEW.supplier_id IS NOT NULL AND NEW.zone_id IS NOT NULL THEN
    UPDATE supplier_zones sz
    SET 
      total_orders = total_orders + 1,
      last_order_date = NEW.delivered_at,
      average_delivery_time = (
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - accepted_at)) / 60), 0)
        FROM orders
        WHERE supplier_id = NEW.supplier_id
        AND zone_id = NEW.zone_id
        AND status = 'delivered'
        AND delivered_at IS NOT NULL
        AND accepted_at IS NOT NULL
      )
    WHERE sz.supplier_id = NEW.supplier_id
    AND sz.zone_id = NEW.zone_id
    AND sz.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;
