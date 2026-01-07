/*
  # Correction fonction accept_supplier_offer - Utiliser prix fournisseur

  ## Problème
  La fonction accept_supplier_offer insère order_items avec les prix RAVITO (products table),
  mais devrait utiliser les prix de l'offre du fournisseur (modified_items).

  Résultat: Le client voit les prix RAVITO au lieu des prix du fournisseur accepté.

  ## Solution
  Modifier la fonction pour extraire unitPrice, cratePrice, consignPrice depuis modified_items
  et les utiliser lors de l'insertion dans order_items.

  ## Structure modified_items
  ```json
  [
    {
      "productId": "uuid",
      "quantity": 10,
      "withConsigne": true,
      "unitPrice": 650,
      "cratePrice": 15600,
      "consignPrice": 4000
    }
  ]
  ```
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
  v_client_commission NUMERIC(10,2);
  v_total_with_commission NUMERIC(10,2);
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

  -- 4. Calculer commission client (4% de l'offre)
  v_client_commission := ROUND(v_offer.total_amount * 0.04);
  v_total_with_commission := v_offer.total_amount + v_client_commission;

  -- 5. Si l'offre est déjà acceptée, vérifier si la commande doit être mise à jour
  IF v_offer.status = 'accepted' THEN
    IF v_order.status IN ('pending-offers', 'offers-received') OR v_order.supplier_id IS NULL THEN
      UPDATE orders
      SET
        status = 'awaiting-payment',
        supplier_id = v_offer.supplier_id,
        base_amount = v_offer.total_amount,
        client_commission_amount = v_client_commission,
        total_amount = v_total_with_commission,
        consigne_total = v_offer.consigne_total,
        supplier_commission = v_offer.supplier_commission,
        net_supplier_amount = v_offer.net_supplier_amount
      WHERE id = p_order_id;

      RETURN json_build_object(
        'success', true,
        'message', 'Commande mise à jour (offre déjà acceptée)',
        'offer_id', p_offer_id,
        'order_id', p_order_id,
        'supplier_id', v_offer.supplier_id,
        'total_amount', v_total_with_commission
      );
    ELSE
      RETURN json_build_object('success', true, 'message', 'Offre déjà acceptée et commande à jour');
    END IF;
  END IF;

  -- 6. Vérifier que l'offre est en attente
  IF v_offer.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Cette offre a été refusée');
  END IF;

  -- 7. Rejeter toutes les autres offres pour cette commande
  UPDATE supplier_offers
  SET
    status = 'rejected',
    rejected_at = NOW()
  WHERE order_id = p_order_id
    AND id != p_offer_id
    AND status = 'pending';

  -- 8. Accepter cette offre
  UPDATE supplier_offers
  SET
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = p_offer_id;

  -- 9. Mettre à jour la commande AVEC commission client
  UPDATE orders
  SET
    status = 'awaiting-payment',
    supplier_id = v_offer.supplier_id,
    base_amount = v_offer.total_amount,
    client_commission_amount = v_client_commission,
    total_amount = v_total_with_commission,
    consigne_total = v_offer.consigne_total,
    supplier_commission = v_offer.supplier_commission,
    net_supplier_amount = v_offer.net_supplier_amount
  WHERE id = p_order_id;

  -- 10. Supprimer les anciens order_items
  DELETE FROM order_items WHERE order_id = p_order_id;

  -- 11. Valider et insérer les nouveaux order_items depuis l'offre avec PRIX FOURNISSEUR
  IF v_offer.modified_items IS NULL OR jsonb_typeof(v_offer.modified_items::jsonb) != 'array' THEN
    RETURN json_build_object('success', false, 'error', 'Items de l''offre invalides');
  END IF;

  -- Insérer les items avec les prix de l'offre (fournisseur)
  -- Si les prix ne sont pas dans l'offre (anciennes offres), fallback sur products
  BEGIN
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, crate_price, consign_price, subtotal, with_consigne)
    SELECT
      p_order_id,
      (item->>'productId')::UUID,
      (item->>'quantity')::INTEGER,
      -- Utiliser prix de l'offre si disponible, sinon fallback sur products
      COALESCE((item->>'unitPrice')::INTEGER, p.unit_price),
      COALESCE((item->>'cratePrice')::INTEGER, p.crate_price),
      COALESCE((item->>'consignPrice')::INTEGER, p.consign_price),
      -- Calculer subtotal: (crate_price * quantity) + (consign_price * quantity si avec consigne)
      (COALESCE((item->>'cratePrice')::INTEGER, p.crate_price) * (item->>'quantity')::INTEGER) +
      (CASE
        WHEN COALESCE((item->>'withConsigne')::BOOLEAN, false) = true
        THEN COALESCE((item->>'consignPrice')::INTEGER, p.consign_price) * (item->>'quantity')::INTEGER
        ELSE 0
      END),
      COALESCE((item->>'withConsigne')::BOOLEAN, false)
    FROM jsonb_array_elements(v_offer.modified_items::jsonb) AS item
    INNER JOIN products p ON p.id = (item->>'productId')::UUID
    WHERE item->>'productId' IS NOT NULL
      AND item->>'quantity' IS NOT NULL
      AND (item->>'quantity')::INTEGER > 0
      AND item->>'productId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', 'Erreur lors de l''insertion des items: ' || SQLERRM);
  END;

  -- 12. Retourner le succès
  RETURN json_build_object(
    'success', true,
    'offer_id', p_offer_id,
    'order_id', p_order_id,
    'supplier_id', v_offer.supplier_id,
    'base_amount', v_offer.total_amount,
    'client_commission_amount', v_client_commission,
    'total_amount', v_total_with_commission
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION accept_supplier_offer(UUID, UUID) TO authenticated;
