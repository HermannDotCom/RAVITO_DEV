/*
  # Uniformisation de l'accès aux données pour les membres d'organisation

  1. Problème
    Les membres d'équipe ne voient pas les mêmes données que le propriétaire sur les pages qui leur sont affectées.
    Les policies RLS utilisent auth.uid() au lieu de vérifier l'appartenance à l'organisation.
    
  2. Solution
    Mise à jour de toutes les policies RLS pour utiliser les fonctions helper:
    - get_user_org_owner_id() - Retourne l'ID du propriétaire de l'organisation
    - user_has_org_access(target_user_id) - Vérifie l'accès aux données d'un utilisateur
    
  3. Tables mises à jour
    - zone_registration_requests (demandes de zones)
    - transfers (trésorerie/historique)
    - support_tickets, ticket_messages, ticket_attachments (support)
    - user_activity_log (historique)
    - notifications (notifications)
    - ratings (évaluations)
    - supplier_price_grids, supplier_price_grid_history (produits vendus)
    - profiles (profils)
    
  4. Principe
    Un membre doit avoir accès aux mêmes données que le propriétaire de son organisation
    sur les pages qui lui sont affectées.
*/

-- ============================================
-- ZONE_REGISTRATION_REQUESTS
-- ============================================

DROP POLICY IF EXISTS "Suppliers can view own requests" ON zone_registration_requests;
DROP POLICY IF EXISTS "Suppliers can delete own pending requests" ON zone_registration_requests;
DROP POLICY IF EXISTS "Suppliers can create requests" ON zone_registration_requests;

CREATE POLICY "Suppliers can view org requests"
ON zone_registration_requests FOR SELECT
TO authenticated
USING (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
  OR is_admin()
);

CREATE POLICY "Suppliers can create requests for org"
ON zone_registration_requests FOR INSERT
TO authenticated
WITH CHECK (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
);

CREATE POLICY "Suppliers can delete org pending requests"
ON zone_registration_requests FOR DELETE
TO authenticated
USING (
  (supplier_id = auth.uid() OR user_has_org_access(supplier_id))
  AND status = 'pending'
);

-- ============================================
-- TRANSFERS
-- ============================================

DROP POLICY IF EXISTS "transfers_select_all" ON transfers;

CREATE POLICY "transfers_select_all"
ON transfers FOR SELECT
TO authenticated
USING (
  is_admin()
  OR supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
);

-- ============================================
-- SUPPORT_TICKETS
-- ============================================

DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON support_tickets;

CREATE POLICY "Users can view org tickets"
ON support_tickets FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR user_has_org_access(user_id)
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can update org tickets"
ON support_tickets FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR user_has_org_access(user_id)
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR user_has_org_access(user_id)
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- TICKET_MESSAGES
-- ============================================

DROP POLICY IF EXISTS "Users can view own ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can add messages to own tickets" ON ticket_messages;

CREATE POLICY "Users can view org ticket messages"
ON ticket_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_messages.ticket_id
    AND (
      support_tickets.user_id = auth.uid()
      OR user_has_org_access(support_tickets.user_id)
    )
    AND NOT ticket_messages.is_internal
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can add messages to org tickets"
ON ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_messages.ticket_id
    AND (
      support_tickets.user_id = auth.uid()
      OR user_has_org_access(support_tickets.user_id)
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- TICKET_ATTACHMENTS
-- ============================================

DROP POLICY IF EXISTS "Users can view own ticket attachments" ON ticket_attachments;
DROP POLICY IF EXISTS "Users can upload attachments to own tickets" ON ticket_attachments;
DROP POLICY IF EXISTS "Users can delete own ticket attachments" ON ticket_attachments;

CREATE POLICY "Users can view org ticket attachments"
ON ticket_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_attachments.ticket_id
    AND (
      support_tickets.user_id = auth.uid()
      OR user_has_org_access(support_tickets.user_id)
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can upload attachments to org tickets"
ON ticket_attachments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_attachments.ticket_id
    AND (
      support_tickets.user_id = auth.uid()
      OR user_has_org_access(support_tickets.user_id)
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can delete org ticket attachments"
ON ticket_attachments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = ticket_attachments.ticket_id
    AND (
      support_tickets.user_id = auth.uid()
      OR user_has_org_access(support_tickets.user_id)
    )
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- USER_ACTIVITY_LOG
-- ============================================

DROP POLICY IF EXISTS "Users can view own activity log" ON user_activity_log;

CREATE POLICY "Users can view org activity log"
ON user_activity_log FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR user_has_org_access(user_id)
  OR is_admin()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can view org notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR user_has_org_access(user_id)
);

CREATE POLICY "Users can update org notifications"
ON notifications FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR user_has_org_access(user_id)
)
WITH CHECK (
  user_id = auth.uid()
  OR user_has_org_access(user_id)
);

CREATE POLICY "Users can delete org notifications"
ON notifications FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR user_has_org_access(user_id)
);

-- ============================================
-- RATINGS
-- ============================================

DROP POLICY IF EXISTS "Users can view ratings for their orders" ON ratings;
DROP POLICY IF EXISTS "Users can insert ratings for completed orders" ON ratings;
DROP POLICY IF EXISTS "Users can update own pending ratings" ON ratings;

CREATE POLICY "Users can view org ratings"
ON ratings FOR SELECT
TO authenticated
USING (
  from_user_id = auth.uid()
  OR user_has_org_access(from_user_id)
  OR to_user_id = auth.uid()
  OR user_has_org_access(to_user_id)
);

CREATE POLICY "Users can insert org ratings"
ON ratings FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id = auth.uid()
  OR user_has_org_access(from_user_id)
);

CREATE POLICY "Users can update org ratings"
ON ratings FOR UPDATE
TO authenticated
USING (
  from_user_id = auth.uid()
  OR user_has_org_access(from_user_id)
)
WITH CHECK (
  from_user_id = auth.uid()
  OR user_has_org_access(from_user_id)
);

-- ============================================
-- SUPPLIER_PRICE_GRIDS
-- ============================================

DROP POLICY IF EXISTS "Suppliers can view own price grids" ON supplier_price_grids;
DROP POLICY IF EXISTS "Suppliers can manage own price grids" ON supplier_price_grids;

CREATE POLICY "Suppliers can view org price grids"
ON supplier_price_grids FOR SELECT
TO authenticated
USING (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
  OR is_admin()
);

CREATE POLICY "Suppliers can insert org price grids"
ON supplier_price_grids FOR INSERT
TO authenticated
WITH CHECK (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
);

CREATE POLICY "Suppliers can update org price grids"
ON supplier_price_grids FOR UPDATE
TO authenticated
USING (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
)
WITH CHECK (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
);

CREATE POLICY "Suppliers can delete org price grids"
ON supplier_price_grids FOR DELETE
TO authenticated
USING (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
);

-- ============================================
-- SUPPLIER_PRICE_GRID_HISTORY
-- ============================================

DROP POLICY IF EXISTS "Suppliers can view own price history" ON supplier_price_grid_history;

CREATE POLICY "Suppliers can view org price history"
ON supplier_price_grid_history FOR SELECT
TO authenticated
USING (
  supplier_id = auth.uid()
  OR user_has_org_access(supplier_id)
  OR is_admin()
);

-- ============================================
-- PROFILES (lecture uniquement pour les membres)
-- ============================================

-- Les membres doivent pouvoir voir les profils de leur organisation
-- pour afficher correctement les informations dans l'interface

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view org profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR user_has_org_access(id)
  OR is_admin()
);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON POLICY "Suppliers can view org requests" ON zone_registration_requests IS 
'Les membres d''organisation peuvent voir toutes les demandes de zones de leur organisation';

COMMENT ON POLICY "transfers_select_all" ON transfers IS 
'Les membres d''organisation peuvent voir tous les transferts de leur organisation';

COMMENT ON POLICY "Users can view org tickets" ON support_tickets IS 
'Les membres d''organisation peuvent voir tous les tickets de support de leur organisation';

COMMENT ON POLICY "Users can view org activity log" ON user_activity_log IS 
'Les membres d''organisation peuvent voir les logs d''activité de leur organisation';

COMMENT ON POLICY "Users can view org notifications" ON notifications IS 
'Les membres d''organisation peuvent voir les notifications de leur organisation';

COMMENT ON POLICY "Users can view org ratings" ON ratings IS 
'Les membres d''organisation peuvent voir les évaluations de leur organisation';

COMMENT ON POLICY "Suppliers can view org price grids" ON supplier_price_grids IS 
'Les membres d''organisation peuvent voir les grilles de prix de leur organisation';

COMMENT ON POLICY "Users can view org profiles" ON profiles IS 
'Les membres d''organisation peuvent voir les profils de leur organisation';
