# Deployment Guide: Cash Difference Fix

## Overview
This fix addresses two critical bugs in the daily sheet closure process:
1. Notes not being saved during closure
2. Cash difference not being calculated

## Pre-Deployment Checklist
- [x] All code changes committed
- [x] Unit tests created and passing
- [x] TypeScript compilation successful
- [x] No new linter errors
- [x] SQL migration file created

## Deployment Steps

### 1. Deploy Code Changes
```bash
# Merge the PR into main/production branch
# Deploy the application to production

# Files that will be deployed:
# - src/services/dailySheetService.ts
# - src/components/Client/Activity/hooks/useActivityManagement.ts
# - src/components/Client/Activity/CashTab.tsx
# - src/components/Client/Activity/SummaryTab.tsx
```

### 2. Run Database Migration
```bash
# Apply the SQL migration to fix existing data
# This will recalculate cash_difference for all closed sheets with NULL values

# Execute the migration:
supabase migration up

# Or run manually in Supabase SQL editor:
# supabase/migrations/20260113024300_fix_cash_difference_calculation.sql
```

### 3. Verification After Deployment

#### A. Check Existing Data
```sql
-- Verify that cash_difference has been calculated for existing closed sheets
SELECT 
  id,
  sheet_date,
  opening_cash,
  closing_cash,
  theoretical_revenue,
  expenses_total,
  (opening_cash + theoretical_revenue - expenses_total) as expected_cash,
  cash_difference,
  notes
FROM daily_sheets
WHERE status = 'closed'
ORDER BY sheet_date DESC
LIMIT 10;

-- All closed sheets should now have cash_difference calculated
```

#### B. Test New Closures
1. **Create a test daily sheet** for today's date
2. **Add some stock lines** with sales data
3. **Add expenses** (e.g., 5000 F)
4. **Set opening cash** (e.g., 10000 F)
5. **Go to Summary tab** and close the sheet:
   - Enter closing cash (e.g., 35000 F)
   - Enter notes (e.g., "Test closure with notes")
6. **Verify in UI**:
   - Cash difference should display correctly (not 0)
   - Notes should appear in the Summary tab after closure
7. **Verify in Database**:
```sql
SELECT 
  sheet_date,
  opening_cash,
  closing_cash,
  theoretical_revenue,
  expenses_total,
  cash_difference,
  notes,
  status
FROM daily_sheets
WHERE sheet_date = CURRENT_DATE
  AND status = 'closed';

-- Both cash_difference and notes should be populated
```

#### C. Test Display of Legacy Data
1. **Navigate to an old closed sheet** (from before the fix)
2. **Check Cash tab**: Should show correct cash difference (calculated client-side as fallback)
3. **Check Summary tab**: Should show correct cash difference in the KPI card

## Expected Results

### Before Fix
```sql
-- Old data looked like this:
| closing_cash | cash_difference | notes |
|--------------|-----------------|-------|
| 31200        | NULL            | NULL  |
| 45600        | NULL            | NULL  |
```

### After Fix
```sql
-- New closures will have:
| closing_cash | cash_difference | notes                    |
|--------------|-----------------|--------------------------|
| 31200        | -400            | "Normal closure"         |
| 45600        | 1200            | "Extra sales from event" |

-- Old data will be fixed by migration:
| closing_cash | cash_difference | notes |
|--------------|-----------------|-------|
| 31200        | -400            | NULL  |  -- Calculated by migration
| 45600        | 1200            | NULL  |  -- Calculated by migration
```

## Rollback Plan
If issues are detected after deployment:

1. **Code Rollback**: Revert the PR and redeploy
2. **Database Rollback**: The migration only updates NULL values, so it's safe. However, if needed:
```sql
-- Reset cash_difference to NULL for affected rows
-- (Not recommended unless absolutely necessary)
UPDATE daily_sheets
SET cash_difference = NULL
WHERE status = 'closed'
  AND cash_difference IS NOT NULL
  AND closed_at > '2026-01-13T00:00:00Z';
```

## Monitoring
After deployment, monitor for:
- Any errors in the closure process
- Correct display of cash difference in UI
- Notes appearing after closure
- No null values for new closures

## Support
If issues arise:
1. Check browser console for JavaScript errors
2. Check application logs for server errors
3. Verify database records match UI display
4. Contact development team with specific error details

## Success Criteria
- ✅ New closures save both cash_difference and notes
- ✅ Cash difference displays correctly in UI (not 0)
- ✅ Old data shows correct cash difference (client-side fallback)
- ✅ Notes appear in Summary tab after closure
- ✅ All unit tests pass
