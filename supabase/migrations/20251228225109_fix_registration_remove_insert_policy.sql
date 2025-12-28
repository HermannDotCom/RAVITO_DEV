/*
  # Fix Registration - Remove Conflicting INSERT Policy
  
  ## Problem
  - The INSERT policy "System can insert profiles" requires auth.uid() = id
  - During signup, auth.uid() is NULL, blocking profile creation
  - The trigger with SECURITY DEFINER should bypass RLS entirely
  
  ## Solution
  - Remove the INSERT policy completely
  - Let the trigger with SECURITY DEFINER handle all profile creation
  
  ## Security
  - Users cannot directly INSERT into profiles (no INSERT policy)
  - Only the system trigger can create profiles
  - This is the correct security model
*/

-- Drop the conflicting INSERT policy
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow system to insert profiles" ON profiles;

-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE profiles IS 
  'User profiles. Created automatically via trigger on auth.users. Users cannot directly insert profiles.';
