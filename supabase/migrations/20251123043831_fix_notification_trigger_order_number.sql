/*
  # Fix Notification Trigger - Remove order_number Reference
  
  1. Changes
    - Update create_notification_on_order_status_change function to use order ID instead of order_number
    - Remove references to non-existent order_number column
    - Use order ID for display in notifications
  
  2. Security
    - Maintains SECURITY DEFINER for notification creation
    - No changes to RLS policies
*/

CREATE OR REPLACE FUNCTION create_notification_on_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      WHEN 'paid' THEN
        v_status_label := 'Payée';
        v_emoji := '💰';
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
    IF NEW.status IN ('accepted', 'preparing', 'delivering', 'delivered', 'cancelled', 'awaiting-client-validation', 'paid') THEN
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        NEW.client_id,
        'order_status',
        v_emoji || ' Mise à jour de commande',
        'Commande ' || SUBSTRING(NEW.id::text, 1, 8) || ' : ' || v_status_label,
        jsonb_build_object(
          'orderId', NEW.id,
          'status', NEW.status,
          'statusLabel', v_status_label,
          'supplierName', v_supplier_name
        )
      );
    END IF;
    
    -- Also notify supplier for certain status changes (if they're involved)
    IF NEW.supplier_id IS NOT NULL AND NEW.status IN ('delivered', 'cancelled', 'paid') THEN
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        NEW.supplier_id,
        'order_status',
        v_emoji || ' Mise à jour de commande',
        'Commande ' || SUBSTRING(NEW.id::text, 1, 8) || ' : ' || v_status_label,
        jsonb_build_object(
          'orderId', NEW.id,
          'status', NEW.status,
          'statusLabel', v_status_label
        )
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;
