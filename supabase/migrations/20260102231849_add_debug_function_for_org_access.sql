/*
  # Ajout d'une fonction de debug pour user_has_org_access
  
  Cette fonction permet de tester la logique sans auth.uid()
*/

CREATE OR REPLACE FUNCTION debug_user_has_org_access(current_user_id uuid, target_user_id uuid)
RETURNS TABLE (
  current_org_id uuid,
  target_org_id uuid,
  has_access boolean,
  debug_info text
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  v_current_org_id uuid;
  v_target_org_id uuid;
  v_debug_info text := '';
BEGIN
  -- Obtenir l'organisation de l'utilisateur connecté
  SELECT COALESCE(
    (SELECT id FROM organizations WHERE owner_id = current_user_id LIMIT 1),
    (SELECT organization_id FROM organization_members WHERE user_id = current_user_id AND status = 'active' LIMIT 1)
  ) INTO v_current_org_id;

  v_debug_info := 'Current user org: ' || COALESCE(v_current_org_id::text, 'NULL');

  -- Obtenir l'organisation de l'utilisateur cible
  SELECT COALESCE(
    (SELECT id FROM organizations WHERE owner_id = target_user_id LIMIT 1),
    (SELECT organization_id FROM organization_members WHERE user_id = target_user_id AND status = 'active' LIMIT 1)
  ) INTO v_target_org_id;

  v_debug_info := v_debug_info || ' | Target user org: ' || COALESCE(v_target_org_id::text, 'NULL');

  RETURN QUERY SELECT 
    v_current_org_id,
    v_target_org_id,
    (v_current_org_id IS NOT NULL AND v_target_org_id IS NOT NULL AND v_current_org_id = v_target_org_id),
    v_debug_info;
END;
$$;
