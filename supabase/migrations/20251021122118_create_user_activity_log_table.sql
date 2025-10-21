/*
  # Create user activity log table

  1. New Tables
    - `user_activity_log`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `activity_type` (text) - Type d'activité (login, order_created, order_accepted, order_delivered, profile_updated, etc.)
      - `activity_description` (text) - Description de l'activité
      - `related_entity_type` (text, nullable) - Type d'entité liée (order, product, profile, etc.)
      - `related_entity_id` (uuid, nullable) - ID de l'entité liée
      - `metadata` (jsonb) - Métadonnées supplémentaires
      - `ip_address` (text, nullable) - Adresse IP de l'utilisateur
      - `user_agent` (text, nullable) - User agent du navigateur
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `user_activity_log` table
    - Add policy for admins to read all activity logs
    - Add policy for users to read their own activity logs

  3. Indexes
    - Add index on user_id for fast queries
    - Add index on created_at for sorting
    - Add index on activity_type for filtering
*/

CREATE TABLE IF NOT EXISTS user_activity_log (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_description text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all activity logs"
  ON user_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.is_approved = true
    )
  );

CREATE POLICY "Users can read own activity logs"
  ON user_activity_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert activity logs"
  ON user_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_related_entity ON user_activity_log(related_entity_type, related_entity_id);
