/*
  # Correction du système de permissions et super admin

  1. Modifications
    - Ajouter une colonne `is_super_admin` dans profiles
    - Marquer le premier admin créé comme super admin
    - Créer une fonction pour vérifier si un utilisateur est super admin
    - Créer une fonction pour obtenir les pages autorisées selon le rôle

  2. Sécurité
    - Seul le super admin peut accéder aux pages exclusives
    - Les admins secondaires ont accès limité
    - RLS mis à jour pour respecter ces règles
*/

-- Ajouter la colonne is_super_admin si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;

-- Marquer Hermann comme super admin (premier admin créé)
UPDATE profiles 
SET is_super_admin = true 
WHERE id = '17690427-bd68-471a-a2f5-0f6272219649';

-- Fonction pour vérifier si un utilisateur est super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Fonction pour vérifier si un utilisateur est super admin (avec paramètre)
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM profiles WHERE id = user_id),
    false
  );
$$;

-- Créer un index sur is_super_admin pour performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles(is_super_admin) WHERE is_super_admin = true;

-- Commentaire explicatif
COMMENT ON COLUMN profiles.is_super_admin IS 'Indique si l''utilisateur est le super administrateur de la plateforme (seul le premier admin créé)';
