

## Plan: Normalize playoff speeldag labels

### Problem

The `speeldag` field in the database contains inconsistent values for playoff matches:
- Some are `"Playoff Speeldag 7"` (old format)
- Some are `"Playoff 8"` (new format)
- Some may be `"Speeldag Playoff 9"` (variant)

This causes duplicate or inconsistent groupings on `/playoff` (e.g., "Speeldag 7" and "8" appearing as separate groups) and on `/admin/match-forms/playoffs`.

### Solution

Two changes to normalize display everywhere:

**1. `src/components/pages/admin/matches/services/matchesFormService.ts` (~line 114)**

Replace the simple `.replace('Playoff Speeldag', 'Playoff')` with a robust regex that handles all variants and normalizes to `"Playoff X"`:

```typescript
// Normalize all playoff speeldag variants to "Playoff X"
let matchdayDisplay = (row.speeldag || "Te bepalen");
if (isPlayoff || matchdayDisplay.toLowerCase().includes('playoff')) {
  const num = matchdayDisplay.match(/(\d+)/);
  matchdayDisplay = num ? `Playoff ${num[1]}` : 'Playoff';
}
```

**2. `src/components/pages/public/competition/PlayOffPage.tsx` (~line 328)**

Apply the same normalization when building schedule matches. Currently it does `.replace(/^Playoff\s+/i, '')` to strip "Playoff" and keep the number. But if speeldag is `"Playoff Speeldag 7"`, the regex leaves `"Speeldag 7"`. Fix:

```typescript
const speeldagNum = match.speeldag ? match.speeldag.match(/(\d+)/) : null;
const speeldagClean = speeldagNum ? speeldagNum[1] : null;
```

This extracts just the number regardless of prefix format. The `matchday` field (used for grouping headers) will then be just `"1"`, `"2"`, etc., which is already how the page displays them.

**3. Database cleanup migration (optional but recommended)**

A one-time migration to normalize all existing `speeldag` values in the `matches` table for playoff matches:

```sql
UPDATE matches
SET speeldag = 'Playoff ' || (regexp_match(speeldag, '(\d+)'))[1]
WHERE is_playoff_match = true
  AND speeldag IS NOT NULL
  AND speeldag != 'Playoff ' || (regexp_match(speeldag, '(\d+)'))[1];
```

This ensures the source data is clean, preventing future inconsistencies.

### Technical details

- The root cause is that `playoffService.ts` currently generates `speeldag: \`Playoff ${matchday}\`` (correct format), but older matches may have been generated with `"Playoff Speeldag X"` before a previous rename
- Both the public page and admin match forms need to handle any variant gracefully
- The DB migration makes the fix permanent at the source

