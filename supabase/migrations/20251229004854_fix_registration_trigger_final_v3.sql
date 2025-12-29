/*
  # Fix DEFINITIF du Trigger d'Inscription
  
  ## Diagnostic
  - Ancienne syntaxe SET search_path TO toujours présente
  - Pas de policy INSERT sur profiles (RLS bloque même SECURITY DEFINER)
  - Le trigger SECURITY DEFINER ne bypass pas RLS si mal configuré
  
  ## Solution
  1. Supprimer complètement l'ancien trigger et fonction
  2. Créer nouvelle fonction avec syntaxe correcte
  3. Ajouter policy INSERT temporaire pour le trigger
  4. GRANT explicite sur la fonction
*/

-- 1. Supprimer complètement l'ancien système
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Créer la fonction avec syntaxe correcte
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
  v_name text;
  v_phone text;
  v_address text;
  v_business_name text;
BEGIN
  -- Extraire métadonnées avec valeurs par défaut
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur');
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_address := NEW.raw_user_meta_data->>'address';
  v_business_name := NEW.raw_user_meta_data->>'business_name';
  
  -- Valider le rôle
  IF v_role NOT IN ('admin', 'client', 'supplier') THEN
    v_role := 'client';
  END IF;
  
  -- Insérer le profil (SECURITY DEFINER bypass RLS)
  INSERT INTO public.profiles (
    id,
    email,
    role,
    name,
    phone,
    address,
    business_name,
    is_active,
    is_approved,
    approval_status
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_role::user_role,
    v_name,
    v_phone,
    v_address,
    v_business_name,
    true,
    CASE WHEN v_role = 'admin' THEN true ELSE false END,
    CASE WHEN v_role = 'admin' THEN 'approved'::approval_status ELSE 'pending'::approval_status END
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 3. Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Ajouter policy INSERT pour couvrir tous les cas (même si SECURITY DEFINER devrait suffire)
DROP POLICY IF EXISTS "profiles_insert_from_trigger" ON public.profiles;
CREATE POLICY "profiles_insert_from_trigger"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 5. S'assurer que les permissions sont correctes
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Trigger d''inscription automatique. SECURITY DEFINER bypass RLS. Syntaxe: SET search_path = public, pg_temp';

COMMENT ON POLICY "profiles_insert_from_trigger" ON public.profiles IS
  'Permet l''insertion du profil lors de l''inscription (complément au SECURITY DEFINER)';
