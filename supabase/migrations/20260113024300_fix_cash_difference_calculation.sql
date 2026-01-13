-- ============================================
-- Fix cash_difference calculation for closed daily sheets
-- Migration to recalculate cash_difference for existing closed sheets
-- Date: 2026-01-13
-- ============================================

-- Recalculate cash_difference for closed sheets that have NULL cash_difference
-- Formula: cash_difference = closing_cash - (opening_cash + theoretical_revenue - expenses_total)
UPDATE daily_sheets
SET cash_difference = closing_cash - (opening_cash + theoretical_revenue - expenses_total)
WHERE status = 'closed' 
  AND closing_cash IS NOT NULL
  AND cash_difference IS NULL;

-- Verification query (commented out, for manual testing)
-- SELECT 
--   id,
--   sheet_date,
--   opening_cash,
--   closing_cash,
--   theoretical_revenue,
--   expenses_total,
--   (opening_cash + theoretical_revenue - expenses_total) as expected_cash,
--   closing_cash - (opening_cash + theoretical_revenue - expenses_total) as calculated_difference,
--   cash_difference,
--   notes
-- FROM daily_sheets
-- WHERE status = 'closed'
-- ORDER BY sheet_date DESC;
