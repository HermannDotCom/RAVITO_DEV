/*
  # Fix Supplier Offers - Allow Updates
  
  1. Changes
    - Remove UNIQUE constraint on (order_id, supplier_id)
    - Keep only one active offer per supplier per order using business logic
    - This allows suppliers to update their offers by creating new ones
  
  2. Notes
    - The constraint was preventing suppliers from updating their offers
    - Business logic in the app will handle showing only the latest offer
    - Old offers remain in history for audit purposes
*/

-- Drop the unique constraint
ALTER TABLE supplier_offers 
DROP CONSTRAINT IF EXISTS supplier_offers_order_id_supplier_id_key;
