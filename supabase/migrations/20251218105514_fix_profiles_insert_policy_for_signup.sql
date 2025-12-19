/*
  # Fix profiles INSERT policy to allow trigger-based creation

  1. Problem
    - Current policy: profiles_insert_policy checks (id = auth.uid())
    - During signup, auth.uid() is NULL because user is not yet authenticated
    - The trigger handle_new_user fails to insert the profile
    - This causes "Database error saving new user"

  2. Solution
    - Drop the restrictive INSERT policy
    - The trigger uses SECURITY DEFINER which should bypass RLS
    - But we need to ensure no user can directly insert profiles
    - Only allow INSERT through the trigger (by having no explicit policy)

  3. Changes
    - Drop the profiles_insert_policy
    - Users can only create profiles through auth.users INSERT trigger
    - Direct INSERT attempts will fail due to RLS being enabled
*/

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;

-- No INSERT policy means:
-- - RLS is still enabled (blocking direct inserts by users)
-- - SECURITY DEFINER functions (like handle_new_user) can still insert
-- - This is the correct approach for trigger-based profile creation