/*
  # Fix Registration Trigger - Final Solution
  
  ## Problem
  - No trigger exists on auth.users to create profiles automatically
  - INSERT policy on profiles requires auth.uid() = id
  - During signup, auth.uid() is NULL, so profile creation fails
  - This causes "Database error saving new user" error
  
  ## Solution
  1. Drop the INSERT policy that blocks profile creation
  2. Create handle_new_user() function with SECURITY DEFINER to bypass RLS
  3. Create trigger on auth.users AFTER INSERT
  4. Ensure address and phone fields are nullable
  
  ## Security
  - SECURITY DEFINER allows trigger to bypass RLS safely
  - Only system can trigger this function (not user-callable)
  - Users cannot directly INSERT into profiles (no INSERT policy)
  - Profiles are only created through the auth trigger
*/

-- Step 1: Make address and phone nullable to allow gradual completion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'address' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN address DROP NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'phone' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE profiles ALTER COLUMN phone DROP NOT NULL;
  END IF;
END $$;

-- Step 2: Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;

-- Step 3: Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 4: Create the handle_new_user function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER  -- Bypass RLS
SET search_path = public  -- Security: prevent search_path attacks
LANGUAGE plpgsql
AS $$
DECLARE
  v_role text;
  v_name text;
  v_phone text;
  v_address text;
BEGIN
  -- Extract metadata with safe defaults
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NULL);
  v_address := COALESCE(NEW.raw_user_meta_data->>'address', NULL);
  
  -- Validate role
  IF v_role NOT IN ('admin', 'client', 'supplier') THEN
    v_role := 'client';
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (
    id,
    email,
    role,
    name,
    phone,
    address,
    is_active,
    is_approved,
    approval_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_role::user_role,
    v_name,
    v_phone,
    v_address,
    true,
    CASE WHEN v_role = 'admin' THEN true ELSE false END,
    CASE WHEN v_role = 'admin' THEN 'approved' ELSE 'pending' END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the signup
  RAISE LOG 'Error in handle_new_user for user %: % %', NEW.id, SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

-- Step 5: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Add helpful comments
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates profile when user signs up. Uses SECURITY DEFINER to bypass RLS. Called only by auth.users trigger.';

COMMENT ON TABLE profiles IS 
  'User profiles. Created automatically via trigger. Cannot be directly inserted by users.';

-- Step 7: Ensure other RLS policies remain intact
-- Keep SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((auth.uid() = id) OR is_admin());

-- Keep UPDATE policy  
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((auth.uid() = id) OR is_admin())
  WITH CHECK ((auth.uid() = id) OR is_admin());

-- Keep DELETE policy
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (is_admin());
