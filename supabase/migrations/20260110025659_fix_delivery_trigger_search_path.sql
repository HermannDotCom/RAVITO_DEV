/*
  # Corriger le search_path du trigger de confirmation de livraison
  
  1. Problème
    - Le trigger set_delivery_confirmation_code a SET search_path TO ''
    - Cela l'empêche de trouver generate_confirmation_code() dans le schéma public
  
  2. Solution
    - Recréer le trigger avec search_path = public
    - Ou appeler explicitement public.generate_confirmation_code()
*/

-- Recréer la fonction trigger avec le bon search_path
CREATE OR REPLACE FUNCTION set_delivery_confirmation_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivering' AND (OLD.status IS NULL OR OLD.status != 'delivering') THEN
    NEW.delivery_confirmation_code := generate_confirmation_code();
  END IF;
  RETURN NEW;
END;
$$;
