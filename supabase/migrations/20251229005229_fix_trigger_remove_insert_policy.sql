/*
  # Fix: Retirer la policy INSERT qui bloque le trigger
  
  ## Problème identifié
  La policy profiles_insert_from_trigger vérifie auth.uid() = id
  Pendant l'inscription, auth.uid() n'est pas encore accessible dans le contexte du trigger
  Même SECURITY DEFINER ne suffit pas si RLS bloque avec une policy trop restrictive
  
  ## Solution
  Retirer la policy INSERT car SECURITY DEFINER devrait suffire
  Le trigger s'exécute en tant que postgres (SECURITY DEFINER)
*/

-- Retirer la policy INSERT restrictive
DROP POLICY IF EXISTS "profiles_insert_from_trigger" ON public.profiles;

-- Le trigger SECURITY DEFINER doit fonctionner sans policy INSERT
-- car il s'exécute avec les privilèges du propriétaire de la fonction (postgres)

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Trigger d''inscription. SECURITY DEFINER permet INSERT sans policy. Pas de policy INSERT nécessaire.';
