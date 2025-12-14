/*
  # Fix RLS policies for ticket_messages

  1. Problem
    - Current policies may not properly restrict access to ticket messages
    - Need to ensure users can only see messages from tickets they have access to

  2. Changes
    - Add proper SELECT policy to allow viewing messages only from accessible tickets
    - Add proper INSERT policy to allow adding messages to accessible tickets
    - Ensure admins can see and add messages to all tickets

  3. Security
    - Users can only see messages from their own tickets
    - Admins can see messages from all tickets
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can add messages to tickets" ON ticket_messages;

-- Allow users to view messages from their own tickets
CREATE POLICY "Users can view own ticket messages"
  ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
      AND NOT ticket_messages.is_internal
    )
  );

-- Allow admins to view all ticket messages (including internal notes)
CREATE POLICY "Admins can view all ticket messages"
  ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow users to add messages to their own tickets
CREATE POLICY "Users can add messages to own tickets"
  ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
    AND user_id = auth.uid()
    AND NOT is_internal
  );

-- Allow admins to add messages to all tickets (including internal notes)
CREATE POLICY "Admins can add messages to all tickets"
  ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND user_id = auth.uid()
  );
