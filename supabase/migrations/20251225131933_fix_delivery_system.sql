-- Migration: Fix delivery system bugs
-- Date: 2025-12-25
-- Description: 
--   1. Update get_client_info_for_order function to return correct fields
--   2. Update orders_with_coords view to include assigned_delivery_user_id

-- ============================================================================
-- Bug 2: Fix get_client_info_for_order function
-- ============================================================================
-- The function needs to return id, name, business_name, phone, rating
-- instead of client_name, client_phone, client_coordinates

DROP FUNCTION IF EXISTS get_client_info_for_order(uuid);

CREATE OR REPLACE FUNCTION get_client_info_for_order(p_order_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  business_name TEXT,
  phone TEXT,
  rating NUMERIC
)
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.business_name,
    p.phone,
    p.rating
  FROM public.profiles p
  JOIN public.orders o ON o.client_id = p.id
  WHERE o.id = p_order_id
    AND o.status NOT IN ('pending', 'offers-received')
    AND (
      o.supplier_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_client_info_for_order(UUID) TO authenticated;

COMMENT ON FUNCTION get_client_info_for_order IS 'Returns client profile information for a given order. Only accessible by the order supplier or admin.';


-- ============================================================================
-- Bug 4: Fix orders_with_coords view to include assigned_delivery_user_id
-- ============================================================================
-- The view needs to include assigned_driver_id as assigned_delivery_user_id

DROP VIEW IF EXISTS orders_with_coords CASCADE;

CREATE VIEW orders_with_coords
WITH (security_invoker = true)
AS
SELECT
  orders.*,
  ST_Y(coordinates::geometry) as lat,
  ST_X(coordinates::geometry) as lng,
  orders.assigned_driver_id as assigned_delivery_user_id
FROM orders;

COMMENT ON VIEW orders_with_coords IS 'View providing orders with coordinate fields (lat, lng) and assigned_delivery_user_id for delivery mode compatibility.';
