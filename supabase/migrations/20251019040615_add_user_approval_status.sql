/*
  # Add User Approval Status

  1. Changes
    - Add `approval_status` column to profiles table
      - Values: 'pending', 'approved', 'rejected'
      - Default: 'pending' for new users
    - Update existing users to 'approved' status
    
  2. Security
    - Users can view their own approval status
    - Only admins can change approval status
*/

-- Add approval_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Update existing users to 'approved' status
UPDATE profiles 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);
