-- ============================================================================
-- FIX: Allow Profile Creation During Signup
-- ============================================================================
--
-- Problem: Users cannot create profiles during signup because RLS blocks it
-- Solution: Make the INSERT policy more permissive for authenticated users
--
-- Instructions:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ============================================================================

-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

-- Create new permissive INSERT policy
-- This allows any authenticated user to insert their own profile
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Profile INSERT policy has been updated successfully!';
  RAISE NOTICE 'Users can now create their profiles during signup.';
END $$;
