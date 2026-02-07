/*
  # Create Organizations and Subscription System

  Creates the complete foundation for the subscription system including
  organizations, team management, and all subscription-related tables.

  ## 1. New Tables
    - `organizations` - Business entities
    - `organization_members` - Team membership
    - `role_permissions` - Role-based permissions
    - `subscription_plans` - Plan definitions (Mensuel, Semestriel, Annuel)
    - `subscription_settings` - Global config (singleton)
    - `subscriptions` - Active subscriptions per org
    - `subscription_invoices` - Generated invoices
    - `subscription_payments` - Payment records
    - `subscription_reminders` - Reminder history

  ## 2. Security
    - RLS enabled on ALL tables
    - Admins have full access
    - Users see only their own organization data

  ## 3. Seed Data
    - 3 plans: Mensuel 6000, Semestriel 30000, Annuel 48000 FCFA
    - Default settings with 30-day trial
    - 3 test organizations with subscriptions and invoices
*/

-- =====================================================
-- STEP 1: CREATE ALL TABLES (no RLS yet)
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('client', 'supplier', 'admin')),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members integer NOT NULL DEFAULT 2,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id)
);

CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL,
  permissions jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invitation_token text UNIQUE,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_type text NOT NULL CHECK (organization_type IN ('client', 'supplier', 'admin')),
  role_name text NOT NULL,
  display_name text NOT NULL,
  description text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_type, role_name)
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'semesterly', 'annually')),
  days_in_cycle integer NOT NULL CHECK (days_in_cycle > 0),
  trial_days integer NOT NULL DEFAULT 30 CHECK (trial_days >= 0),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  free_months integer DEFAULT 0 CHECK (free_months >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_duration_days integer NOT NULL DEFAULT 30,
  auto_suspend_after_trial boolean NOT NULL DEFAULT true,
  reminder_days jsonb NOT NULL DEFAULT '{"monthly":[15,7,2],"semesterly":[60,30,15],"annually":[90,60,30,15]}'::jsonb,
  grace_period_days integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'pending_payment', 'active', 'suspended', 'cancelled')),
  is_first_subscription boolean NOT NULL DEFAULT true,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  next_billing_date timestamptz,
  amount_due numeric DEFAULT 0,
  is_prorata boolean NOT NULL DEFAULT false,
  prorata_days integer,
  subscribed_at timestamptz DEFAULT now(),
  activated_at timestamptz,
  suspended_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  amount numeric NOT NULL CHECK (amount >= 0),
  prorata_amount numeric,
  days_calculated integer,
  is_prorata boolean NOT NULL DEFAULT false,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'overdue')),
  paid_at timestamptz,
  paid_amount numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES subscription_invoices(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'wave', 'orange_money', 'mtn_money', 'bank_transfer')),
  payment_date timestamptz NOT NULL,
  validated_by uuid REFERENCES profiles(id),
  validation_date timestamptz DEFAULT now(),
  receipt_number text,
  transaction_reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES subscription_invoices(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('j_minus_90', 'j_minus_60', 'j_minus_30', 'j_minus_15', 'j_minus_7', 'j_minus_2')),
  days_before_due integer NOT NULL,
  notification_id uuid REFERENCES notifications(id),
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 2: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, display_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_org_active ON subscriptions(organization_id) WHERE status IN ('trial', 'pending_payment', 'active');
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date) WHERE status IN ('active', 'pending_payment');
CREATE INDEX IF NOT EXISTS idx_sub_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sub_invoices_due_date ON subscription_invoices(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sub_payments_invoice ON subscription_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_reminders_subscription ON subscription_reminders(subscription_id);

-- =====================================================
-- STEP 3: HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION user_has_org_access(target_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN TRUE;
  END IF;
  IF EXISTS (SELECT 1 FROM organizations WHERE id = target_org_id AND owner_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = target_org_id AND user_id = auth.uid() AND status = 'active'
  ) THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;

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
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM subscription_invoices
  WHERE invoice_number LIKE 'RG-' || year_str || month_str || '%';
  new_number := 'RG-' || year_str || month_str || '-' || lpad(sequence_num::text, 4, '0');
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_period_end(start_date timestamptz, billing_cycle text)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE billing_cycle
    WHEN 'monthly' THEN
      RETURN (date_trunc('month', start_date) + interval '1 month - 1 day')::timestamptz;
    WHEN 'semesterly' THEN
      IF EXTRACT(MONTH FROM start_date) <= 6 THEN
        RETURN make_timestamptz(EXTRACT(YEAR FROM start_date)::int, 6, 30, 23, 59, 59, 'UTC');
      ELSE
        RETURN make_timestamptz(EXTRACT(YEAR FROM start_date)::int, 12, 31, 23, 59, 59, 'UTC');
      END IF;
    WHEN 'annually' THEN
      RETURN make_timestamptz(EXTRACT(YEAR FROM start_date)::int, 12, 31, 23, 59, 59, 'UTC');
    ELSE
      RAISE EXCEPTION 'Invalid billing_cycle: %', billing_cycle;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'organizations_updated_at') THEN
    CREATE TRIGGER organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();
  END IF;
END $$;

-- =====================================================
-- STEP 4: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_reminders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: RLS POLICIES
-- =====================================================

-- organizations
CREATE POLICY "org_select" ON organizations FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organizations.id AND user_id = auth.uid() AND status = 'active')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "org_insert" ON organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "org_update" ON organizations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "org_delete" ON organizations FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- organization_members
CREATE POLICY "orgm_select" ON organization_members FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM organizations o WHERE o.id = organization_members.organization_id AND (o.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = o.id AND om.user_id = auth.uid() AND om.status = 'active')))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "orgm_insert" ON organization_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM organizations WHERE id = organization_members.organization_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "orgm_update" ON organization_members FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM organizations WHERE id = organization_members.organization_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "orgm_delete" ON organization_members FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM organizations WHERE id = organization_members.organization_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- role_permissions
CREATE POLICY "rp_select" ON role_permissions FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

-- subscription_plans
CREATE POLICY "sp_select" ON subscription_plans FOR SELECT TO authenticated
  USING (is_active = true OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "sp_insert" ON subscription_plans FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "sp_update" ON subscription_plans FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "sp_delete" ON subscription_plans FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- subscription_settings
CREATE POLICY "ss_select" ON subscription_settings FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');
CREATE POLICY "ss_insert" ON subscription_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "ss_update" ON subscription_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- subscriptions
CREATE POLICY "sub_select" ON subscriptions FOR SELECT TO authenticated
  USING (user_has_org_access(organization_id));
CREATE POLICY "sub_insert" ON subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM organizations o WHERE o.id = subscriptions.organization_id AND o.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
CREATE POLICY "sub_update" ON subscriptions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "sub_delete" ON subscriptions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- subscription_invoices
CREATE POLICY "si_select" ON subscription_invoices FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_invoices.subscription_id AND user_has_org_access(s.organization_id))
  );
CREATE POLICY "si_insert" ON subscription_invoices FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "si_update" ON subscription_invoices FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "si_delete" ON subscription_invoices FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- subscription_payments
CREATE POLICY "spay_select" ON subscription_payments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_payments.subscription_id AND user_has_org_access(s.organization_id))
  );
CREATE POLICY "spay_insert" ON subscription_payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "spay_update" ON subscription_payments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "spay_delete" ON subscription_payments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- subscription_reminders
CREATE POLICY "sr_select" ON subscription_reminders FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_reminders.subscription_id AND user_has_org_access(s.organization_id))
  );
CREATE POLICY "sr_insert" ON subscription_reminders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "sr_update" ON subscription_reminders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "sr_delete" ON subscription_reminders FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- =====================================================
-- STEP 6: SEED SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO subscription_plans (name, description, price, billing_cycle, days_in_cycle, trial_days, display_order, free_months, features)
VALUES
  ('Mensuel', 'Abonnement mensuel a Ravito Gestion', 6000, 'monthly', 31, 30, 1, 0,
   '["Gestion complete des activites", "Suivi des stocks", "Gestion des emballages", "Gestion des credits clients", "Rapports et exports PDF/Excel"]'::jsonb),
  ('Semestriel', 'Abonnement semestriel a Ravito Gestion - 1 mois offert', 30000, 'semesterly', 183, 30, 2, 1,
   '["Gestion complete des activites", "Suivi des stocks", "Gestion des emballages", "Gestion des credits clients", "Rapports et exports PDF/Excel", "Support prioritaire", "1 mois offert"]'::jsonb),
  ('Annuel', 'Abonnement annuel a Ravito Gestion - 4 mois offerts', 48000, 'annually', 365, 30, 3, 4,
   '["Gestion complete des activites", "Suivi des stocks", "Gestion des emballages", "Gestion des credits clients", "Rapports et exports PDF/Excel", "Support VIP dedie", "Formation incluse", "4 mois offerts"]'::jsonb)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 7: SEED SUBSCRIPTION SETTINGS
-- =====================================================

INSERT INTO subscription_settings (trial_duration_days, auto_suspend_after_trial, reminder_days, grace_period_days)
VALUES (30, true, '{"monthly":[15,7,2],"semesterly":[60,30,15],"annually":[90,60,30,15]}'::jsonb, 0)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 8: SEED TEST DATA (3 orgs + subscriptions + 3 invoices)
-- =====================================================

DO $$
DECLARE
  v_user1_id uuid := gen_random_uuid();
  v_user2_id uuid := gen_random_uuid();
  v_user3_id uuid := gen_random_uuid();
  v_org1_id uuid := gen_random_uuid();
  v_org2_id uuid := gen_random_uuid();
  v_org3_id uuid := gen_random_uuid();
  v_plan_monthly_id uuid;
  v_plan_semi_id uuid;
  v_plan_annual_id uuid;
  v_sub1_id uuid := gen_random_uuid();
  v_sub2_id uuid := gen_random_uuid();
  v_sub3_id uuid := gen_random_uuid();
  v_inv2_id uuid;
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES
    ('00000000-0000-0000-0000-000000000000', v_user1_id, 'authenticated', 'authenticated', 'test-maquis-bellevue@ravito.ci', crypt('TestDemo123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Maquis Belle Vue"}'),
    ('00000000-0000-0000-0000-000000000000', v_user2_id, 'authenticated', 'authenticated', 'test-restaurant-palmier@ravito.ci', crypt('TestDemo123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Restaurant Le Palmier"}'),
    ('00000000-0000-0000-0000-000000000000', v_user3_id, 'authenticated', 'authenticated', 'test-bar-marcel@ravito.ci', crypt('TestDemo123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Bar Chez Marcel"}');

  INSERT INTO profiles (id, name, role, phone, address, email, is_active, is_approved, approval_status)
  VALUES
    (v_user1_id, 'Jean Dupont', 'client', '+225 07 12 34 56', 'Cocody, Abidjan', 'test-maquis-bellevue@ravito.ci', true, true, 'approved'),
    (v_user2_id, 'Marie Kone', 'client', '+225 05 44 33 22', 'Plateau, Abidjan', 'test-restaurant-palmier@ravito.ci', true, true, 'approved'),
    (v_user3_id, 'Marcel Diaby', 'client', '+225 01 23 45 67', 'Marcory, Abidjan', 'test-bar-marcel@ravito.ci', true, true, 'approved');

  INSERT INTO organizations (id, name, type, owner_id, max_members)
  VALUES
    (v_org1_id, 'Maquis Belle Vue', 'client', v_user1_id, 2),
    (v_org2_id, 'Restaurant Le Palmier', 'client', v_user2_id, 2),
    (v_org3_id, 'Bar Chez Marcel', 'client', v_user3_id, 2);

  SELECT id INTO v_plan_monthly_id FROM subscription_plans WHERE billing_cycle = 'monthly' LIMIT 1;
  SELECT id INTO v_plan_semi_id FROM subscription_plans WHERE billing_cycle = 'semesterly' LIMIT 1;
  SELECT id INTO v_plan_annual_id FROM subscription_plans WHERE billing_cycle = 'annually' LIMIT 1;

  INSERT INTO subscriptions (id, organization_id, plan_id, status, is_first_subscription, trial_start_date, trial_end_date, current_period_start, current_period_end, next_billing_date, amount_due, subscribed_at)
  VALUES
    (v_sub1_id, v_org1_id, v_plan_monthly_id, 'pending_payment', true, now() - interval '31 days', now() - interval '1 day', now(), now() + interval '30 days', now() + interval '7 days', 6000, now() - interval '31 days'),
    (v_sub2_id, v_org2_id, v_plan_semi_id, 'active', true, now() - interval '60 days', now() - interval '30 days', now() - interval '30 days', now() + interval '153 days', now() + interval '153 days', 30000, now() - interval '60 days'),
    (v_sub3_id, v_org3_id, v_plan_annual_id, 'pending_payment', false, null, null, now(), now() + interval '365 days', now() + interval '14 days', 48000, now() - interval '15 days');

  INSERT INTO subscription_invoices (subscription_id, invoice_number, amount, period_start, period_end, due_date, status, is_prorata)
  VALUES
    (v_sub1_id, 'RG-202602-0001', 6000, now(), now() + interval '30 days', now() + interval '7 days', 'pending', false),
    (v_sub2_id, 'RG-202601-0001', 30000, now() - interval '30 days', now() + interval '153 days', now() - interval '25 days', 'paid', false),
    (v_sub3_id, 'RG-202602-0002', 48000, now(), now() + interval '365 days', now() + interval '14 days', 'overdue', false);

  SELECT id INTO v_inv2_id FROM subscription_invoices WHERE invoice_number = 'RG-202601-0001';

  INSERT INTO subscription_payments (invoice_id, subscription_id, amount, payment_method, payment_date)
  VALUES (v_inv2_id, v_sub2_id, 30000, 'wave', now() - interval '25 days');

  UPDATE subscription_invoices SET paid_at = now() - interval '25 days', paid_amount = 30000 WHERE id = v_inv2_id;
END $$;
