/*
  # Test MINIMAL du Trigger - Ne fait RIEN
  
  ## Objectif
  Version qui NE FAIT AUCUN INSERT, juste RETURN NEW
  Pour vérifier si le problème vient du trigger lui-même ou de l'INSERT
  
  ## Test
  Si cette version fonctionne, le problème vient de l'INSERT dans profiles
  Si cette version échoue aussi, le problème vient du trigger lui-même
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ne faire ABSOLUMENT RIEN, juste retourner
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 
  'TEST: Trigger qui ne fait rien, juste RETURN NEW';
