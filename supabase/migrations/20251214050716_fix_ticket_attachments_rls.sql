/*
  # Fix RLS policies for ticket_attachments

  1. Problem
    - Current policies may not properly restrict access to ticket attachments
    - Need to ensure users can only see attachments from tickets they have access to

  2. Changes
    - Add proper SELECT policy to allow viewing attachments only from accessible tickets
    - Add proper INSERT policy to allow adding attachments to accessible tickets
    - Ensure admins can see and add attachments to all tickets

  3. Security
    - Users can only see attachments from their own tickets
    - Admins can see attachments from all tickets
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view ticket attachments" ON ticket_attachments;
DROP POLICY IF EXISTS "Users can add attachments to tickets" ON ticket_attachments;

-- Allow users to view attachments from their own tickets
CREATE POLICY "Users can view own ticket attachments"
  ON ticket_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_attachments.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Allow admins to view all ticket attachments
CREATE POLICY "Admins can view all ticket attachments"
  ON ticket_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow users to add attachments to their own tickets
CREATE POLICY "Users can add attachments to own tickets"
  ON ticket_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_attachments.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Allow admins to add attachments to all tickets
CREATE POLICY "Admins can add attachments to all tickets"
  ON ticket_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND uploaded_by = auth.uid()
  );
