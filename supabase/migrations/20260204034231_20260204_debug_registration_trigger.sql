/*
  # Debug et Fix du Trigger d'Inscription
  
  Problème: Le trigger n'insère pas le profil, même s'il existe et est bien activé.
  
  Solution:
  1. Ajouter de la résilience à la fonction
  2. Utiliser un fallback avec INSERT IF NOT EXISTS
  3. Ajouter du logging via une table de debug
*/

-- 1. Créer une table de debug pour les erreurs de trigger
CREATE TABLE IF NOT EXISTS public.trigger_debug_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name text,
  error_message text,
  error_detail text,
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.trigger_debug_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_debug" ON public.trigger_debug_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR is_super_admin = true)));

-- 2. Récréer la fonction avec meilleur handling des erreurs
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
  v_error_msg text;
  v_error_detail text;
BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Log l'erreur dans la table de debug
    v_error_msg := SQLERRM;
    v_error_detail := SQLSTATE;
    
    INSERT INTO public.trigger_debug_logs (trigger_name, error_message, error_detail, user_id)
    VALUES ('handle_new_user', v_error_msg, v_error_detail, NEW.id);
    
    -- Re-raise l'erreur pour que Supabase le voit
    RAISE EXCEPTION 'Trigger error: % (State: %)', v_error_msg, v_error_detail;
  END;
END;
$$;

-- 3. S'assurer que les permissions sont correctes
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
GRANT SELECT, INSERT ON TABLE public.profiles TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON TABLE auth.users TO service_role;

COMMENT ON TABLE public.trigger_debug_logs IS 'Table de debug pour les erreurs des triggers';
