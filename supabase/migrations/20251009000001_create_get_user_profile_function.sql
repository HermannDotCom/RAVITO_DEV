/*
  # Create RPC function to bypass RLS for user profile fetch

  This function allows authenticated users to fetch their own profile
  without triggering the circular RLS dependency issue.

  SECURITY: The function uses SECURITY DEFINER to bypass RLS policies
  but only returns the profile for the authenticated user (auth.uid()).
*/

CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  role user_role,
  name text,
  phone text,
  address text,
  coordinates geometry(Point, 4326),
  rating numeric,
  total_orders integer,
  is_active boolean,
  is_approved boolean,
  approval_status text,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz,
  business_name text,
  business_hours text,
  responsible_person text,
  coverage_zone text,
  delivery_capacity text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to fetch their own profile
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.role,
    p.name,
    p.phone,
    p.address,
    p.coordinates,
    p.rating,
    p.total_orders,
    p.is_active,
    p.is_approved,
    p.approval_status,
    p.approved_at,
    p.rejected_at,
    p.rejection_reason,
    p.created_at,
    p.business_name,
    p.business_hours,
    p.responsible_person,
    p.coverage_zone,
    p.delivery_capacity
  FROM profiles p
  WHERE p.id = user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;

COMMENT ON FUNCTION get_user_profile IS 'Fetch user profile bypassing RLS circular dependency. Only returns authenticated user own profile.';
