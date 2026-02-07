/*
  # Add Payment Validation Workflow

  1. Modified Tables
    - `subscription_payments`
      - Added `status` column (text): 'pending_validation', 'validated', 'rejected'
      - Added `rejection_reason` column (text, nullable): reason for rejection
    - `subscription_invoices`
      - Updated status check constraint to include 'payment_submitted'

  2. Security
    - Added INSERT policy on `subscription_payments` for authenticated users
      to submit their own payment claims (only for their organization's subscriptions)

  3. Notes
    - Existing rows in subscription_payments default to 'validated' status
    - The payment_submitted invoice status indicates client has declared a payment
*/

-- 1. Add status column to subscription_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_payments' AND column_name = 'status'
  ) THEN
    ALTER TABLE subscription_payments ADD COLUMN status text NOT NULL DEFAULT 'validated';
  END IF;
END $$;

-- 2. Add rejection_reason column to subscription_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_payments' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE subscription_payments ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- 3. Add check constraint for status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscription_payments_status_check'
  ) THEN
    ALTER TABLE subscription_payments
      ADD CONSTRAINT subscription_payments_status_check
      CHECK (status IN ('pending_validation', 'validated', 'rejected'));
  END IF;
END $$;

-- 4. Update invoice status constraint to allow 'payment_submitted'
ALTER TABLE subscription_invoices DROP CONSTRAINT IF EXISTS subscription_invoices_status_check;
ALTER TABLE subscription_invoices ADD CONSTRAINT subscription_invoices_status_check
  CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'payment_submitted'));

-- 5. Add INSERT policy for authenticated users to submit payment claims
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Users can submit payment claims'
    AND polrelid = 'subscription_payments'::regclass
  ) THEN
    CREATE POLICY "Users can submit payment claims"
      ON subscription_payments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM subscriptions s
          JOIN organization_members om ON om.organization_id = s.organization_id
          WHERE s.id = subscription_payments.subscription_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
        AND status = 'pending_validation'
      );
  END IF;
END $$;
