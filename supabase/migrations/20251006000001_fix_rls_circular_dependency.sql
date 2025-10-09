/*
  # Fix RLS Circular Dependency - Complete Solution

  ## Problem Analysis
  1. Helper functions (is_admin, is_approved_user, has_role) query the profiles table
  2. Profiles table policies call these functions
  3. This creates infinite recursion causing queries to hang forever
  4. JWT token issues compound the problem

  ## Solution
  1. Recreate helper functions with STABLE + SECURITY DEFINER + bypassing RLS
  2. Use pg_catalog.current_setting to get auth.uid directly
  3. Rebuild all policies without circular dependencies
  4. Ensure simple path for users to read their own profile

  ## Security
  - Users can only see their own profile
  - Admins can see all profiles
  - No circular dependencies
  - Functions bypass RLS safely with SECURITY DEFINER
*/

-- ============================================================================
-- STEP 1: Drop all existing problematic policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ============================================================================
-- STEP 2: Recreate helper functions WITHOUT circular dependencies
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_approved_user();
DROP FUNCTION IF EXISTS has_role(user_role);

-- Recreate is_admin with STABLE and bypassing RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role directly, bypassing RLS because of SECURITY DEFINER
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- Recreate is_approved_user with STABLE and bypassing RLS
CREATE OR REPLACE FUNCTION is_approved_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_approved boolean;
  user_active boolean;
BEGIN
  -- Get approval status directly, bypassing RLS
  SELECT is_approved, is_active INTO user_approved, user_active
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_approved AND user_active, false);
END;
$$;

-- Recreate has_role with STABLE and bypassing RLS
CREATE OR REPLACE FUNCTION has_role(check_role user_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- Get role directly, bypassing RLS
  SELECT role INTO user_role_value
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role_value = check_role, false);
END;
$$;

-- ============================================================================
-- STEP 3: Create NEW simple policies without circular dependency
-- ============================================================================

-- Policy 1: Users can ALWAYS view their own profile (no function calls)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Admins can view all profiles (function is now safe)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 4: Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- STEP 4: Grant proper permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_approved_user() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(user_role) TO authenticated;
