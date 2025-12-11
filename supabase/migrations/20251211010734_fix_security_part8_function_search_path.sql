/*
  # Fix Security Issues - Part 8: Secure Functions with search_path
  
  Set search_path = '' for critical functions to prevent search path manipulation attacks
  This is a security best practice recommended by PostgreSQL
*/

-- Function: handle_new_user
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'client'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function: update_updated_at_column
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: generate_confirmation_code
DROP FUNCTION IF EXISTS generate_confirmation_code() CASCADE;
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function: set_delivery_confirmation_code
DROP FUNCTION IF EXISTS set_delivery_confirmation_code() CASCADE;
CREATE OR REPLACE FUNCTION set_delivery_confirmation_code()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'delivering' AND (OLD.status IS NULL OR OLD.status != 'delivering') THEN
    NEW.delivery_confirmation_code := generate_confirmation_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Function: update_user_rating
DROP FUNCTION IF EXISTS update_user_rating() CASCADE;
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  SELECT AVG(overall)::DECIMAL(3,2)
  INTO avg_rating
  FROM public.ratings
  WHERE to_user_id = NEW.to_user_id;

  UPDATE public.profiles
  SET rating = avg_rating
  WHERE id = NEW.to_user_id;

  RETURN NEW;
END;
$$;

-- Function: update_supplier_zone_stats
DROP FUNCTION IF EXISTS update_supplier_zone_stats() CASCADE;
CREATE OR REPLACE FUNCTION update_supplier_zone_stats()
RETURNS void
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.supplier_zones sz
  SET 
    total_orders = stats.order_count,
    completed_orders = stats.completed_count,
    total_revenue = stats.revenue
  FROM (
    SELECT 
      supplier_id,
      zone_id,
      COUNT(*) as order_count,
      COUNT(*) FILTER (WHERE status = 'delivered') as completed_count,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0) as revenue
    FROM public.orders
    WHERE supplier_id IS NOT NULL
    GROUP BY supplier_id, zone_id
  ) stats
  WHERE sz.supplier_id = stats.supplier_id 
    AND sz.zone_id = stats.zone_id;
END;
$$;

-- Function: check_single_accepted_offer
DROP FUNCTION IF EXISTS check_single_accepted_offer() CASCADE;
CREATE OR REPLACE FUNCTION check_single_accepted_offer()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    IF EXISTS (
      SELECT 1 FROM public.supplier_offers
      WHERE order_id = NEW.order_id
        AND status = 'accepted'
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Only one offer can be accepted per order';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Function: log_order_activity
DROP FUNCTION IF EXISTS log_order_activity() CASCADE;
CREATE OR REPLACE FUNCTION log_order_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_activity_log (user_id, activity_type, description, related_entity_type, related_entity_id)
    VALUES (NEW.client_id, 'order_created', 'Created order #' || NEW.order_number, 'order', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.user_activity_log (user_id, activity_type, description, related_entity_type, related_entity_id)
    VALUES (NEW.client_id, 'order_status_changed', 'Order #' || NEW.order_number || ' status changed to ' || NEW.status, 'order', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Function: log_profile_update_activity
DROP FUNCTION IF EXISTS log_profile_update_activity() CASCADE;
CREATE OR REPLACE FUNCTION log_profile_update_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_activity_log (user_id, activity_type, description, related_entity_type, related_entity_id)
    VALUES (NEW.id, 'profile_updated', 'Profile information updated', 'profile', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Function: log_rating_activity
DROP FUNCTION IF EXISTS log_rating_activity() CASCADE;
CREATE OR REPLACE FUNCTION log_rating_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_activity_log (user_id, activity_type, description, related_entity_type, related_entity_id)
    VALUES (NEW.from_user_id, 'rating_submitted', 'Submitted rating for order', 'rating', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Function: update_zone_request_timestamp
DROP FUNCTION IF EXISTS update_zone_request_timestamp() CASCADE;
CREATE OR REPLACE FUNCTION update_zone_request_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Function: update_ticket_timestamp
DROP FUNCTION IF EXISTS update_ticket_timestamp() CASCADE;
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Function: generate_ticket_number
DROP FUNCTION IF EXISTS generate_ticket_number() CASCADE;
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  ticket_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.support_tickets;
  
  ticket_num := 'TKT' || LPAD(next_num::TEXT, 6, '0');
  RETURN ticket_num;
END;
$$;

-- Function: update_organizations_updated_at
DROP FUNCTION IF EXISTS update_organizations_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: update_organization_members_updated_at
DROP FUNCTION IF EXISTS update_organization_members_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_organization_members_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: notify_admins_new_zone_request
DROP FUNCTION IF EXISTS notify_admins_new_zone_request() CASCADE;
CREATE OR REPLACE FUNCTION notify_admins_new_zone_request()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  admin_id uuid;
  zone_name text;
  supplier_name text;
BEGIN
  SELECT name INTO zone_name FROM public.zones WHERE id = NEW.zone_id;
  SELECT name INTO supplier_name FROM public.profiles WHERE id = NEW.supplier_id;
  
  FOR admin_id IN SELECT id FROM public.profiles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
    VALUES (
      admin_id,
      'zone_request',
      'New Zone Registration Request',
      supplier_name || ' has requested access to zone: ' || zone_name,
      'zone_request',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Function: notify_supplier_request_reviewed
DROP FUNCTION IF EXISTS notify_supplier_request_reviewed() CASCADE;
CREATE OR REPLACE FUNCTION notify_supplier_request_reviewed()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  zone_name text;
  notification_title text;
  notification_message text;
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    SELECT name INTO zone_name FROM public.zones WHERE id = NEW.zone_id;
    
    IF NEW.status = 'approved' THEN
      notification_title := 'Zone Request Approved';
      notification_message := 'Your request for zone "' || zone_name || '" has been approved!';
    ELSE
      notification_title := 'Zone Request Rejected';
      notification_message := 'Your request for zone "' || zone_name || '" has been rejected.';
    END IF;
    
    INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id)
    VALUES (
      NEW.supplier_id,
      'zone_request',
      notification_title,
      notification_message,
      'zone_request',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function: update_orders_on_transfer_completion
DROP FUNCTION IF EXISTS update_orders_on_transfer_completion() CASCADE;
CREATE OR REPLACE FUNCTION update_orders_on_transfer_completion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.orders
    SET payment_status = 'paid'
    WHERE id IN (
      SELECT order_id FROM public.transfer_orders WHERE transfer_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;