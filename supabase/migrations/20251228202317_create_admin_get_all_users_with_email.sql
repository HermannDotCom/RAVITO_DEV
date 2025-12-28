/*
  # Create Admin Function to Get All Users with Email
  
  ## Purpose
  The admin panel needs to display user emails, but the email is stored in auth.users,
  not in the profiles table. This function joins both tables to provide complete user info.
  
  ## Security
  - SECURITY DEFINER allows bypassing RLS
  - Only accessible to admins (checked at application level)
  - Returns email from auth.users which is needed for user management
  
  ## Returns
  Complete user information including email for admin user management
*/

-- Function to get all users with their emails (admin only)
CREATE OR REPLACE FUNCTION get_all_users_with_email()
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role user_role,
  phone text,
  address text,
  business_name text,
  is_active boolean,
  is_approved boolean,
  approval_status approval_status,
  created_at timestamptz,
  rating numeric,
  total_orders integer
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.name,
    p.role,
    p.phone,
    p.address,
    p.business_name,
    p.is_active,
    p.is_approved,
    p.approval_status,
    p.created_at,
    p.rating,
    p.total_orders
  FROM profiles p
  INNER JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (admin check is inside function)
GRANT EXECUTE ON FUNCTION get_all_users_with_email() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_all_users_with_email() IS 
  'Admin-only function that returns all users with their emails from auth.users. Includes approval status and other profile data.';

-- Function to get users by approval status with email (admin only)
CREATE OR REPLACE FUNCTION get_users_by_status_with_email(status_filter approval_status)
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role user_role,
  phone text,
  address text,
  business_name text,
  is_active boolean,
  is_approved boolean,
  approval_status approval_status,
  created_at timestamptz,
  rating numeric,
  total_orders integer
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    au.email,
    p.name,
    p.role,
    p.phone,
    p.address,
    p.business_name,
    p.is_active,
    p.is_approved,
    p.approval_status,
    p.created_at,
    p.rating,
    p.total_orders
  FROM profiles p
  INNER JOIN auth.users au ON p.id = au.id
  WHERE p.approval_status = status_filter
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_users_by_status_with_email(approval_status) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_users_by_status_with_email(approval_status) IS 
  'Admin-only function that returns users filtered by approval status with their emails from auth.users.';
