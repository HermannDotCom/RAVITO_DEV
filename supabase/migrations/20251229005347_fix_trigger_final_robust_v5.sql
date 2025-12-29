/*
  # Trigger d'Inscription FINAL - Version Robuste
  
  ## Stratégie
  1. Supprimer TOUTES les anciennes versions
  2. Créer fonction simple et claire
  3. Gérer les erreurs sans bloquer Auth
  4. Insérer seulement les champs obligatoires
  
  ## Champs obligatoires dans profiles
  - id (NOT NULL)
  - role (NOT NULL, default 'client')
  - name (NOT NULL)
  
  ## Comportement en cas d'erreur
  Le trigger logue l'erreur mais retourne NEW pour ne PAS bloquer l'inscription Auth
*/

-- 1. Nettoyer complètement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Créer la fonction robuste
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_name text;
  v_phone text;
  v_address text;
  v_business_name text;
BEGIN
  -- Extraire les métadonnées
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_address := NEW.raw_user_meta_data->>'address';
  v_business_name := NEW.raw_user_meta_data->>'business_name';
  
  -- Valider le rôle
  IF v_role NOT IN ('admin', 'client', 'supplier') THEN
    v_role := 'client';
  END IF;
  
  -- Insérer le profil
  INSERT INTO public.profiles (
    id,
    role,
    name,
    email,
    phone,
    address,
    business_name,
    is_active,
    is_approved,
    approval_status
  )
  VALUES (
    NEW.id,
    v_role::user_role,
    v_name,
    NEW.email,
    v_phone,
    v_address,
    v_business_name,
    true,
    CASE WHEN v_role = 'admin' THEN true ELSE false END,
    CASE WHEN v_role = 'admin' THEN 'approved' ELSE 'pending' END::approval_status
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  -- Succès
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur mais NE PAS bloquer l'inscription
    RAISE WARNING 'handle_new_user failed for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    -- Retourner NEW pour que l'inscription Auth continue
    RETURN NEW;
END;
$$;

-- 3. Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Trigger d''inscription robuste. SECURITY DEFINER. EXCEPTION gérée pour ne pas bloquer Auth.';
