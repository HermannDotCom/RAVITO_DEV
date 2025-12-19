/*
  # Fix handle_new_user Trigger to Include Required Fields

  1. Problem
    - The handle_new_user trigger only inserts id, email, and role
    - The profiles table has NOT NULL constraints on name, phone, and address
    - This causes "Database error saving new user" during registration

  2. Solution
    - Extract all required fields from user metadata
    - Provide default values for required fields if not present in metadata
    - This allows auth.users creation to succeed
    - Application code will then update the profile with full details

  3. Changes
    - Update handle_new_user function to extract name, phone, address from metadata
    - Use sensible defaults if metadata is incomplete
*/

-- Drop and recreate the handle_new_user function with proper field handling
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with all required fields
  -- Extract from metadata or use defaults
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();