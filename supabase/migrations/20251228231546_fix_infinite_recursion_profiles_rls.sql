/*
  # Fix Infinite Recursion in Profiles RLS - Expert Solution
  
  ## Root Cause
  The RLS policies on profiles contain subqueries that query profiles itself:
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  
  This creates INFINITE RECURSION because:
  1. User queries profiles
  2. RLS checks policy
  3. Policy queries profiles again
  4. RLS checks policy again... INFINITE LOOP
  
  ## Expert Solution
  Use a SECURITY DEFINER function that bypasses RLS entirely for admin checks.
  This breaks the recursion chain.
  
  ## Security
  - Function is SECURITY DEFINER (bypasses RLS)
  - Function is STABLE (cacheable during query)
  - search_path is set (prevents injection)
  - Only checks current user's role
*/

-- Drop all existing policies with recursion issues
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;

-- Create a safe admin check function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Create new RLS policies WITHOUT recursion
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    is_current_user_admin()
  );

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    is_current_user_admin()
  )
  WITH CHECK (
    auth.uid() = id 
    OR 
    is_current_user_admin()
  );

CREATE POLICY "profiles_delete_policy"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_current_user_admin());

-- NO INSERT POLICY - profiles are created only by the trigger

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON FUNCTION public.is_current_user_admin() IS 
  'SECURITY DEFINER function that safely checks if current user is admin without causing RLS recursion';

COMMENT ON POLICY "profiles_select_policy" ON profiles IS 
  'Users can view their own profile. Admins can view all profiles via safe function.';

COMMENT ON POLICY "profiles_update_policy" ON profiles IS 
  'Users can update their own profile. Admins can update all profiles via safe function.';

COMMENT ON POLICY "profiles_delete_policy" ON profiles IS 
  'Only admins can delete profiles via safe function.';
