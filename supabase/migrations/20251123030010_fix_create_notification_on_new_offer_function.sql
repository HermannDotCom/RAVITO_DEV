/*
  # Fix create_notification_on_new_offer function
  
  The function was trying to access a non-existent column `order_number` in the orders table.
  This migration removes the reference to that column and uses the order ID instead.
  
  Changes:
  - Remove `order_number` from the SELECT statement
  - Remove `orderNumber` from the notification data (use orderId instead)
*/

CREATE OR REPLACE FUNCTION public.create_notification_on_new_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_client_id UUID;
  v_supplier_name TEXT;
BEGIN
  -- Get the client ID
  SELECT o.client_id INTO v_client_id
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
      'orderId', NEW.order_id,
      'supplierName', v_supplier_name,
      'offerId', NEW.id
    )
  );
  
  RETURN NEW;
END;
$function$;
