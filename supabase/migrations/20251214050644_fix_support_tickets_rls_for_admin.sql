/*
  # Fix RLS policies for support_tickets to allow admin access

  1. Problem
    - Current RLS policies only allow users to see/modify their own tickets (user_id = auth.uid())
    - Admins cannot see or manage any tickets created by other users
    - This causes tickets to appear/disappear inconsistently

  2. Changes
    - Add SELECT policy for admins to view all tickets
    - Add UPDATE policy for admins to manage all tickets
    - Add DELETE policy for admins to delete tickets if needed
    - Keep existing policies for regular users

  3. Security
    - Regular users can only see and modify their own tickets
    - Admins can see and manage all tickets
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;

-- Allow users to view their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to view all tickets
CREATE POLICY "Admins can view all tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow users to create their own tickets
CREATE POLICY "Users can create tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own tickets (e.g., close, add info)
CREATE POLICY "Users can update own tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow admins to update all tickets (status, assignment, etc.)
CREATE POLICY "Admins can update all tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to delete tickets if needed
CREATE POLICY "Admins can delete tickets"
  ON support_tickets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
