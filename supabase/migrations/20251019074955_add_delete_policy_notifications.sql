/*
  # Add delete policy for notifications
  
  1. Changes
    - Add policy to allow users to delete their own notifications
    - This enables users to manage their notification inbox
    
  2. Security
    - Users can only delete their own notifications
    - RLS ensures data isolation
*/

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);