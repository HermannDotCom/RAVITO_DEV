/*
  # Make address column optional in profiles table

  1. Problem
    - The address field is required (NOT NULL) in profiles table
    - However, at registration time, users only provide: name, email, phone, role
    - The full address is collected in Step 2 but not sent in signUp metadata
    - This causes registration to fail with "Database error saving new user"

  2. Solution
    - Make the address column nullable
    - Update the trigger to use empty string as default
    - Allow the application to update the profile with full details after signup

  3. Changes
    - ALTER TABLE profiles to make address nullable
    - Update handle_new_user trigger to handle missing address
*/

-- Make address column nullable
ALTER TABLE profiles 
ALTER COLUMN address DROP NOT NULL;

-- Update the trigger to handle optional address
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile with required fields only
  -- Address, phone can be empty and updated later by the application
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