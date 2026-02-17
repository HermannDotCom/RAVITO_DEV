/*
  # Correction de l'abonnement Maquis RAMA - Période semestrielle incorrecte

  1. Problème
    - Abonnement semestriel avec période allant jusqu'au 31 décembre au lieu du 30 juin
    - Montant de 41233 FCFA au lieu de 19667 FCFA
    - 301 jours au lieu de 118 jours

  2. Cause
    - Erreur dans le calcul de la fin de période semestrielle
    - La période doit finir au 30 juin (semestre 1) ou 31 décembre (semestre 2)
    - Fin d'essai = 5 mars → doit aller jusqu'au 30 juin (fin du semestre en cours)

  3. Solution
    - Corriger l'abonnement avec les bonnes valeurs
    - Corriger la facture associée avec le bon montant
*/

-- Corriger l'abonnement Maquis RAMA
UPDATE subscriptions
SET
  current_period_end = make_timestamptz(2026, 6, 30, 23, 59, 59, 'UTC'),
  next_billing_date = '2026-06-30',
  prorata_days = 118,
  amount_due = 19667
WHERE id = '73267254-a4e2-471a-a942-ba8af224b726';

-- Corriger la facture associée (si elle existe et n'est pas encore payée)
UPDATE subscription_invoices
SET
  amount = 19667,
  amount_due = 19667,
  prorata_amount = 19667,
  days_calculated = 118,
  period_end = '2026-06-30',
  due_date = '2026-06-30'
WHERE subscription_id = '73267254-a4e2-471a-a942-ba8af224b726'
AND status IN ('pending', 'overdue');

-- Log de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Abonnement Maquis RAMA corrigé:';
  RAISE NOTICE '  - Période: jusqu''au 30 juin 2026 (au lieu du 31 décembre)';
  RAISE NOTICE '  - Jours: 118 (au lieu de 301)';
  RAISE NOTICE '  - Montant: 19667 FCFA (au lieu de 41233 FCFA)';
END $$;
