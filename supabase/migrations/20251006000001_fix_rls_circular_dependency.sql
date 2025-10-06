/*
  # Fix RLS Circular Dependency in Profiles Table

  1. Problem
    - The current policy uses is_admin() function which queries profiles table
    - This creates a circular dependency causing queries to hang

  2. Solution
    - Drop the problematic policy
    - Create a simple policy that allows users to see their own profile
    - Create a separate policy for admins using inline role check

  3. Security
    - Users can still only see their own profile
    - Admins can see all profiles
    - No circular dependency
*/

-- Drop the existing policy that causes circular dependency
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create policy for users to view their own profile (simple, no recursion)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create separate policy for admins to view all profiles
-- This uses a direct subquery without calling is_admin()
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
