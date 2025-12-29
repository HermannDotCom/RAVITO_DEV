/*
  # Test Trigger Ultra-Simplifié
  
  ## Objectif
  Créer un trigger minimal pour identifier où est le problème
  Version qui log et retourne NEW sans faire d'INSERT
  
  ## Test progressif
  1. Version minimale qui fait juste RETURN NEW
  2. Puis ajouter l'INSERT si version 1 fonctionne
*/

-- Désactiver temporairement le trigger actuel
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Version ultra-simplifiée du trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
  v_name text;
BEGIN
  -- Extraire métadonnées de base
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur');
  
  -- Valider le rôle
  IF v_role NOT IN ('admin', 'client', 'supplier') THEN
    v_role := 'client';
  END IF;
  
  -- Insérer le profil avec SEULEMENT les champs obligatoires
  INSERT INTO public.profiles (
    id,
    role,
    name
  )
  VALUES (
    NEW.id,
    v_role::user_role,
    v_name
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logger l'erreur mais ne pas bloquer l'inscription Auth
  RAISE WARNING 'Error in handle_new_user: % %', SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Trigger simplifié - insère seulement id, role, name';
