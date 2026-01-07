/*
  # Ajout commission client dans orders

  ## Problème
  Actuellement, `order.totalAmount` = montant offre fournisseur SANS commission client 4%.
  La commission client n'est jamais calculée, affichée ni payée.

  ## Solution
  1. Ajouter colonnes `client_commission_amount` et `base_amount` dans orders
  2. Modifier fonction `accept_supplier_offer` pour :
     - Calculer commission client 4% sur le montant de l'offre
     - Stocker base_amount (montant offre) et client_commission_amount
     - Mettre à jour total_amount = base_amount + client_commission_amount

  ## Changements
  - `base_amount` : Montant de l'offre (produits + consignes)
  - `client_commission_amount` : 4% de base_amount
  - `total_amount` : base_amount + client_commission_amount (ce que paie le client)
*/

-- Ajouter les colonnes client_commission_amount et base_amount
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS base_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS client_commission_amount NUMERIC(10,2) DEFAULT 0;

-- Créer ou remplacer la fonction accept_supplier_offer avec calcul commission
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

  -- 11. Valider et insérer les nouveaux order_items depuis l'offre
  IF v_offer.modified_items IS NULL OR jsonb_typeof(v_offer.modified_items::jsonb) != 'array' THEN
    RETURN json_build_object('success', false, 'error', 'Items de l''offre invalides');
  END IF;

  -- Insérer les items avec validation complète
  BEGIN
    INSERT INTO order_items (order_id, product_id, quantity, with_consigne)
    SELECT
      p_order_id,
      (item->>'productId')::UUID,
      (item->>'quantity')::INTEGER,
      COALESCE((item->>'withConsigne')::BOOLEAN, false)
    FROM jsonb_array_elements(v_offer.modified_items::jsonb) AS item
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_supplier_offer(UUID, UUID) TO authenticated;