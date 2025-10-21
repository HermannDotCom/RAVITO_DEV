/*
  # Système de demandes d'inscription aux zones de livraison

  ## Description
  Ce système permet aux fournisseurs de demander l'inscription à des zones de livraison
  et aux admins de gérer ces demandes (accepter/refuser).

  ## 1. Nouvelle Table

  ### `zone_registration_requests`
  Table des demandes d'inscription aux zones
  - `id` (uuid, primary key) - Identifiant unique
  - `zone_id` (uuid, foreign key) - Référence à zones.id
  - `supplier_id` (uuid, foreign key) - Référence à profiles.id
  - `status` (text) - Statut (pending, approved, rejected)
  - `message` (text, nullable) - Message du fournisseur
  - `admin_response` (text, nullable) - Réponse de l'admin
  - `reviewed_by` (uuid, nullable, foreign key) - Admin qui a traité la demande
  - `reviewed_at` (timestamptz, nullable) - Date de traitement
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de dernière mise à jour

  ## 2. Sécurité (RLS)
  - Les fournisseurs peuvent créer des demandes pour eux-mêmes
  - Les fournisseurs peuvent voir leurs propres demandes
  - Les admins peuvent voir et gérer toutes les demandes

  ## 3. Fonctionnalités
  - Création de demandes par les fournisseurs
  - Notification automatique aux admins
  - Badge de notification sur les zones avec demandes en attente
  - Acceptation/refus par les admins
  - Historique des demandes
*/

-- Create zone_registration_requests table
CREATE TABLE IF NOT EXISTS zone_registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES zones(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  admin_response text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT unique_pending_request UNIQUE (zone_id, supplier_id, status)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_zone_registration_requests_zone_id ON zone_registration_requests(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_registration_requests_supplier_id ON zone_registration_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_zone_registration_requests_status ON zone_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_zone_registration_requests_created_at ON zone_registration_requests(created_at DESC);

-- Enable RLS
ALTER TABLE zone_registration_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zone_registration_requests

-- Suppliers can view their own requests
CREATE POLICY "Suppliers can view own requests"
  ON zone_registration_requests FOR SELECT
  TO authenticated
  USING (
    supplier_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approval_status = 'approved'
    )
  );

-- Suppliers can create their own requests
CREATE POLICY "Suppliers can create requests"
  ON zone_registration_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    supplier_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
      AND profiles.approval_status = 'approved'
    )
  );

-- Admins can update all requests
CREATE POLICY "Admins can update requests"
  ON zone_registration_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.approval_status = 'approved'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_zone_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_zone_request_timestamp ON zone_registration_requests;
CREATE TRIGGER trigger_update_zone_request_timestamp
  BEFORE UPDATE ON zone_registration_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_request_timestamp();

-- Function to notify admins when a new request is created
CREATE OR REPLACE FUNCTION notify_admins_new_zone_request()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  zone_name text;
  supplier_name text;
BEGIN
  -- Get zone name
  SELECT name INTO zone_name FROM zones WHERE id = NEW.zone_id;
  
  -- Get supplier name
  SELECT name INTO supplier_name FROM profiles WHERE id = NEW.supplier_id;
  
  -- Notify all admins
  FOR admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin' AND approval_status = 'approved'
  LOOP
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      admin_record.id,
      'zone_registration_request',
      'Nouvelle demande d''inscription',
      supplier_name || ' souhaite s''inscrire à la zone "' || zone_name || '"',
      jsonb_build_object(
        'request_id', NEW.id,
        'zone_id', NEW.zone_id,
        'supplier_id', NEW.supplier_id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify admins on new request
DROP TRIGGER IF EXISTS trigger_notify_admins_new_zone_request ON zone_registration_requests;
CREATE TRIGGER trigger_notify_admins_new_zone_request
  AFTER INSERT ON zone_registration_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_admins_new_zone_request();

-- Function to notify supplier when request is reviewed
CREATE OR REPLACE FUNCTION notify_supplier_request_reviewed()
RETURNS TRIGGER AS $$
DECLARE
  zone_name text;
  status_text text;
BEGIN
  -- Only notify when status changes from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    -- Get zone name
    SELECT name INTO zone_name FROM zones WHERE id = NEW.zone_id;
    
    -- Set status text
    IF NEW.status = 'approved' THEN
      status_text := 'approuvée';
    ELSE
      status_text := 'refusée';
    END IF;
    
    -- Notify supplier
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.supplier_id,
      'zone_registration_' || NEW.status,
      'Demande d''inscription ' || status_text,
      'Votre demande d''inscription à la zone "' || zone_name || '" a été ' || status_text,
      jsonb_build_object(
        'request_id', NEW.id,
        'zone_id', NEW.zone_id,
        'status', NEW.status,
        'admin_response', NEW.admin_response
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify supplier when request is reviewed
DROP TRIGGER IF EXISTS trigger_notify_supplier_request_reviewed ON zone_registration_requests;
CREATE TRIGGER trigger_notify_supplier_request_reviewed
  AFTER UPDATE ON zone_registration_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_supplier_request_reviewed();

-- Enable realtime for zone registration requests
ALTER PUBLICATION supabase_realtime ADD TABLE zone_registration_requests;
