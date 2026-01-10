/*
  # Créer une fonction RPC pour obtenir les infos client d'une commande
  
  1. Objectif
    - Permettre aux livreurs de voir les informations du client d'une commande qui leur est assignée
    - Contourner les problèmes RLS en utilisant une fonction SECURITY DEFINER
  
  2. Sécurité
    - La fonction vérifie que l'utilisateur est bien assigné à la livraison
    - Retourne uniquement les infos nécessaires (pas de données sensibles)
*/

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS get_client_info_for_order(UUID);

-- Créer la nouvelle fonction
CREATE FUNCTION get_client_info_for_order(p_order_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  business_name TEXT,
  phone TEXT,
  rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur actuel est assigné à cette livraison
  -- OU est le fournisseur de la commande
  IF NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = p_order_id
    AND (
      o.assigned_delivery_user_id = auth.uid()
      OR o.supplier_id = auth.uid()
      OR o.delivered_by_user_id = auth.uid()
    )
  ) THEN
    -- Si pas assigné, ne rien retourner
    RETURN;
  END IF;

  -- Retourner les infos du client
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.business_name,
    p.phone,
    p.rating
  FROM orders o
  INNER JOIN profiles p ON p.id = o.client_id
  WHERE o.id = p_order_id;
END;
$$;

-- Permettre aux utilisateurs authentifiés d'appeler cette fonction
GRANT EXECUTE ON FUNCTION get_client_info_for_order(UUID) TO authenticated;
