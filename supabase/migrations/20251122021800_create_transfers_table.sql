/*
  # Create Transfers Table for Treasury Management
  
  ## Description
  This migration creates the `transfers` table to store all financial transfers
  from the platform to suppliers. This replaces localStorage with persistent
  database storage for production-critical financial data.
  
  ## Changes
  1. Create transfer_method and transfer_status enum types
  2. Create transfers table with complete audit trail
  3. Add indexes for performance
  4. Add RLS policies for security
  5. Add triggers for automatic timestamp updates
  
  ## Security
  - RLS enabled
  - Only admins can create, approve, and view transfers
  - Suppliers can only view their own transfers
*/

-- Create enum types for transfer management
CREATE TYPE transfer_method AS ENUM ('bank_transfer', 'mobile_money', 'cash');
CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'completed', 'rejected');

-- Create transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Supplier information
  supplier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  supplier_name text NOT NULL,
  
  -- Financial details
  amount integer NOT NULL CHECK (amount > 0),
  order_count integer NOT NULL DEFAULT 0 CHECK (order_count >= 0),
  
  -- Transfer details
  transfer_method transfer_method NOT NULL DEFAULT 'bank_transfer',
  status transfer_status NOT NULL DEFAULT 'pending',
  
  -- Approval workflow
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  
  -- Completion tracking
  completed_at timestamptz,
  completed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Rejection handling
  rejected_at timestamptz,
  rejected_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason text,
  
  -- Audit trail and metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_approval CHECK (
    (status = 'approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL) OR
    (status != 'approved')
  ),
  CONSTRAINT valid_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL AND completed_by IS NOT NULL) OR
    (status != 'completed')
  ),
  CONSTRAINT valid_rejection CHECK (
    (status = 'rejected' AND rejected_at IS NOT NULL AND rejected_by IS NOT NULL AND rejection_reason IS NOT NULL) OR
    (status != 'rejected')
  )
);

-- Create junction table for transfers and orders
CREATE TABLE IF NOT EXISTS transfer_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id uuid NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  order_amount integer NOT NULL CHECK (order_amount > 0),
  created_at timestamptz DEFAULT now(),
  
  -- Ensure each order is only in one transfer
  CONSTRAINT unique_order_per_transfer UNIQUE (order_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transfers_supplier_id ON transfers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_approved_by ON transfers(approved_by);
CREATE INDEX IF NOT EXISTS idx_transfers_completed_at ON transfers(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_transfer_orders_transfer_id ON transfer_orders(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_order_id ON transfer_orders(order_id);

-- Trigger for automatic updated_at
CREATE TRIGGER update_transfers_updated_at 
  BEFORE UPDATE ON transfers
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update order payment status when transfer is completed
CREATE OR REPLACE FUNCTION update_orders_on_transfer_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update all orders in this transfer to have transferred_at timestamp
    UPDATE orders
    SET 
      payment_status = 'transferred',
      transferred_at = NEW.completed_at
    FROM transfer_orders
    WHERE orders.id = transfer_orders.order_id
      AND transfer_orders.transfer_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update orders when transfer is completed
CREATE TRIGGER update_orders_on_transfer_completion_trigger
  AFTER INSERT OR UPDATE OF status ON transfers
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_orders_on_transfer_completion();

-- Enable Row Level Security
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transfers table

-- Admins can do everything
CREATE POLICY "Admins can manage all transfers"
  ON transfers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Suppliers can view their own transfers
CREATE POLICY "Suppliers can view their own transfers"
  ON transfers
  FOR SELECT
  TO authenticated
  USING (
    supplier_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
      AND transfers.supplier_id = profiles.id
    )
  );

-- RLS Policies for transfer_orders table

-- Admins can manage all transfer orders
CREATE POLICY "Admins can manage all transfer orders"
  ON transfer_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Suppliers can view their own transfer orders
CREATE POLICY "Suppliers can view their own transfer orders"
  ON transfer_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transfers
      WHERE transfers.id = transfer_orders.transfer_id
      AND transfers.supplier_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE transfers IS 'Stores all financial transfers from platform to suppliers with complete audit trail';
COMMENT ON TABLE transfer_orders IS 'Junction table linking transfers to their constituent orders';
COMMENT ON COLUMN transfers.metadata IS 'Stores additional audit information like IP address, user agent, transaction IDs, etc.';
