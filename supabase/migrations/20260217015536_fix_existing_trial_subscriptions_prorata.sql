/*
  # Correction des abonnements en période d'essai - Calcul du prorata

  1. Problème
    - Les abonnements créés sans informations de prorata (amount_due = 0, is_prorata = false)
    - Pas de facture générée à la création
    - Pas d'informations sur le montant à payer après l'essai

  2. Solution
    - Calculer le prorata pour tous les abonnements en trial
    - Créer les factures manquantes
    - Mettre à jour les champs is_prorata, prorata_days, amount_due, current_period_start, current_period_end, next_billing_date

  3. Logique de calcul
    - Période d'essai : 30 jours après la date de souscription
    - Prorata : du dernier jour d'essai jusqu'à la fin de la période calendaire
    - Montant = (prix du plan × jours restants) / jours dans le cycle
*/

-- Fonction temporaire pour calculer la fin de période
CREATE OR REPLACE FUNCTION temp_calculate_period_end(start_date timestamptz, billing_cycle text)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
  period_end timestamptz;
BEGIN
  CASE billing_cycle
    WHEN 'monthly' THEN
      period_end := (date_trunc('month', start_date) + interval '1 month' - interval '1 day')::timestamptz;
      period_end := period_end + interval '23 hours 59 minutes 59 seconds';
    WHEN 'semesterly' THEN
      IF EXTRACT(MONTH FROM start_date) <= 6 THEN
        period_end := make_timestamptz(EXTRACT(YEAR FROM start_date)::integer, 6, 30, 23, 59, 59, 'UTC');
      ELSE
        period_end := make_timestamptz(EXTRACT(YEAR FROM start_date)::integer, 12, 31, 23, 59, 59, 'UTC');
      END IF;
    WHEN 'annually' THEN
      period_end := make_timestamptz(EXTRACT(YEAR FROM start_date)::integer, 12, 31, 23, 59, 59, 'UTC');
    ELSE
      RAISE EXCEPTION 'Invalid billing cycle: %', billing_cycle;
  END CASE;
  
  RETURN period_end;
END;
$$;

-- Mettre à jour tous les abonnements en trial qui n'ont pas de prorata
DO $$
DECLARE
  sub_record RECORD;
  v_trial_end_date timestamptz;
  v_period_end_date timestamptz;
  v_days_remaining integer;
  v_prorata_amount numeric;
  v_invoice_num text;
  v_existing_invoice_id uuid;
BEGIN
  FOR sub_record IN 
    SELECT 
      s.id,
      s.organization_id,
      s.trial_end_date,
      sp.id as plan_id,
      sp.price,
      sp.billing_cycle,
      sp.days_in_cycle
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.status = 'trial'
    AND (s.is_prorata IS NULL OR s.is_prorata = false)
    AND s.trial_end_date IS NOT NULL
  LOOP
    -- Calculer la fin de période après l'essai
    v_trial_end_date := sub_record.trial_end_date;
    v_period_end_date := temp_calculate_period_end(v_trial_end_date, sub_record.billing_cycle);
    
    -- Calculer les jours restants
    v_days_remaining := CEIL(EXTRACT(EPOCH FROM (v_period_end_date - v_trial_end_date)) / 86400);
    
    -- Calculer le montant prorata
    v_prorata_amount := ROUND((sub_record.price * v_days_remaining) / sub_record.days_in_cycle);
    
    -- Vérifier si une facture existe déjà
    SELECT id INTO v_existing_invoice_id
    FROM subscription_invoices
    WHERE subscription_id = sub_record.id
    AND status = 'pending'
    LIMIT 1;
    
    -- Si pas de facture, en créer une
    IF v_existing_invoice_id IS NULL THEN
      -- Générer un numéro de facture
      SELECT generate_invoice_number() INTO v_invoice_num;
      
      -- Créer la facture
      INSERT INTO subscription_invoices (
        subscription_id,
        organization_id,
        invoice_number,
        amount,
        amount_due,
        prorata_amount,
        days_calculated,
        is_prorata,
        period_start,
        period_end,
        due_date,
        status
      ) VALUES (
        sub_record.id,
        sub_record.organization_id,
        v_invoice_num,
        v_prorata_amount,
        v_prorata_amount,
        v_prorata_amount,
        v_days_remaining,
        true,
        v_trial_end_date::date,
        v_period_end_date::date,
        v_period_end_date::date,
        'pending'
      );
      
      RAISE NOTICE 'Facture créée pour abonnement %: % FCFA (% jours)', sub_record.id, v_prorata_amount, v_days_remaining;
    ELSE
      RAISE NOTICE 'Facture existe déjà pour abonnement %', sub_record.id;
    END IF;
    
    -- Mettre à jour l'abonnement
    UPDATE subscriptions
    SET
      is_prorata = true,
      prorata_days = v_days_remaining,
      amount_due = v_prorata_amount,
      current_period_start = v_trial_end_date,
      current_period_end = v_period_end_date,
      next_billing_date = v_period_end_date::date
    WHERE id = sub_record.id;
    
    RAISE NOTICE 'Abonnement mis à jour: % - % FCFA pour % jours', sub_record.id, v_prorata_amount, v_days_remaining;
  END LOOP;
END $$;

-- Supprimer la fonction temporaire
DROP FUNCTION IF EXISTS temp_calculate_period_end;

-- Log final
DO $$
BEGIN
  RAISE NOTICE 'Migration fix_existing_trial_subscriptions_prorata terminée';
  RAISE NOTICE 'Tous les abonnements en trial ont été mis à jour avec les informations de prorata';
END $$;
