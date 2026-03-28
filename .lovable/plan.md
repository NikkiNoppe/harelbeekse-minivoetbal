

## Plan: Fix €0.00 amounts in financial history

### Root cause

The database trigger `process_match_financial_costs` inserts match costs into `team_costs` **without** an explicit `amount` value (NULL). The system is designed to fall back to `costs.amount` (the default rate from the cost settings table) when `team_costs.amount` is NULL.

However, multiple queries fetch `costs(name, category)` from the join — **missing the `amount` field**. So when the fallback logic runs `(transaction.costs?.amount || 0)`, `costs.amount` is `undefined` and it falls back to `0`.

The match form correctly uses `costs(name, category, amount)` — that's why it shows €7.00 while the financial history shows €0.00.

### Fix: Add `amount` to all `costs()` joins

**6 locations across 5 files** need `costs(name, category)` changed to `costs(name, category, amount)`:

1. **`src/hooks/useFinancialData.ts`** line 140: `costs(name, category)` → `costs(name, category, amount)`

2. **`src/services/financial/enhancedCostSettingsService.ts`** line 286 and line 363: same change

3. **`src/services/financial/financialService.ts`** line 49: same change

4. **`src/services/financial/costSettingsService.ts`** line 171: same change

5. **`src/services/financial/monthlyReportsService.ts`** line 164: same change

No logic changes needed — the fallback code `transaction.amount !== null ? transaction.amount : costs.amount` already exists and is correct. It just needs the `amount` field to actually be fetched from the database.

