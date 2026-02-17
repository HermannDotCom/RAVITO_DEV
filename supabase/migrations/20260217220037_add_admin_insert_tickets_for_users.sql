/*
  # Allow admins to create tickets on behalf of users

  ## Changes
  - Adds an INSERT policy on support_tickets for admin users
  - Admins can insert a ticket with any user_id (to contact pending users)

  ## Security
  - Policy restricted to authenticated users with role = 'admin'
*/

CREATE POLICY "Admins can create tickets for users"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
