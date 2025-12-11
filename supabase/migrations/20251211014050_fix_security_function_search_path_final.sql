/*
  # Fix Function Search Path Security (Final)
  
  Add SET search_path = '' to all functions with mutable search_path
  to prevent search path manipulation attacks.
  
  Uses CASCADE where necessary for functions with dependent triggers.
*/

-- ============================================================================
-- Functions without triggers - simple DROP
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_permissions(uuid);
CREATE FUNCTION get_user_permissions(user_id_param uuid)
RETURNS TABLE(permission_name text)
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT rp.permission_name
  FROM public.organization_members om
  JOIN public.role_permissions rp ON om.role = rp.role_name
  WHERE om.user_id = user_id_param;
END;
$$;

DROP FUNCTION IF EXISTS get_client_info_for_order(uuid);
CREATE FUNCTION get_client_info_for_order(order_id_param uuid)
RETURNS TABLE(
  client_name text,
  client_phone text,
  client_coordinates jsonb
)
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name,
    p.phone,
    p.coordinates
  FROM public.orders o
  JOIN public.profiles p ON o.client_id = p.id
  WHERE o.id = order_id_param
    AND o.status NOT IN ('pending', 'offers-received')
    AND (
      o.supplier_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
END;
$$;

DROP FUNCTION IF EXISTS get_pending_ratings_for_user(uuid);
CREATE FUNCTION get_pending_ratings_for_user(user_id_param uuid)
RETURNS TABLE(
  order_id uuid,
  order_number text,
  other_user_id uuid,
  other_user_name text,
  other_user_role text,
  completed_at timestamptz
)
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as order_id,
    o.order_number,
    CASE 
      WHEN o.client_id = user_id_param THEN o.supplier_id
      ELSE o.client_id
    END as other_user_id,
    p.name as other_user_name,
    p.role as other_user_role,
    o.completed_at
  FROM public.orders o
  JOIN public.profiles p ON (
    CASE 
      WHEN o.client_id = user_id_param THEN o.supplier_id = p.id
      ELSE o.client_id = p.id
    END
  )
  WHERE 
    o.status = 'delivered'
    AND (o.client_id = user_id_param OR o.supplier_id = user_id_param)
    AND NOT EXISTS (
      SELECT 1 FROM public.ratings r 
      WHERE r.order_id = o.id 
      AND r.from_user_id = user_id_param
    );
END;
$$;

DROP FUNCTION IF EXISTS create_organization_with_owner(text, text, uuid);
CREATE FUNCTION create_organization_with_owner(
  org_name text,
  org_type text,
  owner_id uuid
)
RETURNS uuid
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  INSERT INTO public.organizations (name, type, owner_id)
  VALUES (org_name, org_type, owner_id)
  RETURNING id INTO new_org_id;
  
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, owner_id, 'owner');
  
  RETURN new_org_id;
END;
$$;

DROP FUNCTION IF EXISTS get_organization_member_count(uuid);
CREATE FUNCTION get_organization_member_count(org_id uuid)
RETURNS integer
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  member_count integer;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM public.organization_members
  WHERE organization_id = org_id;
  
  RETURN member_count;
END;
$$;

DROP FUNCTION IF EXISTS has_permission(uuid, uuid, text);
CREATE FUNCTION has_permission(
  user_id_param uuid,
  org_id uuid,
  required_permission text
)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.role_permissions rp ON om.role = rp.role_name
    WHERE om.organization_id = org_id
      AND om.user_id = user_id_param
      AND rp.permission_name = required_permission
  );
END;
$$;

DROP FUNCTION IF EXISTS can_add_member(uuid);
CREATE FUNCTION can_add_member(org_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  org_type text;
  current_count integer;
  max_members integer;
BEGIN
  SELECT type INTO org_type FROM public.organizations WHERE id = org_id;
  SELECT COUNT(*) INTO current_count FROM public.organization_members WHERE organization_id = org_id;
  
  max_members := CASE org_type
    WHEN 'personal' THEN 1
    WHEN 'team' THEN 10
    WHEN 'enterprise' THEN 999999
    ELSE 0
  END;
  
  RETURN current_count < max_members;
END;
$$;

DROP FUNCTION IF EXISTS has_pending_ratings(uuid);
CREATE FUNCTION has_pending_ratings(user_id_param uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.status = 'delivered'
      AND (o.client_id = user_id_param OR o.supplier_id = user_id_param)
      AND NOT EXISTS (
        SELECT 1 FROM public.ratings r 
        WHERE r.order_id = o.id 
        AND r.from_user_id = user_id_param
      )
  );
END;
$$;

-- ============================================================================
-- Functions with triggers - use CASCADE
-- ============================================================================

DROP FUNCTION IF EXISTS create_notification_on_new_order() CASCADE;
CREATE FUNCTION create_notification_on_new_order()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  supplier_id_var uuid;
  zone_name_var text;
BEGIN
  SELECT name INTO zone_name_var FROM public.zones WHERE id = NEW.zone_id;
  
  FOR supplier_id_var IN 
    SELECT supplier_id 
    FROM public.supplier_zones 
    WHERE zone_id = NEW.zone_id AND is_active = true
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
    VALUES (
      supplier_id_var,
      'new_order',
      'New Order Available',
      'A new order is available in your zone: ' || zone_name_var,
      'order',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_notify_suppliers_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_new_order();

DROP FUNCTION IF EXISTS create_notification_on_order_status_change() CASCADE;
CREATE FUNCTION create_notification_on_order_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  notification_title text;
  notification_message text;
  notification_type text;
  recipient_id uuid;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'offers-received' THEN
        notification_type := 'order_update';
        notification_title := 'New Offers Received';
        notification_message := 'You have received new offers for order #' || NEW.order_number;
        recipient_id := NEW.client_id;
      WHEN 'accepted' THEN
        notification_type := 'order_update';
        notification_title := 'Order Accepted';
        notification_message := 'Your offer for order #' || NEW.order_number || ' has been accepted';
        recipient_id := NEW.supplier_id;
      WHEN 'delivering' THEN
        notification_type := 'order_update';
        notification_title := 'Order In Delivery';
        notification_message := 'Order #' || NEW.order_number || ' is now being delivered';
        recipient_id := NEW.client_id;
      WHEN 'delivered' THEN
        notification_type := 'order_update';
        notification_title := 'Order Delivered';
        notification_message := 'Order #' || NEW.order_number || ' has been delivered';
        recipient_id := NEW.client_id;
      ELSE
        RETURN NEW;
    END CASE;
    
    IF recipient_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
      VALUES (recipient_id, notification_type, notification_title, notification_message, 'order', NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_notify_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_on_order_status_change();