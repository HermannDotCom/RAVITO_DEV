/*
  # Mettre à jour la fonction get_users_by_status_with_email
  
  1. Changements
    - Ajouter storefront_image_url aux colonnes retournées
    - Ajouter delivery_latitude et delivery_longitude
    - Ces champs permettent à l'admin de voir si le profil est complet
  
  2. Sécurité
    - SECURITY DEFINER maintenu pour accès auth.users
    - Vérification admin maintenue
*/

-- Drop la fonction existante
DROP FUNCTION IF EXISTS public.get_users_by_status_with_email(text);

-- Recréer la fonction avec les nouvelles colonnes
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
  created_at timestamptz,
  storefront_image_url text,
  delivery_latitude numeric,
  delivery_longitude numeric
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
  
  -- Retourner les utilisateurs filtrés par statut avec les nouvelles colonnes
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
    p.created_at,
    p.storefront_image_url,
    p.delivery_latitude,
    p.delivery_longitude
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
  'Fonction admin pour récupérer les utilisateurs avec emails, photos et localisation. SECURITY DEFINER pour contourner RLS.';

-- Donner accès aux utilisateurs authentifiés (la fonction vérifie is_admin en interne)
GRANT EXECUTE ON FUNCTION public.get_users_by_status_with_email TO authenticated;