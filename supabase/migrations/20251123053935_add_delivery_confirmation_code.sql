/*
  # Add Delivery Confirmation Code to Orders
  
  1. Changes
    - Add `delivery_confirmation_code` column to orders table
    - Code is a 6-digit number generated when order status changes to 'delivering'
    - Client sees this code and gives it to supplier to confirm delivery
    
  2. Security
    - No RLS changes needed
    - Code is visible to both client and supplier for verification
*/

-- Add delivery_confirmation_code column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_confirmation_code VARCHAR(6);

-- Create function to generate a 6-digit confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Create trigger to automatically generate confirmation code when status changes to 'delivering'
CREATE OR REPLACE FUNCTION set_delivery_confirmation_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'delivering' AND OLD.status != 'delivering' AND NEW.delivery_confirmation_code IS NULL THEN
    NEW.delivery_confirmation_code = generate_confirmation_code();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create it
DROP TRIGGER IF EXISTS trigger_set_delivery_confirmation_code ON orders;
CREATE TRIGGER trigger_set_delivery_confirmation_code
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_delivery_confirmation_code();
