/*
  # Complete Registration Fix v2
  
  ## Problem
  The trigger handle_new_user exists but is not creating profiles for new users.
  
  ## Solution
  1. Recreate the trigger function with proper type casting
  2. Add INSERT policy for profiles
  3. Backfill missing profiles
  
  ## Changes
  - handle_new_user function recreated with SECURITY DEFINER
  - INSERT policy added for authenticated users
  - Missing profiles created for existing auth users
*/

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 2: Create improved handle_new_user function with proper type casting
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role user_role;
  v_name text;
  v_phone text;
  v_address text;
  v_role_text text;
BEGIN
  -- Extract role and cast safely
  v_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  
  -- Validate and cast role
  IF v_role_text IN ('admin', 'client', 'supplier') THEN
    v_role := v_role_text::user_role;
  ELSE
    v_role := 'client'::user_role;
  END IF;
  
  -- Extract other metadata
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_address := COALESCE(NEW.raw_user_meta_data->>'address', '');
  
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
    v_role,
    v_name,
    v_phone,
    v_address,
    true,
    false,
    'pending',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error for %: % %', NEW.id, SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 4: Add INSERT policy for profiles
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Step 5: Backfill missing profiles with proper casting
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
SELECT 
  au.id,
  au.email,
  CASE 
    WHEN au.raw_user_meta_data->>'role' IN ('admin', 'client', 'supplier') 
    THEN (au.raw_user_meta_data->>'role')::user_role
    ELSE 'client'::user_role
  END,
  COALESCE(au.raw_user_meta_data->>'name', ''),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  COALESCE(au.raw_user_meta_data->>'address', ''),
  true,
  false,
  'pending',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
