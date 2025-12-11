/*
  # Fix Security Issues - Part 6: Optimize RLS for Notifications and Support System
  
  Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row
*/

-- NOTIFICATIONS TABLE
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- SUPPORT_TICKETS TABLE
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own tickets" ON support_tickets;
CREATE POLICY "Users can update own tickets" ON support_tickets
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

-- TICKET_MESSAGES TABLE
DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
CREATE POLICY "Users can view ticket messages" ON ticket_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = ticket_messages.ticket_id 
      AND support_tickets.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can add messages to tickets" ON ticket_messages;
CREATE POLICY "Users can add messages to tickets" ON ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- TICKET_ATTACHMENTS TABLE
DROP POLICY IF EXISTS "Users can view ticket attachments" ON ticket_attachments;
CREATE POLICY "Users can view ticket attachments" ON ticket_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = ticket_attachments.ticket_id 
      AND support_tickets.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can add attachments to tickets" ON ticket_attachments;
CREATE POLICY "Users can add attachments to tickets" ON ticket_attachments
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = (select auth.uid()));

-- ZONE_REGISTRATION_REQUESTS TABLE
DROP POLICY IF EXISTS "Suppliers can view own requests" ON zone_registration_requests;
CREATE POLICY "Suppliers can view own requests" ON zone_registration_requests
  FOR SELECT TO authenticated
  USING (supplier_id = (select auth.uid()));

DROP POLICY IF EXISTS "Suppliers can create requests" ON zone_registration_requests;
CREATE POLICY "Suppliers can create requests" ON zone_registration_requests
  FOR INSERT TO authenticated
  WITH CHECK (supplier_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update requests" ON zone_registration_requests;
CREATE POLICY "Admins can update requests" ON zone_registration_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Suppliers can delete own pending requests" ON zone_registration_requests;
CREATE POLICY "Suppliers can delete own pending requests" ON zone_registration_requests
  FOR DELETE TO authenticated
  USING (
    supplier_id = (select auth.uid()) 
    AND status = 'pending'
  );

-- USER_ACTIVITY_LOG TABLE
DROP POLICY IF EXISTS "Admins can read all activity logs" ON user_activity_log;
CREATE POLICY "Admins can read all activity logs" ON user_activity_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can read own activity logs" ON user_activity_log;
CREATE POLICY "Users can read own activity logs" ON user_activity_log
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON user_activity_log;
CREATE POLICY "Authenticated users can insert activity logs" ON user_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- PAYMENT_METHODS TABLE (uses profile_id, not user_id)
DROP POLICY IF EXISTS "Users can add own payment methods" ON payment_methods;
CREATE POLICY "Users can add own payment methods" ON payment_methods
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));