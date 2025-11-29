/*
  # Update Delivery Confirmation Code to 8 Alphanumeric Characters
  
  1. Changes
    - Modify delivery_confirmation_code column to VARCHAR(8)
    - Update generate_confirmation_code() function to return 8 alphanumeric characters
    - Exclude characters 0, O, I, 1 to avoid visual confusion
    
  2. Character Set
    - Uses: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (32 characters)
    - Excludes: 0 (zero), O (Oscar), I (India), 1 (one) for clarity
*/

-- Modify the column to support 8 characters
ALTER TABLE orders
ALTER COLUMN delivery_confirmation_code TYPE VARCHAR(8);

-- Create or replace function to generate 8-character alphanumeric code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS VARCHAR(8)
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$;
