/*
  # Fix internal ticket notes visibility for non-admin users

  ## Problem
  The existing RLS policy on ticket_messages had a logic flaw:
  The USING clause combined user access check (with is_internal filter) with an admin check
  using OR at the top level. For org members, user_has_org_access() could return TRUE,
  but the is_internal filter was scoped only inside the subquery EXISTS check, making
  internal notes potentially visible to non-admin users.

  ## Solution
  - Drop the old combined policy
  - Create a clean, strictly separated policy for non-admin users that ALWAYS filters
    is_internal = false
  - The admin policy remains separate (admins can see all messages including internal ones)

  ## Changes
  - Drop "Users can view org ticket messages" policy
  - Recreate it with a strictly enforced is_internal = false filter for non-admins
*/

DROP POLICY IF EXISTS "Users can view org ticket messages" ON ticket_messages;

CREATE POLICY "Users can view non-internal ticket messages"
  ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    is_internal = false
    AND (
      EXISTS (
        SELECT 1 FROM support_tickets st
        WHERE st.id = ticket_messages.ticket_id
          AND (
            st.user_id = auth.uid()
            OR user_has_org_access(st.user_id)
          )
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
