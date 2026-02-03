/*
  # Système d'Abonnement Ravito Gestion
  
  Crée le système complet d'abonnement pour monétiser le module "Gestion Activité"
  
  Tables: subscription_plans, subscriptions, subscription_invoices, subscription_payments, 
          subscription_reminders, subscription_settings
  
  Fonctions: generate_invoice_number(), calculate_period_end(), user_has_org_access()
  
  Plans: Mensuel (6000 FCFA), Semestriel (30000 FCFA), Annuel (50000 FCFA)
*/

-- Tables
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'semesterly', 'annually')),
  days_in_cycle integer NOT NULL CHECK (days_in_cycle > 0),
  trial_days integer DEFAULT 30 CHECK (trial_days >= 0),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'pending_payment', 'active', 'suspended', 'cancelled')),
  is_first_subscription boolean DEFAULT true,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_billing_date date,
  amount_due numeric(10, 2) DEFAULT 0 CHECK (amount_due >= 0),
  is_prorata boolean DEFAULT false,
  prorata_days integer,
  subscribed_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  suspended_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_subscriptions_org_active ON subscriptions(organization_id) WHERE status IN ('trial', 'pending_payment', 'active');

CREATE TABLE subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
  prorata_amount numeric(10, 2),
  days_calculated integer,
  is_prorata boolean DEFAULT false,
  period_start date NOT NULL,
  period_end date NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at timestamptz,
  paid_amount numeric(10, 2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES subscription_invoices(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'wave', 'orange_money', 'mtn_money')),
  payment_date timestamptz NOT NULL,
  validated_by uuid REFERENCES profiles(id),
  validation_date timestamptz DEFAULT now(),
  receipt_number text,
  transaction_reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE subscription_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('trial_ending', 'payment_due')),
  days_before integer NOT NULL,
  sent_at timestamptz,
  scheduled_for date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE subscription_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_duration_days integer DEFAULT 30 CHECK (trial_duration_days >= 0),
  auto_suspend_after_trial boolean DEFAULT true,
  reminder_days jsonb DEFAULT '{"monthly": [15, 7, 2], "semesterly": [60, 30, 15], "annually": [90, 60, 30, 15]}'::jsonb,
  grace_period_days integer DEFAULT 0 CHECK (grace_period_days >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Fonctions
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_month text;
  sequence_num integer;
  invoice_num text;
BEGIN
  year_month := to_char(now(), 'YYYYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-[0-9]{6}-([0-9]+)') AS integer)), 0) + 1
  INTO sequence_num
  FROM subscription_invoices
  WHERE invoice_number LIKE 'INV-' || year_month || '-%';
  invoice_num := 'INV-' || year_month || '-' || LPAD(sequence_num::text, 4, '0');
  RETURN invoice_num;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_period_end(start_date timestamptz, billing_cycle text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  period_end timestamptz;
BEGIN
  CASE billing_cycle
    WHEN 'monthly' THEN
      period_end := (date_trunc('month', start_date) + interval '1 month' - interval '1 day')::timestamptz;
    WHEN 'semesterly' THEN
      IF EXTRACT(MONTH FROM start_date) <= 6 THEN
        period_end := make_timestamptz(EXTRACT(YEAR FROM start_date)::integer, 6, 30, 23, 59, 59, 'UTC');
      ELSE
        period_end := make_timestamptz(EXTRACT(YEAR FROM start_date)::integer, 12, 31, 23, 59, 59, 'UTC');
      END IF;
    WHEN 'annually' THEN
      period_end := make_timestamptz(EXTRACT(YEAR FROM start_date)::integer, 12, 31, 23, 59, 59, 'UTC');
    ELSE
      RAISE EXCEPTION 'Invalid billing cycle: %', billing_cycle;
  END CASE;
  RETURN period_end;
END;
$$;

CREATE OR REPLACE FUNCTION user_has_org_access(user_id uuid, org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM organizations WHERE id = org_id AND owner_id = user_id) THEN
    RETURN true;
  END IF;
  IF EXISTS (SELECT 1 FROM organization_members WHERE organization_id = org_id AND user_id = user_has_org_access.user_id AND status = 'active') THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans visibles par tous" ON subscription_plans FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins gèrent plans" ON subscription_plans FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));

CREATE POLICY "Users voient leurs abonnements" ON subscriptions FOR SELECT TO authenticated USING (user_has_org_access(auth.uid(), organization_id) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));
CREATE POLICY "Users créent leur abonnement" ON subscriptions FOR INSERT TO authenticated WITH CHECK (user_has_org_access(auth.uid(), organization_id));
CREATE POLICY "Admins gèrent abonnements" ON subscriptions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));

CREATE POLICY "Users voient leurs factures" ON subscription_invoices FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_id AND user_has_org_access(auth.uid(), s.organization_id)) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));
CREATE POLICY "Admins gèrent factures" ON subscription_invoices FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));

CREATE POLICY "Users voient leurs paiements" ON subscription_payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_id AND user_has_org_access(auth.uid(), s.organization_id)) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));
CREATE POLICY "Admins gèrent paiements" ON subscription_payments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));

CREATE POLICY "Admins voient rappels" ON subscription_reminders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));
CREATE POLICY "Admins gèrent rappels" ON subscription_reminders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));

CREATE POLICY "Admins voient paramètres" ON subscription_settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));
CREATE POLICY "Admins modifient paramètres" ON subscription_settings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.is_super_admin = true)));

-- Données
INSERT INTO subscription_plans (name, description, price, billing_cycle, days_in_cycle, trial_days, is_active, display_order, features) VALUES 
('Mensuel', 'Abonnement mensuel à Ravito Gestion - Facturation au prorata le premier mois', 6000, 'monthly', 30, 30, true, 1, '["Gestion complète des activités", "Suivi des stocks", "Gestion des emballages", "Gestion des crédits clients", "Rapports et exports PDF/Excel", "Support technique"]'::jsonb),
('Semestriel', 'Abonnement semestriel à Ravito Gestion - Économisez 5000 FCFA/mois', 30000, 'semesterly', 180, 30, true, 2, '["Gestion complète des activités", "Suivi des stocks", "Gestion des emballages", "Gestion des crédits clients", "Rapports et exports PDF/Excel", "Support prioritaire", "Économie de 17%"]'::jsonb),
('Annuel', 'Abonnement annuel à Ravito Gestion - Meilleure offre, économisez 1833 FCFA/mois', 50000, 'annually', 365, 30, true, 3, '["Gestion complète des activités", "Suivi des stocks", "Gestion des emballages", "Gestion des crédits clients", "Rapports et exports PDF/Excel", "Support VIP dédié", "Formation incluse", "Économie de 31%"]'::jsonb);

INSERT INTO subscription_settings (trial_duration_days, auto_suspend_after_trial, reminder_days, grace_period_days) VALUES (30, true, '{"monthly": [15, 7, 2], "semesterly": [60, 30, 15], "annually": [90, 60, 30, 15]}'::jsonb, 0);

-- Index
CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status IN ('active', 'pending_payment');
CREATE INDEX idx_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX idx_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_invoices_due_date ON subscription_invoices(due_date) WHERE status = 'pending';
CREATE INDEX idx_payments_invoice ON subscription_payments(invoice_id);
CREATE INDEX idx_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX idx_reminders_subscription ON subscription_reminders(subscription_id);
CREATE INDEX idx_reminders_scheduled ON subscription_reminders(scheduled_for) WHERE subscription_reminders.status = 'pending';
