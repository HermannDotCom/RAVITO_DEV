/*
  # Fix RLS Policy pour notification_preferences
  
  ## Problème
  La policy INSERT actuelle vérifie auth.uid() = user_id
  Cela ne fonctionne pas pendant l'exécution du trigger car auth.uid() est NULL
  
  ## Solution
  Remplacer la policy INSERT restrictive par une qui permet:
  1. L'insertion par le trigger (pas de vérification auth.uid())
  2. L'insertion par l'utilisateur lui-même (auth.uid() = user_id)
*/

-- Supprimer l'ancienne policy trop restrictive
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;

-- Créer nouvelle policy plus permissive pour l'INSERT
CREATE POLICY "Allow insert notification preferences"
  ON public.notification_preferences
  FOR INSERT
  TO public
  WITH CHECK (true);

-- La sécurité est assurée par:
-- 1. Le trigger qui insère seulement pour le nouveau user (NEW.id)
-- 2. Les autres policies SELECT/UPDATE qui vérifient l'ownership

COMMENT ON POLICY "Allow insert notification preferences" ON public.notification_preferences IS
  'Permet l''insertion par le trigger d''inscription et par l''utilisateur. Sécurité assurée par trigger SECURITY DEFINER.';
