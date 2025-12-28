/*
  # Fix Trigger - Remove Email Column Reference
  
  ## Problem
  The handle_new_user trigger is trying to insert into an 'email' column that doesn't exist in profiles table.
  This causes profile creation to fail silently (caught by EXCEPTION handler).
  
  ## Solution
  Remove the email column from the INSERT statement in the trigger function.
  The profiles table only has: id, role, name, phone, address, coordinates, business_name, etc.
*/

-- Drop and recreate the trigger function without email column
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
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
  
  -- Insert profile WITHOUT email column (it doesn't exist in profiles table)
  INSERT INTO public.profiles (
    id,
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
    v_role::user_role,
    v_name,
    v_phone,
    v_address,
    true,
    CASE WHEN v_role = 'admin' THEN true ELSE false END,
    CASE WHEN v_role = 'admin' THEN 'approved'::approval_status ELSE 'pending'::approval_status END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error for debugging
  RAISE LOG 'Error in handle_new_user for user %: % %', NEW.id, SQLSTATE, SQLERRM;
  -- Still return NEW to not fail the auth signup
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates profile when user signs up. Uses SECURITY DEFINER to bypass RLS.';
