

## Plan: Synchronize financial data between wedstrijdformulier and /admin/financial

### Problems identified

1. **Incomplete query invalidation**: The wedstrijdformulier only invalidates `['all-team-transactions']`, but `useFinancialData` on `/admin/financial` also uses `['teams-financial']`, `['submitted-matches']`, and `['cost-settings']` — these remain stale.

2. **€0 amount on add**: The `savePenalties` function passes `costSetting.amount` (from the `costs` table default). This is correct. However, the `process_match_financial_costs` DB trigger inserts match costs **without** an explicit `amount` value (NULL). When `useFinancialData` reads these with `transaction.amount !== null ? transaction.amount : cost.amount`, NULL amounts should fall back correctly. But for penalties added via `addTransaction`, if `amount` is passed as 0 or the cost setting has amount=0, it stores 0. Need to ensure `costSetting.amount` is always the correct value.

3. **Update not syncing**: `handleUpdateMatchCostAmount` updates local state and invalidates one query key, but doesn't reload from DB (same issue as the delete bug we already fixed).

### Changes

**File: `src/components/modals/matches/wedstrijdformulier-modal.tsx`**

1. Create a helper function `invalidateFinancialQueries` that invalidates all 4 financial query keys at once:
   - `['all-team-transactions']`
   - `['teams-financial']`
   - `['submitted-matches']`
   - `['cost-settings']`

2. **`savePenalties`** (~line 381): Replace single `invalidateQueries` call with `invalidateFinancialQueries()`.

3. **`handleDeleteMatchCost`** (~line 235): Replace single `invalidateQueries` call with `invalidateFinancialQueries()`. Also call `loadExistingPenalties()` and `loadMatchCosts()` after delete (same pattern as `removeSavedPenalty`).

4. **`handleUpdateMatchCostAmount`** (~line 252): Replace single `invalidateQueries` call with `invalidateFinancialQueries()`. After successful update, also call `loadExistingPenalties()` and `loadMatchCosts()` to reload from DB (remove local-only state manipulation).

5. **`removeSavedPenalty`** (~line 420): Replace single `invalidateQueries` call with `invalidateFinancialQueries()`.

This ensures every CRUD operation in the wedstrijdformulier immediately invalidates all financial caches, so navigating to `/admin/financial` triggers fresh data fetches.

