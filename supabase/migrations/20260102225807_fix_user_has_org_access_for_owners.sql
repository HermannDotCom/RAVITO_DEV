/*
  # Correction de user_has_org_access pour gérer les propriétaires

  1. Problème
    - La fonction ne trouvait pas l'organisation du target_user quand celui-ci est propriétaire
    - Elle cherchait uniquement dans organization_members
    - Les propriétaires ne sont pas toujours dans organization_members

  2. Solution
    - Chercher d'abord si le target_user est propriétaire d'une organisation
    - Puis chercher dans organization_members
    - Vérifier que les deux utilisateurs sont dans la même organisation
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
  -- D'abord vérifier s'il est propriétaire
  SELECT id INTO v_current_org_id
  FROM organizations
  WHERE owner_id = auth.uid()
  LIMIT 1;

  -- Si pas propriétaire, vérifier s'il est membre
  IF v_current_org_id IS NULL THEN
    SELECT organization_id INTO v_current_org_id
    FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
    LIMIT 1;
  END IF;

  -- Si toujours pas d'organisation, pas d'accès
  IF v_current_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Obtenir l'organisation de l'utilisateur cible
  -- D'abord vérifier s'il est propriétaire
  SELECT id INTO v_target_org_id
  FROM organizations
  WHERE owner_id = target_user_id
  LIMIT 1;

  -- Si pas propriétaire, vérifier s'il est membre
  IF v_target_org_id IS NULL THEN
    SELECT organization_id INTO v_target_org_id
    FROM organization_members
    WHERE user_id = target_user_id AND status = 'active'
    LIMIT 1;
  END IF;

  -- Si l'utilisateur cible n'a pas d'organisation, pas d'accès
  IF v_target_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Vérifier si les deux utilisateurs sont dans la même organisation
  RETURN v_current_org_id = v_target_org_id;
END;
$$;

-- Commentaire explicatif
COMMENT ON FUNCTION user_has_org_access IS 'Vérifie si l''utilisateur connecté a accès aux données d''un autre utilisateur via leur organisation commune. Gère à la fois les propriétaires et les membres.';
