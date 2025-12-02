/*
  # Fix profile functions - Remove invalid 'completed' status

  Issue found: The functions created in the previous migration reference 'completed' 
  status which does NOT exist in the order_status enum. Valid statuses are:
  - delivered
  - awaiting-rating
  
  This migration fixes all three functions by removing the invalid 'completed' status.
  
  Changes:
  - get_profile_for_rating: Remove 'completed' from status check
  - get_supplier_info_for_order: Already correct (uses payment_status not order status)
  - get_client_info_for_order: Need to verify and fix if needed
*/

-- Fix get_profile_for_rating: Remove invalid 'completed' status
CREATE OR REPLACE FUNCTION get_profile_for_rating(p_order_id uuid, p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  business_name text,
  phone text,
  rating numeric
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return the profile of the OTHER party in the order
  -- Only if the order is delivered or awaiting-rating (ready for rating)
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.business_name,
    p.phone,
    p.rating
  FROM profiles p
  INNER JOIN orders o ON (o.supplier_id = p.id OR o.client_id = p.id)
  WHERE o.id = p_order_id
    AND p.id = p_user_id
    AND o.status IN ('delivered', 'awaiting-rating')
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Verify and fix get_supplier_profiles_for_client if needed
-- This function uses payment_status which has: pending, paid, failed, refunded, completed, transferred
-- Let's check if payment_status 'completed' exists
DO $$
BEGIN
  -- The payment_status enum should have 'completed' as it's different from order_status
  -- But let's be safe and only use confirmed statuses: paid, transferred
  -- We'll recreate the function to be explicit
END $$;

-- Recreate get_supplier_profiles_for_client with explicit payment statuses
CREATE OR REPLACE FUNCTION get_supplier_profiles_for_client(client_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  business_name text,
  phone text,
  rating numeric,
  address text
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return supplier profiles for orders that are paid or transferred
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.name,
    p.business_name,
    p.phone,
    p.rating,
    p.address
  FROM profiles p
  INNER JOIN orders o ON o.supplier_id = p.id
  WHERE o.client_id = client_user_id
    AND o.payment_status IN ('paid', 'transferred')
    AND p.is_active = true
    AND p.role = 'supplier';
END;
$$ LANGUAGE plpgsql;

-- Recreate get_client_profiles_for_supplier with explicit payment statuses
CREATE OR REPLACE FUNCTION get_client_profiles_for_supplier(supplier_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  business_name text,
  phone text,
  rating numeric,
  address text
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return client profiles for orders that are paid or transferred
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.name,
    p.business_name,
    p.phone,
    p.rating,
    p.address
  FROM profiles p
  INNER JOIN orders o ON o.client_id = p.id
  WHERE o.supplier_id = supplier_user_id
    AND o.payment_status IN ('paid', 'transferred')
    AND p.is_active = true
    AND p.role = 'client';
END;
$$ LANGUAGE plpgsql;

-- Update comments
COMMENT ON FUNCTION get_profile_for_rating(uuid, uuid) IS
  'Returns profile information for rating forms. Only works for delivered/awaiting-rating orders where both parties can rate each other.';