/*
  # Create atomic function for accepting supplier offers
  
  ## Problem
  The frontend was making 5 separate Supabase queries to accept an offer.
  The UPDATE on orders table was silently failing due to RLS policies,
  leaving orders in an inconsistent state (offer accepted but order not updated).
  
  ## Solution
  Create a SECURITY DEFINER function that:
  - Bypasses RLS (runs with creator's privileges)
  - Executes all operations atomically
  - Returns JSON with success/error status
  
  ## Operations performed:
  1. Validate offer and order exist
  2. Reject all other pending offers for this order
  3. Accept this offer
  4. Update order (status, supplier_id, amounts)
  5. Replace order_items with offer's modified_items
*/

CREATE OR REPLACE FUNCTION accept_supplier_offer(
  p_offer_id UUID,
  p_order_id UUID
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_offer RECORD;
  v_order RECORD;
  v_result JSON;
BEGIN
  -- 1. Récupérer l'offre
  SELECT * INTO v_offer
  FROM supplier_offers
  WHERE id = p_offer_id AND order_id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Offre introuvable');
  END IF;
  
  -- 2. Récupérer la commande
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Commande introuvable');
  END IF;
  
  -- 3. Vérifier que la commande n'est pas déjà finalisée
  IF v_order.status NOT IN ('pending-offers', 'offers-received', 'awaiting-payment') THEN
    RETURN json_build_object('success', false, 'error', 'Cette commande ne peut plus être modifiée');
  END IF;
  
  -- 4. Si l'offre est déjà acceptée, vérifier si la commande doit être mise à jour
  IF v_offer.status = 'accepted' THEN
    IF v_order.status IN ('pending-offers', 'offers-received') OR v_order.supplier_id IS NULL THEN
      UPDATE orders
      SET 
        status = 'awaiting-payment',
        supplier_id = v_offer.supplier_id,
        total_amount = v_offer.total_amount,
        consigne_total = v_offer.consigne_total,
        supplier_commission = v_offer.supplier_commission,
        net_supplier_amount = v_offer.net_supplier_amount
      WHERE id = p_order_id;
      
      RETURN json_build_object(
        'success', true,
        'message', 'Commande mise à jour (offre déjà acceptée)',
        'offer_id', p_offer_id,
        'order_id', p_order_id,
        'supplier_id', v_offer.supplier_id
      );
    ELSE
      RETURN json_build_object('success', true, 'message', 'Offre déjà acceptée et commande à jour');
    END IF;
  END IF;
  
  -- 5. Vérifier que l'offre est en attente
  IF v_offer.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Cette offre a été refusée');
  END IF;
  
  -- 6. Rejeter toutes les autres offres pour cette commande
  UPDATE supplier_offers
  SET 
    status = 'rejected',
    rejected_at = NOW()
  WHERE order_id = p_order_id
    AND id != p_offer_id
    AND status = 'pending';
  
  -- 7. Accepter cette offre
  UPDATE supplier_offers
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = p_offer_id;
  
  -- 8. Mettre à jour la commande
  UPDATE orders
  SET 
    status = 'awaiting-payment',
    supplier_id = v_offer.supplier_id,
    total_amount = v_offer.total_amount,
    consigne_total = v_offer.consigne_total,
    supplier_commission = v_offer.supplier_commission,
    net_supplier_amount = v_offer.net_supplier_amount
  WHERE id = p_order_id;
  
  -- 9. Supprimer les anciens order_items
  DELETE FROM order_items WHERE order_id = p_order_id;
  
  -- 10. Valider et insérer les nouveaux order_items depuis l'offre
  IF v_offer.modified_items IS NULL OR jsonb_typeof(v_offer.modified_items::jsonb) != 'array' THEN
    RETURN json_build_object('success', false, 'error', 'Items de l''offre invalides');
  END IF;
  
  INSERT INTO order_items (order_id, product_id, quantity, with_consigne)
  SELECT 
    p_order_id,
    (item->>'productId')::UUID,
    (item->>'quantity')::INTEGER,
    COALESCE((item->>'withConsigne')::BOOLEAN, false)
  FROM jsonb_array_elements(v_offer.modified_items::jsonb) AS item
  WHERE item->>'productId' IS NOT NULL 
    AND item->>'quantity' IS NOT NULL;
  
  -- 11. Retourner le succès
  RETURN json_build_object(
    'success', true,
    'offer_id', p_offer_id,
    'order_id', p_order_id,
    'supplier_id', v_offer.supplier_id,
    'total_amount', v_offer.total_amount
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_supplier_offer(UUID, UUID) TO authenticated;
