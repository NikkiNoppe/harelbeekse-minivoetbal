

## Plan: Fix penalty deletion in wedstrijdformulier

### Root cause

The `removeSavedPenalty` function in the wedstrijdformulier does local state removal (`setSavedPenalties`, `setMatchCosts`) regardless of whether the DB delete succeeded. It also never calls `loadExistingPenalties()` after deletion to verify the DB state, unlike the financial page which invalidates queries and refetches.

Additionally, `loadExistingPenalties` is missing from the `removeSavedPenalty` dependency array.

### Fix (1 file)

**`src/components/modals/matches/wedstrijdformulier-modal.tsx`** — `removeSavedPenalty` function (~lines 394-428):

1. After successful `deleteTransaction`, call `await loadExistingPenalties()` to reload from DB (same pattern as financial page's `invalidateQueries` refetch)
2. Remove the manual local state manipulation (`setSavedPenalties`, `setMatchCosts` filter) — let `loadExistingPenalties` handle the state
3. On failure, also call `loadExistingPenalties()` to restore correct state
4. Add `loadExistingPenalties` to the dependency array
5. Invalidate financial queries for consistency with `/admin/financial`

```text
Before (simplified):
  deleteTransaction(id)
  if success → toast
  setSavedPenalties(filter out)   ← local only, no DB verification
  setMatchCosts(filter out)       ← local only

After (simplified):
  deleteTransaction(id)
  if success → toast → loadExistingPenalties() → invalidateQueries
  if failure → toast → loadExistingPenalties()   ← restore truth
```

