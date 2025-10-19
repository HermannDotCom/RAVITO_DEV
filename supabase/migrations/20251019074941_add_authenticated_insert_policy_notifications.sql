/*
  # Add policy for authenticated users to insert notifications
  
  1. Changes
    - Add policy to allow authenticated users to insert notifications
    - This is needed for admins to create notifications when approving/rejecting accounts or zones
    
  2. Security
    - Only authenticated users can create notifications
    - This is safe because admins create notifications for specific users
*/

-- Policy: Authenticated users can insert notifications
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);