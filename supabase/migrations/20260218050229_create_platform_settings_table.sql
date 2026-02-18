/*
  # Création de la table platform_settings

  ## Objectif
  Permettre à l'administrateur d'activer ou désactiver la page "Mode Opératoire"
  pour chaque type d'interface (client, fournisseur, admin) depuis les Paramètres Système.

  ## Nouvelle table
  - `platform_settings`
    - `id` (uuid, PK)
    - `key` (text, unique) — identifiant du paramètre, ex: 'guide_client_enabled'
    - `value` (boolean) — valeur du toggle
    - `label` (text) — libellé lisible
    - `updated_at` (timestamptz) — dernière modification
    - `updated_by` (uuid, FK auth.users) — admin ayant fait la modification

  ## Données initiales
  Les trois toggles Mode Opératoire sont activés par défaut.

  ## Sécurité
  - RLS activé
  - Lecture autorisée à tous les utilisateurs authentifiés (pour que le Sidebar puisse lire)
  - Écriture réservée aux admins (via la colonne role du profil)
*/

CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value boolean NOT NULL DEFAULT true,
  label text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read platform settings"
  ON platform_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update platform settings"
  ON platform_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert platform settings"
  ON platform_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

INSERT INTO platform_settings (key, value, label) VALUES
  ('guide_client_enabled',   true, 'Mode Opératoire — Interface Client'),
  ('guide_supplier_enabled', true, 'Mode Opératoire — Interface Fournisseur'),
  ('guide_admin_enabled',    true, 'Mode Opératoire — Interface Admin')
ON CONFLICT (key) DO NOTHING;
