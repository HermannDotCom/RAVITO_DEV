/*
  # Create automatic notification triggers for real-time system
  
  1. Changes
    - Add function to automatically create notifications for new orders
    - Add trigger on orders table for new order notifications
    - Add function to automatically create notifications for new offers
    - Add trigger on supplier_offers table for new offer notifications
    - Add function to notify clients on order status changes
    - Add trigger for order status change notifications
    
  2. Purpose
    - Automate notification creation in the database
    - Ensure notifications are stored even if WebSocket connection fails
    - Provide fallback notification mechanism
    - Complement the WebSocket real-time notifications from PR #4
    
  3. Notes
    - This is OPTIONAL - PR #4 works via WebSocket subscriptions
    - Database notifications provide redundancy
    - Users can view missed notifications in notification center
*/

-- ============================================================================
-- Function: Create notification when new order is created
-- ============================================================================
CREATE OR REPLACE FUNCTION create_notification_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for pending orders
  IF NEW.status = 'pending' THEN
    -- Create notifications for all active suppliers in the zone
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      sz.supplier_id,
      'new_order',
      '🔔 Nouvelle Commande !',
      'Une nouvelle commande est disponible dans votre zone',
      jsonb_build_object(
        'orderNumber', NEW.order_number,
        'orderId', NEW.id,
        'clientName', COALESCE((SELECT name FROM profiles WHERE id = NEW.client_id), 'Client'),
        'amount', NEW.total_amount,
        'zoneId', NEW.zone_id
      )
    FROM supplier_zones sz
    WHERE sz.zone_id = NEW.zone_id 
      AND sz.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new order notifications
DROP TRIGGER IF EXISTS trigger_notify_suppliers_new_order ON orders;
CREATE TRIGGER trigger_notify_suppliers_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_new_order();

-- ============================================================================
-- Function: Create notification when supplier makes an offer
-- ============================================================================
CREATE OR REPLACE FUNCTION create_notification_on_new_offer()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_supplier_name TEXT;
  v_order_number TEXT;
BEGIN
  -- Get the client ID and order number
  SELECT o.client_id, o.order_number INTO v_client_id, v_order_number
  FROM orders o
  WHERE o.id = NEW.order_id;
  
  -- Get the supplier name
  SELECT COALESCE(p.business_name, p.name) INTO v_supplier_name
  FROM profiles p
  WHERE p.id = NEW.supplier_id;
  
  -- Create notification for the client
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    v_client_id,
    'new_offer',
    '📦 Nouvelle Offre Reçue !',
    v_supplier_name || ' a fait une offre pour votre commande',
    jsonb_build_object(
      'orderNumber', v_order_number,
      'orderId', NEW.order_id,
      'supplierName', v_supplier_name,
      'offerId', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new offer notifications
DROP TRIGGER IF EXISTS trigger_notify_client_new_offer ON supplier_offers;
CREATE TRIGGER trigger_notify_client_new_offer
  AFTER INSERT ON supplier_offers
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_new_offer();

-- ============================================================================
-- Function: Create notification when order status changes
-- ============================================================================
CREATE OR REPLACE FUNCTION create_notification_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_status_label TEXT;
  v_emoji TEXT;
  v_supplier_name TEXT;
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Get status label and emoji
    CASE NEW.status
      WHEN 'accepted' THEN
        v_status_label := 'Acceptée';
        v_emoji := '✅';
      WHEN 'preparing' THEN
        v_status_label := 'En préparation';
        v_emoji := '👨‍🍳';
      WHEN 'delivering' THEN
        v_status_label := 'En cours de livraison';
        v_emoji := '🚚';
      WHEN 'delivered' THEN
        v_status_label := 'Livrée';
        v_emoji := '✅';
      WHEN 'cancelled' THEN
        v_status_label := 'Annulée';
        v_emoji := '❌';
      WHEN 'awaiting-client-validation' THEN
        v_status_label := 'En attente de validation';
        v_emoji := '🔔';
      ELSE
        v_status_label := NEW.status;
        v_emoji := '📦';
    END CASE;
    
    -- Get supplier name if exists
    IF NEW.supplier_id IS NOT NULL THEN
      SELECT COALESCE(p.business_name, p.name) INTO v_supplier_name
      FROM profiles p
      WHERE p.id = NEW.supplier_id;
    END IF;
    
    -- Notify the client about status change
    IF NEW.status IN ('accepted', 'preparing', 'delivering', 'delivered', 'cancelled', 'awaiting-client-validation') THEN
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        NEW.client_id,
        'order_status',
        v_emoji || ' Mise à jour de commande',
        'Commande #' || NEW.order_number || ' : ' || v_status_label,
        jsonb_build_object(
          'orderNumber', NEW.order_number,
          'orderId', NEW.id,
          'status', NEW.status,
          'statusLabel', v_status_label,
          'supplierName', v_supplier_name
        )
      );
    END IF;
    
    -- Also notify supplier for certain status changes (if they're involved)
    IF NEW.supplier_id IS NOT NULL AND NEW.status IN ('delivered', 'cancelled') THEN
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        NEW.supplier_id,
        'order_status',
        v_emoji || ' Mise à jour de commande',
        'Commande #' || NEW.order_number || ' : ' || v_status_label,
        jsonb_build_object(
          'orderNumber', NEW.order_number,
          'orderId', NEW.id,
          'status', NEW.status,
          'statusLabel', v_status_label
        )
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for order status change notifications
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON orders;
CREATE TRIGGER trigger_notify_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION create_notification_on_order_status_change();

-- ============================================================================
-- Indexes for better notification query performance
-- ============================================================================

-- Index for fetching user notifications efficiently
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC) 
WHERE is_read = false;

-- Index for notification cleanup queries
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at) 
WHERE is_read = true;
