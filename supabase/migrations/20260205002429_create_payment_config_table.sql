/*
  # Création de la table de configuration des moyens de paiement

  ## Description
  Cette migration crée une table pour stocker la configuration des numéros de compte
  pour chaque moyen de paiement (Wave, Orange Money, MTN Money, etc.).

  ## Tables créées
  - `payment_method_config`: Configuration des moyens de paiement
    - `id`: UUID, clé primaire
    - `payment_method`: Type de moyen de paiement (wave, orange_money, mtn_money, moov_money, cash)
    - `account_number`: Numéro de compte/téléphone
    - `account_name`: Nom du compte
    - `instructions`: Instructions optionnelles pour le client
    - `is_enabled`: Activer/désactiver le moyen de paiement
    - `created_at`: Date de création
    - `updated_at`: Date de mise à jour
    - `updated_by`: ID de l'utilisateur qui a fait la mise à jour

  ## Sécurité
  - RLS activé
  - Seuls les Super Admin peuvent lire et modifier la configuration

  ## Notes importantes
  - Cette configuration est sensible et ne doit être accessible qu'aux Super Admin
  - Les numéros de compte sont utilisés pour recevoir les paiements des abonnements
*/

-- Créer la table de configuration des moyens de paiement
CREATE TABLE IF NOT EXISTS payment_method_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method text NOT NULL UNIQUE CHECK (payment_method IN ('wave', 'orange_money', 'mtn_money', 'moov_money', 'cash')),
  account_number text,
  account_name text,
  instructions text,
  is_enabled boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  updated_by uuid REFERENCES profiles(id)
);

-- Activer RLS
ALTER TABLE payment_method_config ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les Super Admin peuvent lire la configuration
CREATE POLICY "Super Admin peut lire payment_method_config"
  ON payment_method_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Politique: Seuls les Super Admin peuvent insérer
CREATE POLICY "Super Admin peut insérer payment_method_config"
  ON payment_method_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Politique: Seuls les Super Admin peuvent modifier
CREATE POLICY "Super Admin peut modifier payment_method_config"
  ON payment_method_config
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Politique: Seuls les Super Admin peuvent supprimer
CREATE POLICY "Super Admin peut supprimer payment_method_config"
  ON payment_method_config
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Insérer les configurations par défaut
INSERT INTO payment_method_config (payment_method, is_enabled) VALUES
  ('wave', true),
  ('orange_money', true),
  ('mtn_money', true),
  ('moov_money', false),
  ('cash', true)
ON CONFLICT (payment_method) DO NOTHING;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_payment_method_config_payment_method
  ON payment_method_config(payment_method);

CREATE INDEX IF NOT EXISTS idx_payment_method_config_is_enabled
  ON payment_method_config(is_enabled);
