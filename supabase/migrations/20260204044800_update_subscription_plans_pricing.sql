/*
  # Mise à jour des tarifs et ajout des mois offerts
  
  Modifications:
  1. Ajouter la colonne free_months pour stocker le nombre de mois offerts
  2. Mettre à jour le prix du plan annuel à 48000 FCFA (au lieu de 50000)
  3. Mettre à jour les descriptions et features pour refléter les vraies économies
  4. Définir le nombre de mois offerts: Mensuel=0, Semestriel=1, Annuel=4
*/

-- Ajouter la colonne free_months
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS free_months integer DEFAULT 0 CHECK (free_months >= 0);

-- Mettre à jour les plans existants avec le nouveau prix et les mois offerts
UPDATE subscription_plans 
SET 
  price = 48000,
  free_months = 4,
  description = 'Abonnement annuel à Ravito Gestion - 4 mois offerts',
  features = '["Gestion complète des activités", "Suivi des stocks", "Gestion des emballages", "Gestion des crédits clients", "Rapports et exports PDF/Excel", "Support VIP dédié", "Formation incluse", "4 mois offerts sur l''année"]'::jsonb
WHERE billing_cycle = 'annually';

UPDATE subscription_plans 
SET 
  free_months = 1,
  description = 'Abonnement semestriel à Ravito Gestion - 1 mois offert',
  features = '["Gestion complète des activités", "Suivi des stocks", "Gestion des emballages", "Gestion des crédits clients", "Rapports et exports PDF/Excel", "Support prioritaire", "1 mois offert sur le semestre"]'::jsonb
WHERE billing_cycle = 'semesterly';

UPDATE subscription_plans 
SET 
  free_months = 0,
  description = 'Abonnement mensuel à Ravito Gestion - Facturation au prorata le premier mois'
WHERE billing_cycle = 'monthly';

-- Vérification des mises à jour
COMMENT ON COLUMN subscription_plans.free_months IS 'Nombre de mois offerts sur la période (0 pour mensuel, 1 pour semestriel, 4 pour annuel)';
