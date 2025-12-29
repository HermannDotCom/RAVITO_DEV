/*
  # Créer fonction get_users_by_status_with_email pour Admin
  
  ## Problème
  La fonction get_users_by_status_with_email n'existe pas dans le schéma
  L'admin ne peut pas charger la liste des utilisateurs
  
  ## Solution
  Créer une fonction SECURITY DEFINER qui joint profiles avec auth.users
  pour récupérer les emails tout en respectant RLS
*/

CREATE OR REPLACE FUNCTION public.get_users_by_status_with_email(
  status_filter text DEFAULT 'all'
)
RETURNS TABLE (
  id uuid,
  email text,
  role user_role,
  name text,
  phone text,
  address text,
  business_name text,
  rating numeric,
  total_orders integer,
  is_active boolean,
  is_approved boolean,
  approval_status approval_status,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Retourner les utilisateurs filtrés par statut
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.email, au.email) as email,
    p.role,
    p.name,
    p.phone,
    p.address,
    p.business_name,
    p.rating,
    p.total_orders,
    p.is_active,
    p.is_approved,
    p.approval_status,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE 
    CASE 
      WHEN status_filter = 'approved' THEN p.approval_status = 'approved'::approval_status
      WHEN status_filter = 'pending' THEN p.approval_status = 'pending'::approval_status
      WHEN status_filter = 'rejected' THEN p.approval_status = 'rejected'::approval_status
      ELSE true
    END
  ORDER BY p.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_users_by_status_with_email IS 
  'Fonction admin pour récupérer les utilisateurs avec leurs emails depuis auth.users. SECURITY DEFINER pour contourner RLS.';

-- Donner accès aux utilisateurs authentifiés (la fonction vérifie is_admin en interne)
GRANT EXECUTE ON FUNCTION public.get_users_by_status_with_email TO authenticated;
