/*
  # Create Sales Representatives Table
  
  ## Description
  Table pour gérer les commerciaux qui inscrivent les CHR et dépôts.
  Permet de tracker qui inscrit qui lors de la phase de pré-lancement terrain.
  
  ## Structure
  - `id` - UUID primary key
  - `user_id` - Référence optionnelle vers auth.users (si le commercial a un compte)
  - `name` - Nom du commercial
  - `phone` - Téléphone
  - `email` - Email
  - `zone_id` - Zone d'affectation
  - `is_active` - Actif ou non
  - Timestamps : created_at, updated_at
  
  ## Security
  - RLS activé
  - Lecture publique pour les commerciaux actifs (formulaire d'inscription)
  - Gestion complète pour les admins
*/

-- Create sales_representatives table
CREATE TABLE IF NOT EXISTS sales_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_reps_active ON sales_representatives(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_reps_zone ON sales_representatives(zone_id);
CREATE INDEX IF NOT EXISTS idx_sales_reps_user ON sales_representatives(user_id);

-- Enable RLS
ALTER TABLE sales_representatives ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active sales reps for registration
CREATE POLICY "Public can view active sales reps for registration"
  ON sales_representatives FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage sales representatives
CREATE POLICY "Admins can manage sales representatives"
  ON sales_representatives FOR ALL
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

-- Trigger for updated_at
CREATE TRIGGER update_sales_representatives_updated_at
  BEFORE UPDATE ON sales_representatives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE sales_representatives IS 'Commerciaux qui inscrivent les CHR et dépôts lors du pré-lancement terrain';
