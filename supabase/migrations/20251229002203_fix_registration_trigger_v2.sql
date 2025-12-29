/*
  # Fix Trigger d'Inscription - Version Corrigée
  
  ## Problème identifié
  1. Syntaxe incorrecte: SET search_path TO au lieu de SET search_path =
  2. EXCEPTION WHEN OTHERS masque les vraies erreurs
  3. Erreurs non propagées correctement à Supabase Auth
  
  ## Solution
  - Corriger la syntaxe search_path
  - Retirer le bloc EXCEPTION pour laisser les erreurs remonter
  - Simplifier le code
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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
  
  -- Insérer le profil
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Crée automatiquement le profil utilisateur lors de l''inscription. SECURITY DEFINER bypasse RLS.';
