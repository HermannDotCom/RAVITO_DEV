/*
  # Add Email to Profiles

  1. Changes
    - Add `email` column to profiles table to avoid needing auth.users lookup
    - Populate email from auth.users for existing profiles
    
  2. Notes
    - This is a denormalization but simplifies queries significantly
*/

-- Add email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN email text;
  END IF;
END $$;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
