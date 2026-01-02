/*
  # Correction finale de user_has_org_access avec COALESCE

  1. Problème
    - La fonction ne trouvait pas correctement les organisations
    - La logique avec UNION ALL ne fonctionnait pas
    
  2. Solution
    - Utiliser COALESCE pour chercher owned puis member en une seule requête
    - Logique simplifiée et robuste
*/

CREATE OR REPLACE FUNCTION user_has_org_access(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_org_id uuid;
  v_target_org_id uuid;
BEGIN
  -- Si c'est le même utilisateur, accès autorisé
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;

  -- Obtenir l'organisation de l'utilisateur connecté
  -- Cherche d'abord si propriétaire, sinon si membre
  SELECT COALESCE(
    (SELECT id FROM organizations WHERE owner_id = auth.uid() LIMIT 1),
    (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND status = 'active' LIMIT 1)
  ) INTO v_current_org_id;

  -- Si pas d'organisation, pas d'accès
  IF v_current_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Obtenir l'organisation de l'utilisateur cible
  -- Cherche d'abord si propriétaire, sinon si membre
  SELECT COALESCE(
    (SELECT id FROM organizations WHERE owner_id = target_user_id LIMIT 1),
    (SELECT organization_id FROM organization_members WHERE user_id = target_user_id AND status = 'active' LIMIT 1)
  ) INTO v_target_org_id;

  -- Si l'utilisateur cible n'a pas d'organisation, pas d'accès
  IF v_target_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Vérifier si les deux utilisateurs sont dans la même organisation
  RETURN v_current_org_id = v_target_org_id;
END;
$$;

-- Commentaire explicatif
COMMENT ON FUNCTION user_has_org_access IS 'Vérifie si l''utilisateur connecté a accès aux données d''un autre utilisateur via leur organisation commune. Gère les propriétaires et les membres avec COALESCE.';
