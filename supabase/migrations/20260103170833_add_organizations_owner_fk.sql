/*
  # Ajout de la foreign key manquante sur organizations

  1. Problème
    - La table organizations a une colonne owner_id mais pas de foreign key vers profiles
    - Les requêtes Supabase avec jointures échouent avec PGRST200
    - Erreur: "Searched for a foreign key relationship between 'organizations' and 'profiles'"

  2. Solution
    - Ajouter la foreign key organizations.owner_id -> profiles.id
    - Avec ON DELETE CASCADE pour nettoyer automatiquement
*/

-- Ajouter la foreign key si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'organizations_owner_id_fkey'
    AND table_name = 'organizations'
  ) THEN
    ALTER TABLE organizations
    ADD CONSTRAINT organizations_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Créer un index pour optimiser les requêtes sur owner_id
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- Commentaire
COMMENT ON CONSTRAINT organizations_owner_id_fkey ON organizations IS 'Foreign key vers profiles.id pour le propriétaire de l''organisation';
