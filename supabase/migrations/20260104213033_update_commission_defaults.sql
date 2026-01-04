/*
  # Mise à jour des taux de commission par défaut

  1. Modifications
    - Mise à jour des taux de commission dans la table `commission_settings`
    - Client : 8% → 4%
    - Fournisseur : 2% → 1%

  2. Notes
    - Cette migration met à jour les paramètres de commission actifs
    - Les nouvelles valeurs reflètent la politique tarifaire actualisée de RAVITO
*/

-- Mettre à jour les paramètres de commission actifs
UPDATE commission_settings
SET
  client_commission_percentage = 4.0,
  supplier_commission_percentage = 1.0,
  updated_at = now()
WHERE is_active = true;

-- Si aucun paramètre actif n'existe, en créer un nouveau
INSERT INTO commission_settings (
  client_commission_percentage,
  supplier_commission_percentage,
  is_active,
  effective_from
)
SELECT 4.0, 1.0, true, now()
WHERE NOT EXISTS (
  SELECT 1 FROM commission_settings WHERE is_active = true
);
