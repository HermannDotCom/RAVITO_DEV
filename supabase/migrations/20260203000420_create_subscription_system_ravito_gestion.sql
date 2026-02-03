/*
  # Système d'Abonnement Ravito Gestion
  
  ## Objectif
  Créer un système d'abonnement complet pour monétiser le module "Gestion Activité".
  
  ## Tables Créées
  
  ### 1. subscription_plans
  Définit les offres d'abonnement (Mensuel, Semestriel, Annuel)
  - id, name, description
  - price (en FCFA), billing_cycle (monthly, semesterly, annually)
  - trial_days, is_active, display_order
  
  ### 2. subscription_settings
  Paramètres globaux du système d'abonnement (singleton)
  - trial_duration_days (défaut: 30)
  - reminder_days (JSON array des jours de relance par plan)
  - auto_suspend_after_trial (défaut: true)
  
  ### 3. subscriptions
  Abonnements des organisations
  - organization_id, plan_id
  - status (trial, pending_payment, active, suspended, cancelled)
  - trial_start_date, trial_end_date
  - current_period_start, current_period_end
  - next_billing_date, amount_due
  - is_first_subscription (pour gérer l'essai gratuit unique)
  
  ### 4. subscription_invoices
  Factures générées
  - subscription_id, invoice_number
  - amount, prorata_amount, days_calculated
  - period_start, period_end
  - due_date, status (pending, paid, cancelled)
  
  ### 5. subscription_payments
  Historique des paiements validés par l'Admin
  - invoice_id, subscription_id
  - amount, payment_method (cash, wave, orange_money, mtn_money)
  - payment_date, validated_by, validation_date
  
  ### 6. subscription_reminders
  Historique des relances envoyées
  - subscription_id, invoice_id
  - reminder_type (j_minus_90, j_minus_60, j_minus_30, j_minus_15, j_minus_7, j_minus_2)
  - sent_at, notification_id
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Clients : lecture de leurs propres abonnements/factures
  - Admin : accès complet
*/

-- =====================================================
-- 1. TABLE: subscription_plans
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'semesterly', 'annually')),
  days_in_cycle integer NOT NULL, -- 31 pour mensuel, 183 pour semestriel, 365 pour annuel
  trial_days integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, display_order);

-- RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =====================================================
-- 2. TABLE: subscription_settings
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_duration_days integer NOT NULL DEFAULT 30,
  auto_suspend_after_trial boolean NOT NULL DEFAULT true,
  reminder_days jsonb NOT NULL DEFAULT '{
    "monthly": [15, 7, 2],
    "semesterly": [60, 30, 15],
    "annually": [90, 60, 30, 15]
  }'::jsonb,
  grace_period_days integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- RLS
ALTER TABLE subscription_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view settings"
  ON subscription_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON subscription_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =====================================================
-- 3. TABLE: subscriptions
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'pending_payment', 'active', 'suspended', 'cancelled')),
  
  -- Trial period
  is_first_subscription boolean NOT NULL DEFAULT true,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  
  -- Billing period
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_billing_date timestamptz,
  
  -- Amounts
  amount_due numeric DEFAULT 0,
  is_prorata boolean NOT NULL DEFAULT false,
  prorata_days integer,
  
  -- Metadata
  subscribed_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  suspended_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index unique partiel : une seule souscription active par organisation
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_org_active 
  ON subscriptions(organization_id) 
  WHERE status IN ('trial', 'pending_payment', 'active');

-- Index
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status IN ('active', 'pending_payment');

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    user_has_org_access(organization_id)
  );

CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Organization owners can create subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = subscriptions.organization_id
        AND o.owner_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TABLE: subscription_invoices
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  
  -- Amounts
  amount numeric NOT NULL CHECK (amount >= 0),
  prorata_amount numeric,
  days_calculated integer,
  is_prorata boolean NOT NULL DEFAULT false,
  
  -- Period
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'overdue')),
  
  -- Payment
  paid_at timestamptz,
  paid_amount numeric,
  
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON subscription_invoices(due_date) WHERE status = 'pending';

-- RLS
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization invoices"
  ON subscription_invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_invoices.subscription_id
        AND user_has_org_access(s.organization_id)
    )
  );

CREATE POLICY "Admins can manage all invoices"
  ON subscription_invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =====================================================
-- 5. TABLE: subscription_payments
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES subscription_invoices(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  -- Payment details
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'wave', 'orange_money', 'mtn_money')),
  payment_date timestamptz NOT NULL,
  
  -- Validation
  validated_by uuid REFERENCES profiles(id),
  validation_date timestamptz DEFAULT now(),
  
  -- Receipt
  receipt_number text,
  transaction_reference text,
  notes text,
  
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON subscription_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON subscription_payments(payment_date);

-- RLS
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization payments"
  ON subscription_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_payments.subscription_id
        AND user_has_org_access(s.organization_id)
    )
  );

CREATE POLICY "Admins can manage all payments"
  ON subscription_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =====================================================
-- 6. TABLE: subscription_reminders
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES subscription_invoices(id) ON DELETE CASCADE,
  
  -- Reminder details
  reminder_type text NOT NULL CHECK (reminder_type IN ('j_minus_90', 'j_minus_60', 'j_minus_30', 'j_minus_15', 'j_minus_7', 'j_minus_2')),
  days_before_due integer NOT NULL,
  
  -- Notification
  notification_id uuid REFERENCES notifications(id),
  sent_at timestamptz DEFAULT now(),
  
  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_reminders_subscription ON subscription_reminders(subscription_id);
CREATE INDEX IF NOT EXISTS idx_reminders_invoice ON subscription_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sent_at ON subscription_reminders(sent_at);

-- RLS
ALTER TABLE subscription_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization reminders"
  ON subscription_reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_reminders.subscription_id
        AND user_has_org_access(s.organization_id)
    )
  );

CREATE POLICY "Admins can manage all reminders"
  ON subscription_reminders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- =====================================================
-- SEED DATA: Plans par défaut
-- =====================================================

INSERT INTO subscription_plans (name, description, price, billing_cycle, days_in_cycle, trial_days, display_order)
VALUES 
  ('Mensuel', 'Abonnement mensuel à Ravito Gestion', 6000, 'monthly', 31, 30, 1),
  ('Semestriel', 'Abonnement semestriel à Ravito Gestion (6 mois)', 30000, 'semesterly', 183, 30, 2),
  ('Annuel', 'Abonnement annuel à Ravito Gestion (12 mois)', 50000, 'annually', 365, 30, 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED DATA: Settings par défaut
-- =====================================================

INSERT INTO subscription_settings (trial_duration_days, auto_suspend_after_trial, reminder_days)
VALUES (30, true, '{
  "monthly": [15, 7, 2],
  "semesterly": [60, 30, 15],
  "annually": [90, 60, 30, 15]
}'::jsonb)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCTIONS HELPER
-- =====================================================

-- Fonction pour générer un numéro de facture unique
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number text;
  year_str text;
  month_str text;
  sequence_num integer;
BEGIN
  year_str := to_char(now(), 'YYYY');
  month_str := to_char(now(), 'MM');
  
  -- Compter les factures du mois actuel
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM subscription_invoices
  WHERE invoice_number LIKE 'RG-' || year_str || month_str || '%';
  
  new_number := 'RG-' || year_str || month_str || '-' || lpad(sequence_num::text, 4, '0');
  
  RETURN new_number;
END;
$$;

-- Fonction pour calculer la fin de période selon le cycle
CREATE OR REPLACE FUNCTION calculate_period_end(
  start_date timestamptz,
  billing_cycle text
)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE billing_cycle
    WHEN 'monthly' THEN
      -- Dernier jour du mois
      RETURN (date_trunc('month', start_date) + interval '1 month - 1 day')::timestamptz;
    WHEN 'semesterly' THEN
      -- 30 juin ou 31 décembre
      IF EXTRACT(MONTH FROM start_date) <= 6 THEN
        RETURN make_timestamptz(EXTRACT(YEAR FROM start_date)::int, 6, 30, 23, 59, 59, 'UTC');
      ELSE
        RETURN make_timestamptz(EXTRACT(YEAR FROM start_date)::int, 12, 31, 23, 59, 59, 'UTC');
      END IF;
    WHEN 'annually' THEN
      -- 31 décembre
      RETURN make_timestamptz(EXTRACT(YEAR FROM start_date)::int, 12, 31, 23, 59, 59, 'UTC');
    ELSE
      RAISE EXCEPTION 'Invalid billing_cycle: %', billing_cycle;
  END CASE;
END;
$$;