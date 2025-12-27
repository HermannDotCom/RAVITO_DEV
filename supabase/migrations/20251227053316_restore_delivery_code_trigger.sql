/*
  # Restore Delivery Confirmation Code Trigger
  
  The trigger was accidentally dropped by CASCADE in migration 20251211010734.
  This migration restores it and fixes any invalid codes.
  
  1. Recreates the trigger on orders table
  2. Fixes existing codes that are not 8 characters
  3. Generates codes for delivering orders that don't have one
*/

-- ============================================
-- 1. RECREATE THE TRIGGER
-- ============================================

-- Drop if exists (safety)
DROP TRIGGER IF EXISTS trigger_set_delivery_confirmation_code ON orders;

-- Recreate the trigger
CREATE TRIGGER trigger_set_delivery_confirmation_code
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_delivery_confirmation_code();

-- ============================================
-- 2. FIX EXISTING INVALID CODES
-- ============================================

-- Update codes that are NOT exactly 8 characters (too short or too long)
-- Generate new valid 8-character codes for them
UPDATE orders
SET delivery_confirmation_code = (
  SELECT string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 
           floor(random() * 32 + 1)::int, 1), ''
  )
  FROM generate_series(1, 8)
)
WHERE delivery_confirmation_code IS NOT NULL 
  AND length(delivery_confirmation_code) != 8;

-- ============================================
-- 3. GENERATE CODES FOR DELIVERING ORDERS WITHOUT ONE
-- ============================================

-- For orders currently in 'delivering' status but missing a code
UPDATE orders
SET delivery_confirmation_code = (
  SELECT string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 
           floor(random() * 32 + 1)::int, 1), ''
  )
  FROM generate_series(1, 8)
)
WHERE status = 'delivering' 
  AND (delivery_confirmation_code IS NULL OR delivery_confirmation_code = '');

-- ============================================
-- 4. VERIFY THE FIX (comment for logs)
-- ============================================

-- After running, verify with:
-- SELECT id, status, delivery_confirmation_code, length(delivery_confirmation_code) as code_length
-- FROM orders
-- WHERE delivery_confirmation_code IS NOT NULL
-- ORDER BY created_at DESC
-- LIMIT 20;
