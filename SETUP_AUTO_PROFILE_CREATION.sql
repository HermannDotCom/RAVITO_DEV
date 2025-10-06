-- ============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ============================================================================
--
-- This script creates a trigger that automatically creates a profile entry
-- when a new user signs up in auth.users
--
-- Instructions:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ============================================================================

-- First, make the INSERT policy permissive
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_metadata jsonb;
BEGIN
  user_metadata := new.raw_user_meta_data;

  -- Only create profile if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    INSERT INTO public.profiles (
      id,
      role,
      name,
      phone,
      address,
      coordinates,
      is_active,
      is_approved,
      approval_status,
      created_at
    ) VALUES (
      new.id,
      COALESCE((user_metadata->>'role')::user_role, 'client'::user_role),
      COALESCE(user_metadata->>'name', 'User'),
      COALESCE(user_metadata->>'phone', ''),
      COALESCE(user_metadata->>'address', ''),
      ST_SetSRID(ST_MakePoint(-4.0267, 5.3364), 4326), -- Default coordinates (Abidjan)
      true,
      false,
      'pending',
      now()
    );
  END IF;

  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Auto-profile creation trigger has been set up successfully!';
  RAISE NOTICE '✓ New users will automatically get a profile when they sign up.';
  RAISE NOTICE '✓ You can now test by creating a new account.';
END $$;
