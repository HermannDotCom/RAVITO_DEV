/*
  # Enable Realtime on orders and supplier_offers tables
  
  1. Changes
    - Enable realtime replication on the orders table
    - Enable realtime replication on the supplier_offers table
    - Add performance indexes for real-time queries
    
  2. Purpose
    - Required for PR #4 real-time notification system
    - Suppliers receive instant notifications when new orders arrive
    - Clients receive instant notifications when suppliers make offers
    - Improves performance of WebSocket subscriptions
*/

-- Enable realtime for the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable realtime for the supplier_offers table
ALTER PUBLICATION supabase_realtime ADD TABLE supplier_offers;

-- Add index for faster filtering by zone and status (used by supplier notifications)
CREATE INDEX IF NOT EXISTS idx_orders_zone_status 
ON orders(zone_id, status) 
WHERE status IN ('pending', 'pending-offers');

-- Add index for faster filtering by supplier (used for order updates)
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id 
ON orders(supplier_id) 
WHERE supplier_id IS NOT NULL;

-- Add index for faster filtering by client (used for client notifications)
CREATE INDEX IF NOT EXISTS idx_orders_client_id 
ON orders(client_id);

-- Add index for faster supplier zone lookups (used to check if order is in supplier's zone)
CREATE INDEX IF NOT EXISTS idx_supplier_zones_supplier_zone 
ON supplier_zones(supplier_id, zone_id) 
WHERE is_active = true;

-- Add index for faster offer lookups by order
CREATE INDEX IF NOT EXISTS idx_supplier_offers_order_id 
ON supplier_offers(order_id);

-- Add index for faster offer lookups by order and status
CREATE INDEX IF NOT EXISTS idx_supplier_offers_order_status 
ON supplier_offers(order_id, status);
