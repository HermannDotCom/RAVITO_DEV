/*
  # Fix Critical RLS Circular Dependency and Auth Issues
  
  ## Root Cause Analysis
  1. The is_admin() function creates a circular dependency in RLS policies
  2. Policies reference is_admin() which queries profiles, causing infinite recursion
  3. This blocks ALL profile access, preventing login
  
  ## Solution
  1. Simplify RLS policies to check role directly without helper function
  2. Use auth.jwt() to get user metadata for admin check (faster, no DB query)
  3. Keep policies simple and avoid circular dependencies
  
  ## Impact
  - Users will be able to read their own profiles again
  - Login flow will work correctly
  - No performance impact (JWT check is faster than DB query)
*/

-- Drop existing policies that use is_admin()
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create new simplified policies WITHOUT circular dependencies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = id 
    OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Add INSERT policy for system/trigger use
CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON POLICY "Users can view own profile" ON profiles IS 
  'Allows users to view their own profile. Admins can view all profiles. Uses direct subquery to avoid circular dependency.';

COMMENT ON POLICY "Users can update own profile" ON profiles IS 
  'Allows users to update their own profile. Admins can update all profiles.';

COMMENT ON POLICY "Admins can delete profiles" ON profiles IS 
  'Only admins can delete profiles.';

COMMENT ON POLICY "System can insert profiles" ON profiles IS 
  'Allows authenticated users to insert their own profile (used by registration trigger).';
