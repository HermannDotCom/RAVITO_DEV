/*
  # Recréer le trigger de code de confirmation de livraison
  
  1. Problème
    - Le trigger trigger_set_delivery_confirmation_code n'existe pas
    - Cela empêche la génération automatique du code quand status = 'delivering'
  
  2. Solution
    - Recréer le trigger qui utilise la fonction set_delivery_confirmation_code()
*/

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS trigger_set_delivery_confirmation_code ON orders;

-- Recréer le trigger
CREATE TRIGGER trigger_set_delivery_confirmation_code
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_delivery_confirmation_code();
