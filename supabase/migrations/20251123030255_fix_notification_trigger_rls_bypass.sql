/*
  # Fix RLS bypass in notification trigger
  
  The create_notification_on_new_offer function needs to bypass RLS when reading
  from the orders table since it's executed in a trigger context.
  
  Changes:
  - Use explicit schema qualification and security definer context properly
  - Ensure the function can read from orders regardless of RLS policies
*/

CREATE OR REPLACE FUNCTION public.create_notification_on_new_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_client_id UUID;
  v_supplier_name TEXT;
BEGIN
  -- Get the client ID (bypass RLS since this is a system operation)
  SELECT client_id INTO v_client_id
  FROM orders
  WHERE id = NEW.order_id;
  
  -- Get the supplier name
  SELECT COALESCE(business_name, name) INTO v_supplier_name
  FROM profiles
  WHERE id = NEW.supplier_id;
  
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
