/*
  # Fix Trigger de Notification Preferences
  
  ## Problème IDENTIFIÉ
  Le trigger create_notification_preferences_for_new_user bloque l'inscription car:
  1. Il n'a PAS de bloc EXCEPTION
  2. La policy RLS sur notification_preferences vérifie auth.uid() = user_id
  3. Pendant le trigger, auth.uid() retourne NULL (user pas encore authentifié)
  4. L'INSERT échoue à cause de RLS et bloque toute l'inscription
  
  ## Solution
  1. Ajouter bloc EXCEPTION au trigger
  2. Si échec, logger WARNING mais ne pas bloquer Auth
*/

DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;

CREATE OR REPLACE FUNCTION public.create_notification_preferences_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tenter d'insérer les préférences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur mais NE PAS bloquer l'inscription
    RAISE WARNING 'create_notification_preferences_for_new_user failed for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    -- Retourner NEW pour que l'inscription Auth continue
    RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_preferences_for_new_user();

COMMENT ON FUNCTION public.create_notification_preferences_for_new_user() IS 
  'Trigger pour créer notification_preferences. EXCEPTION gérée pour ne pas bloquer Auth.';
