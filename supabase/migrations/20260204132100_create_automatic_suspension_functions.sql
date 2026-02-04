-- Fonction PostgreSQL pour la suspension automatique des abonnements en retard
-- Cette fonction sera appelée quotidiennement par un cron job ou Edge Function

CREATE OR REPLACE FUNCTION check_and_suspend_overdue_subscriptions()
RETURNS TABLE (
  subscription_id uuid,
  organization_id uuid,
  action_taken text
) AS $$
DECLARE
  v_subscription_record RECORD;
  v_has_valid_payment boolean;
BEGIN
  -- Parcourir tous les abonnements actifs ou en essai dont la période est expirée
  FOR v_subscription_record IN
    SELECT 
      s.id,
      s.organization_id,
      s.status,
      s.current_period_end,
      s.trial_end_date
    FROM subscriptions s
    WHERE 
      s.status IN ('trial', 'active', 'pending_payment')
      AND (
        -- La période d'essai est terminée
        (s.status = 'trial' AND s.trial_end_date < NOW())
        OR
        -- La période de facturation est terminée
        (s.status IN ('active', 'pending_payment') AND s.current_period_end < NOW())
      )
  LOOP
    -- Vérifier s'il y a une facture payée couvrant la période actuelle ou future
    SELECT EXISTS (
      SELECT 1 
      FROM subscription_invoices 
      WHERE 
        subscription_id = v_subscription_record.id
        AND status = 'paid'
        AND period_end >= COALESCE(v_subscription_record.current_period_end, v_subscription_record.trial_end_date)
    ) INTO v_has_valid_payment;
    
    -- Si aucun paiement valide, suspendre l'abonnement
    IF NOT v_has_valid_payment THEN
      UPDATE subscriptions
      SET 
        status = 'suspended',
        suspended_at = NOW(),
        updated_at = NOW()
      WHERE id = v_subscription_record.id;
      
      -- Retourner l'information de l'action effectuée
      subscription_id := v_subscription_record.id;
      organization_id := v_subscription_record.organization_id;
      action_taken := 'suspended';
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour la documentation
COMMENT ON FUNCTION check_and_suspend_overdue_subscriptions() IS 
'Vérifie et suspend automatiquement les abonnements dont la période est expirée et qui n''ont pas de paiement valide. À appeler quotidiennement via cron job.';

-- Créer une fonction pour vérifier les factures en retard
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS TABLE (
  invoice_id uuid,
  invoice_number text,
  action_taken text
) AS $$
BEGIN
  RETURN QUERY
  UPDATE subscription_invoices
  SET 
    status = 'overdue',
    updated_at = NOW()
  WHERE 
    status = 'pending'
    AND due_date < NOW()
    AND amount_paid < amount_due
  RETURNING 
    id as invoice_id,
    invoice_number,
    'marked_overdue' as action_taken;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_overdue_invoices() IS 
'Marque les factures en attente comme en retard si la date d''échéance est dépassée. À appeler quotidiennement via cron job.';

-- Créer une vue pour les abonnements nécessitant une action
CREATE OR REPLACE VIEW subscriptions_requiring_action AS
SELECT 
  s.id as subscription_id,
  s.organization_id,
  s.status,
  s.trial_end_date,
  s.current_period_end,
  CASE
    WHEN s.status = 'trial' AND s.trial_end_date < NOW() 
      THEN 'Trial expired - payment required'
    WHEN s.status = 'active' AND s.current_period_end < NOW() 
      THEN 'Billing period ended - renewal required'
    WHEN s.status = 'pending_payment' AND s.current_period_end < NOW() 
      THEN 'Payment overdue - suspension imminent'
    ELSE 'Unknown'
  END as action_required,
  (
    SELECT COUNT(*)
    FROM subscription_invoices si
    WHERE si.subscription_id = s.id
      AND si.status IN ('pending', 'overdue')
  ) as unpaid_invoices_count,
  (
    SELECT COALESCE(SUM(si.amount_due - COALESCE(si.amount_paid, 0)), 0)
    FROM subscription_invoices si
    WHERE si.subscription_id = s.id
      AND si.status IN ('pending', 'overdue')
  ) as total_unpaid_amount
FROM subscriptions s
WHERE 
  s.status IN ('trial', 'active', 'pending_payment')
  AND (
    (s.status = 'trial' AND s.trial_end_date < NOW())
    OR
    (s.status IN ('active', 'pending_payment') AND s.current_period_end < NOW())
  );

COMMENT ON VIEW subscriptions_requiring_action IS 
'Vue listant tous les abonnements nécessitant une action (paiement, renouvellement, etc.)';
