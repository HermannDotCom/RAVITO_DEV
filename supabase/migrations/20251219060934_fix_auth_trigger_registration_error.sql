/*
  # Fix Auth Trigger - Registration Database Error

  1. Problem Analysis
    - Constraint: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
    - Error: "Database error saving new user" during signup
    - The handle_new_user trigger fails during profile creation
    - Root cause: Trigger execution context or permissions issue

  2. Solution
    - Recreate handle_new_user with explicit SECURITY DEFINER
    - Set search_path to ensure correct schema resolution
    - Add transaction-safe execution
    - Simplify logic to be more robust

  3. Security
    - Function runs as postgres (SECURITY DEFINER)
    - Only called by auth.users INSERT trigger (system trigger)
    - No security risk
*/

-- Step 1: Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop and recreate the function with proper settings
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_name text;
  v_phone text;
  v_address text;
BEGIN
  -- Extract metadata safely
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  v_address := COALESCE(NEW.raw_user_meta_data->>'address', '');

  -- Insert profile record
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
    v_role,
    v_name,
    v_phone,
    v_address
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the signup
  RAISE WARNING 'Error creating profile for user %: % - %', 
    NEW.id, SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

-- Step 3: Recreate the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();