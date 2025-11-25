/*
  # Add Secure Profile Access Functions
  
  1. New Functions
    - `get_supplier_info_for_order(p_order_id UUID)` - Returns supplier info for a paid order
    - `get_client_info_for_order(p_order_id UUID)` - Returns client info for supplier's order
  
  2. Security
    - Functions use SECURITY DEFINER to bypass RLS securely
    - Only returns data if the requesting user owns the order
    - Supplier info only revealed after payment (anonymity protection)
*/

-- Function to get supplier info for a client's paid order
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
    AND o.payment_status = 'paid';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get client info for a supplier's order
CREATE OR REPLACE FUNCTION get_client_info_for_order(p_order_id UUID)
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
  JOIN orders o ON o.client_id = p.id
  WHERE o.id = p_order_id
    AND o.supplier_id = auth.uid();
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_supplier_info_for_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_info_for_order(UUID) TO authenticated;
