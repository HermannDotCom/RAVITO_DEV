/*
  # Create Sales Objectives Table
  
  ## Description
  Table pour gérer les objectifs mensuels des commerciaux terrain.
  Permet de définir et suivre les objectifs CHR et Dépôts par commercial et par mois.
  
  ## Prerequisites
  - Requires the table `sales_representatives` to exist (created in 20260127235500)
  - Requires the function `update_updated_at_column` to exist (created in earlier migrations)
  
  ## Structure
  - `id` - UUID primary key
  - `sales_rep_id` - Référence vers le commercial
  - `period_year` - Année de l'objectif
  - `period_month` - Mois de l'objectif (1-12)
  - `objective_chr` - Objectif nombre de CHR activés
  - `objective_depots` - Objectif nombre de Dépôts activés
  - `created_by` - Admin qui a créé l'objectif
  - Timestamps : created_at, updated_at
  
  ## Security
  - RLS activé
  - Lecture pour tous les admins
  - Modification réservée aux Super Admin
*/

-- Create sales_objectives table
CREATE TABLE IF NOT EXISTS sales_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id UUID NOT NULL REFERENCES sales_representatives(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  objective_chr INTEGER NOT NULL DEFAULT 40,
  objective_depots INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(sales_rep_id, period_year, period_month)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_objectives_rep ON sales_objectives(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_sales_objectives_period ON sales_objectives(period_year, period_month);

-- Enable RLS
ALTER TABLE sales_objectives ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all objectives
CREATE POLICY "Admins can view sales objectives"
  ON sales_objectives FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Super Admins can manage objectives
CREATE POLICY "Super admins can manage sales objectives"
  ON sales_objectives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND o.type = 'admin'
      AND om.role = 'super_admin'
      AND om.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND o.type = 'admin'
      AND om.role = 'super_admin'
      AND om.is_active = true
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_sales_objectives_updated_at
  BEFORE UPDATE ON sales_objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE sales_objectives IS 'Objectifs mensuels des commerciaux terrain (CHR et Dépôts à activer)';
