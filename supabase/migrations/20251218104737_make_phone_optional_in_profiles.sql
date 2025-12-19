/*
  # Make phone column optional in profiles table

  1. Problem
    - The phone field is required (NOT NULL) in profiles table
    - While phone is collected in Step 1, we want to make the trigger more resilient
    - This ensures registration can succeed even if metadata is incomplete

  2. Solution
    - Make the phone column nullable
    - The application will still require phone during registration
    - But the database trigger won't fail if phone is missing from metadata

  3. Changes
    - ALTER TABLE profiles to make phone nullable
*/

-- Make phone column nullable
ALTER TABLE profiles 
ALTER COLUMN phone DROP NOT NULL;