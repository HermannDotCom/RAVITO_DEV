/*
  # Debug Trigger avec Logs Détaillés
  
  ## Problème CRITIQUE Identifié
  Le trigger handle_new_user() s'exécute MAIS échoue silencieusement.
  - notification_preferences est créé automatiquement (trigger fonctionne)
  - profiles n'est PAS créé automatiquement (trigger handle_new_user échoue)
  
  ## Solution de Debug
  Recréer le trigger avec des RAISE NOTICE à chaque étape
  pour voir EXACTEMENT où il échoue.
  
  ## Résultats Attendus
  Les logs PostgreSQL montreront :
  - Quelle étape échoue
  - Quel est le message d'erreur exact
  - Le SQLSTATE de l'erreur
*/

-- Recréer la fonction avec logs détaillés
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
  -- Log 1: Fonction appelée
  RAISE NOTICE '[TRIGGER] handle_new_user CALLED for user %', NEW.id;
  
  -- Log 2: Extraire métadonnées
  BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur');
    v_phone := NEW.raw_user_meta_data->>'phone';
    v_address := NEW.raw_user_meta_data->>'address';
    v_business_name := NEW.raw_user_meta_data->>'business_name';
    
    RAISE NOTICE '[TRIGGER] Metadata extracted - role: %, name: %', v_role, v_name;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[TRIGGER] Metadata extraction FAILED: % %', SQLSTATE, SQLERRM;
      RETURN NEW;
  END;
  
  -- Log 3: Valider rôle
  IF v_role NOT IN ('admin', 'client', 'supplier') THEN
    RAISE NOTICE '[TRIGGER] Invalid role %, defaulting to client', v_role;
    v_role := 'client';
  END IF;
  
  -- Log 4: Tentative INSERT
  RAISE NOTICE '[TRIGGER] Attempting INSERT into profiles...';
  
  BEGIN
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
    
    RAISE NOTICE '[TRIGGER] ✓✓✓ INSERT SUCCEEDED for user %', NEW.id;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[TRIGGER] ✗✗✗ INSERT FAILED!';
      RAISE WARNING '[TRIGGER] SQLSTATE: %', SQLSTATE;
      RAISE WARNING '[TRIGGER] SQLERRM: %', SQLERRM;
      RAISE WARNING '[TRIGGER] Error Detail: %', SQLERRM;
      RETURN NEW;
  END;
  
  RAISE NOTICE '[TRIGGER] handle_new_user COMPLETED successfully';
  RETURN NEW;
  
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Trigger avec logs détaillés pour debug. Version temporaire.';
