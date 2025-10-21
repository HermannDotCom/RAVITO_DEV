/*
  # Système de gestion de tickets de support

  ## Description
  Ce système permet aux clients et fournisseurs de soumettre des tickets de support
  à l'administrateur et de suivre leur traitement.

  ## 1. Nouvelles Tables

  ### `support_tickets`
  Table principale des tickets de support
  - `id` (uuid, primary key) - Identifiant unique du ticket
  - `ticket_number` (text, unique) - Numéro de ticket (ex: TICK-001)
  - `user_id` (uuid, foreign key) - Référence à profiles.id
  - `subject` (text) - Sujet du ticket
  - `message` (text) - Message détaillé
  - `category` (text) - Catégorie (technical, billing, delivery, account, other)
  - `priority` (text) - Priorité (low, medium, high, urgent)
  - `status` (text) - Statut (open, in_progress, waiting_response, resolved, closed)
  - `assigned_to` (uuid, nullable, foreign key) - Admin assigné
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de dernière mise à jour
  - `resolved_at` (timestamptz, nullable) - Date de résolution

  ### `ticket_messages`
  Messages et réponses dans les tickets
  - `id` (uuid, primary key) - Identifiant unique
  - `ticket_id` (uuid, foreign key) - Référence au ticket
  - `user_id` (uuid, foreign key) - Auteur du message
  - `message` (text) - Contenu du message
  - `is_internal` (boolean) - Note interne (visible seulement par admin)
  - `created_at` (timestamptz) - Date de création

  ### `ticket_attachments`
  Pièces jointes des tickets
  - `id` (uuid, primary key) - Identifiant unique
  - `ticket_id` (uuid, foreign key) - Référence au ticket
  - `file_name` (text) - Nom du fichier
  - `file_url` (text) - URL du fichier
  - `file_type` (text) - Type MIME
  - `file_size` (integer) - Taille en octets
  - `uploaded_by` (uuid, foreign key) - Utilisateur qui a uploadé
  - `created_at` (timestamptz) - Date d'upload

  ## 2. Sécurité (RLS)
  - Les utilisateurs peuvent créer leurs propres tickets
  - Les utilisateurs peuvent voir et mettre à jour uniquement leurs tickets
  - Les admins peuvent voir et gérer tous les tickets
  - Les messages internes sont visibles uniquement par les admins

  ## 3. Fonctionnalités
  - Création de tickets avec catégories et priorités
  - Système de numérotation automatique
  - Messages et réponses
  - Notes internes pour les admins
  - Pièces jointes
  - Assignation des tickets aux admins
  - Suivi du statut et historique
*/

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT valid_category CHECK (category IN ('technical', 'billing', 'delivery', 'account', 'other')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed'))
);

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create ticket_attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approval_status = 'approved'
    )
  );

-- Users can create their own tickets
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.approval_status = 'approved'
    )
  );

-- Users can update their own open tickets, admins can update all
CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    (user_id = auth.uid() AND status != 'closed') OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approval_status = 'approved'
    )
  );

-- RLS Policies for ticket_messages

-- Users can view messages in their tickets, admins see all
CREATE POLICY "Users can view ticket messages"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM support_tickets
        WHERE support_tickets.id = ticket_messages.ticket_id
        AND support_tickets.user_id = auth.uid()
      )
      AND NOT ticket_messages.is_internal
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approval_status = 'approved'
    )
  );

-- Users can add messages to their tickets
CREATE POLICY "Users can add messages to tickets"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM support_tickets
        WHERE support_tickets.id = ticket_messages.ticket_id
        AND (support_tickets.user_id = auth.uid() OR 
             EXISTS (
               SELECT 1 FROM profiles
               WHERE profiles.id = auth.uid()
               AND profiles.role = 'admin'
               AND profiles.approval_status = 'approved'
             ))
      )
    )
  );

-- RLS Policies for ticket_attachments

-- Users can view attachments in their tickets
CREATE POLICY "Users can view ticket attachments"
  ON ticket_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_attachments.ticket_id
      AND (
        support_tickets.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
          AND profiles.approval_status = 'approved'
        )
      )
    )
  );

-- Users can add attachments to their tickets
CREATE POLICY "Users can add attachments to tickets"
  ON ticket_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_attachments.ticket_id
      AND (
        support_tickets.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
          AND profiles.approval_status = 'approved'
        )
      )
    )
  );

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number integer;
  new_ticket_number text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 6) AS integer)), 0) + 1
  INTO next_number
  FROM support_tickets;
  
  new_ticket_number := 'TICK-' || LPAD(next_number::text, 5, '0');
  NEW.ticket_number := new_ticket_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
DROP TRIGGER IF EXISTS trigger_generate_ticket_number ON support_tickets;
CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION generate_ticket_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_ticket_timestamp ON support_tickets;
CREATE TRIGGER trigger_update_ticket_timestamp
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamp();

-- Enable realtime for ticket updates
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_messages;
