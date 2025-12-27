/*
  # Fix Registration Error: Final Comprehensive Fix
  
  ## Problem
  User registration fails with "Database error saving new user" because:
  1. auth.signUp() triggers handle_new_user() function
  2. handle_new_user() tries to INSERT into profiles table
  3. RLS INSERT policies require auth.uid() = id
  4. During signup, user is not authenticated, so auth.uid() is NULL
  5. INSERT fails, causing entire signup to fail
  
  ## Solution
  1. Ensure handle_new_user uses SECURITY DEFINER and proper search_path
  2. Make required fields nullable (address, phone) 
  3. Drop ALL INSERT policies on profiles table
  4. Rely solely on trigger for profile creation (more secure)
  5. Direct INSERT attempts by users will be blocked by RLS being enabled
  
  ## Security
  - SECURITY DEFINER allows trigger to bypass RLS
  - search_path = '' prevents function search path attacks
  - No INSERT policy means users cannot directly insert profiles
  - Profiles can only be created through auth.users INSERT trigger
  - This is the recommended Supabase pattern for profile creation
*/

-- Step 1: Make required fields nullable to allow gradual profile completion
ALTER TABLE profiles 
ALTER COLUMN address DROP NOT NULL;

ALTER TABLE profiles 
ALTER COLUMN phone DROP NOT NULL;

-- Step 2: Recreate handle_new_user function with proper security settings
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- This allows bypassing RLS
SET search_path = ''  -- Prevents search_path attacks
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert minimal profile that will be completed by application
  -- Using COALESCE to handle missing metadata gracefully
  INSERT INTO public.profiles (
    id,
    email,
    role,
    name,
    phone,
    address
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Step 4: Drop ALL INSERT policies on profiles
-- These policies were blocking the trigger from working
-- Explicitly dropping all known INSERT policies by name
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Step 5: Keep SELECT, UPDATE, DELETE policies for normal operations
-- Users need to be able to read and update their profiles after creation

-- Ensure SELECT policies exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure UPDATE policies exist
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure DELETE policy exists (admin only)
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates a profile when a new user signs up. Uses SECURITY DEFINER to bypass RLS. Profiles cannot be created any other way.';
COMMENT ON TABLE profiles IS 'User profiles. Created automatically via trigger when auth.users record is inserted. Cannot be directly inserted by users.';
