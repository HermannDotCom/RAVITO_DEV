/*
  # Fix profile information retrieval with order status filtering

  The issue: get_public_profile_info returns profile information for all users,
  but doesn't take into account the order status. Client identities should only
  be revealed to suppliers after payment, and supplier identities should only
  be revealed to clients after payment.

  This migration creates specialized functions that properly filter based on:
  1. Order status (payment_status = 'paid', 'completed', or 'transferred')
  2. User role (client vs supplier)
  3. Relationship to the order (is the user a party to this order?)

  Functions created:
  - get_supplier_profiles_for_client: Returns supplier info only for paid orders
  - get_client_profiles_for_supplier: Returns client info only for paid orders
  - get_profile_for_rating: Returns profile info for rating forms (post-delivery)
*/

-- Function to get supplier profiles for a client (only for paid/completed orders)
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
  -- Only return supplier profiles for orders that are paid or beyond
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
    AND o.payment_status IN ('paid', 'completed', 'transferred')
    AND p.is_active = true
    AND p.role = 'supplier';
END;
$$ LANGUAGE plpgsql;

-- Function to get client profiles for a supplier (only for paid/completed orders)
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
  -- Only return client profiles for orders that are paid or beyond
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
    AND o.payment_status IN ('paid', 'completed', 'transferred')
    AND p.is_active = true
    AND p.role = 'client';
END;
$$ LANGUAGE plpgsql;

-- Function to get profile info for a specific order (for rating forms)
-- This checks that the order is in a state where identities should be revealed
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
  -- Only if the order is delivered or completed (ready for rating)
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
    AND o.status IN ('delivered', 'awaiting-rating', 'completed')
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_supplier_profiles_for_client(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_profiles_for_supplier(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_for_rating(uuid, uuid) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_supplier_profiles_for_client(uuid) IS
  'Returns supplier profiles only for orders that have been paid by the specified client. Used in order history to show supplier names only after payment.';

COMMENT ON FUNCTION get_client_profiles_for_supplier(uuid) IS
  'Returns client profiles only for orders that have been paid to the specified supplier. Used in delivery history to show client names only after payment.';

COMMENT ON FUNCTION get_profile_for_rating(uuid, uuid) IS
  'Returns profile information for rating forms. Only works for delivered/completed orders where both parties can rate each other.';