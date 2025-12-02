/*
  # Fix get_supplier_info_for_order condition
  
  The previous condition was too restrictive, only allowing payment_status = 'paid'.
  After delivery, payment_status becomes 'completed' or 'transferred', so those
  statuses must also be allowed.
  
  This fixes issues where:
  - "Fournisseur inconnu" appears in completed orders
  - "Fournisseur inconnu" appears in statistics  
  - "Fournisseur inconnu" appears in frequent suppliers list
  - "Utilisateur" appears in rating forms
*/

CREATE OR REPLACE FUNCTION get_supplier_info_for_order(p_order_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', p.id,
    'name', p.name,
    'business_name', p.business_name,
    'phone', p.phone,
    'rating', p.rating
  ) INTO result
  FROM profiles p
  JOIN orders o ON o.supplier_id = p.id
  WHERE o.id = p_order_id
    AND o.client_id = auth.uid()
    AND o.payment_status IN ('paid', 'completed', 'transferred');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
