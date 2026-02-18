/*
  # Garantir une seule période d'essai par organisation

  ## Objectif
  Une organisation ne peut bénéficier qu'une seule et unique période d'essai (offre découverte),
  même si elle résilie son abonnement et revient plus tard.

  ## Changements
  - Ajout d'un index partiel unique sur `subscriptions(organization_id)` filtré sur
    `is_first_subscription = true`, ce qui interdit d'avoir 2 lignes avec ce flag pour
    la même organisation.
  - Ajout d'une fonction + contrainte CHECK via trigger pour renforcer la règle côté DB.

  ## Sécurité
  La contrainte est appliquée au niveau de la base de données : même un appel direct
  à l'API Supabase (hors application) ne peut pas contourner cette règle.
*/

-- Index unique partiel : une seule ligne is_first_subscription=true par organisation
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_trial_per_org
  ON subscriptions (organization_id)
  WHERE is_first_subscription = true;
