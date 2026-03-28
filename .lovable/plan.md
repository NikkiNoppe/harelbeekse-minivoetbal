

## Plan: Fix match costs being re-created after deletion

### Root cause

The `process_match_financial_costs` **database trigger** fires on every UPDATE to the `matches` table. When you:
1. Open wedstrijdformulier → see Veldkosten (id=100)
2. Delete Veldkosten → successfully deleted from `team_costs`
3. Click "Opslaan" → updates `matches` table → trigger fires → re-inserts Veldkosten with a **new id** (id=101)

The trigger uses `ON CONFLICT (match_id, team_id, cost_setting_id) DO NOTHING`, but since the record was deleted, there's no conflict — it gets re-created.

This also explains the "/admin/financial" error: the UI still shows the old ID (100) from a stale cache, but the DB now has a new ID (101).

### Solution

Modify the `process_match_financial_costs` trigger to **only insert costs during the initial submission transition** (`is_submitted` going from `false` to `true`). For subsequent updates to an already-submitted match, the trigger should do nothing — costs are already created and any manual changes should be preserved.

### Changes

**1. Database migration: Update `process_match_financial_costs` trigger**

Change the trigger condition so that match costs are only inserted when `OLD.is_submitted = false AND NEW.is_submitted = true` (first submission). The existing logic for clearing costs when scores are set to NULL is kept.

```sql
-- Only create costs on first submission transition
IF NEW.is_submitted = true 
   AND OLD.is_submitted = false  -- ← NEW: only on transition
   AND NEW.home_score IS NOT NULL 
   AND NEW.away_score IS NOT NULL THEN
  -- insert costs...
END IF;
```

This single change prevents deleted costs from being re-created on subsequent saves, while preserving the initial cost generation on first submission. No frontend changes needed.

**2. No frontend changes required**

The `handleDeleteMatchCost`, `loadMatchCosts`, and cache invalidation logic already works correctly. The only issue was the trigger undoing the deletions.

### Technical details

- The trigger currently fires on every update where `is_submitted = true` and scores are present
- After the fix, it only fires on the `false → true` transition of `is_submitted`
- The score-clearing logic (deleting costs when scores become NULL) is preserved unchanged
- The referee cost removal logic (when `assigned_referee_id` is NULL) is preserved unchanged

