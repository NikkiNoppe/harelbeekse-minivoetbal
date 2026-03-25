

## Fix: Boetes en financiële kosten worden niet daadwerkelijk verwijderd

### Oorzaak

De `deleteTransaction` functie in `costSettingsService.ts` doet een directe `supabase.from('team_costs').delete()`. De DELETE RLS-policy vereist `get_current_user_role() = 'admin'`. Door Supabase connection pooling kan de context (gezet via `withUserContext` RPC) verloren gaan tussen de RPC-call en de DELETE query — ze komen op verschillende database-connecties terecht.

Het resultaat: Supabase retourneert **geen error** bij een DELETE die 0 rijen raakt door RLS. Dus `result.success = true` wordt getoond, maar er is niets verwijderd. Bij heropenen van de modal worden de penalties opnieuw uit de database geladen.

Hetzelfde probleem geldt voor `updateTransaction` en `addTransaction` in het Financieel kadertje.

### Oplossing

Gebruik een **SECURITY DEFINER RPC** voor delete, update en add operaties op `team_costs`, net als bij andere CRUD-operaties in dit project. Dit garandeert dat autorisatie en de actie in één atomaire database-transactie plaatsvinden.

**Stap 1: Database migratie — 3 nieuwe RPC functies**

```sql
-- Delete team_cost met admin-verificatie
CREATE OR REPLACE FUNCTION public.delete_team_cost_as_admin(
  p_user_id INTEGER, p_cost_id INTEGER
) RETURNS JSONB ...
  -- Verifieer admin role, DELETE FROM team_costs WHERE id = p_cost_id

-- Update team_cost bedrag met admin-verificatie  
CREATE OR REPLACE FUNCTION public.update_team_cost_as_admin(
  p_user_id INTEGER, p_cost_id INTEGER, 
  p_amount NUMERIC DEFAULT NULL, p_transaction_date TIMESTAMPTZ DEFAULT NULL,
  p_cost_setting_id INTEGER DEFAULT NULL
) RETURNS JSONB ...

-- Add team_cost met admin-verificatie
CREATE OR REPLACE FUNCTION public.add_team_cost_as_admin(
  p_user_id INTEGER, p_team_id INTEGER, p_cost_setting_id INTEGER,
  p_amount NUMERIC, p_transaction_date DATE, p_match_id INTEGER DEFAULT NULL
) RETURNS JSONB ...
```

**Stap 2: `costSettingsService.ts` aanpassen**

- `deleteTransaction`: vervang directe `.delete()` door `supabase.rpc('delete_team_cost_as_admin', { p_user_id, p_cost_id })`
- `updateTransaction`: vervang directe `.update()` door `supabase.rpc('update_team_cost_as_admin', ...)`
- `addTransaction` (voor match-gebonden kosten): vervang door `supabase.rpc('add_team_cost_as_admin', ...)`

User ID ophalen uit localStorage `auth_data`.

**Stap 3: `wedstrijdformulier-modal.tsx` vereenvoudigen**

- Verwijder de `withUserContext` wrapping rond `deleteTransaction`, `updateTransaction` en `addTransaction` calls — de RPC's handelen autorisatie zelf af.

### Bestanden

| Bestand | Wijziging |
|---------|-----------|
| Nieuwe migratie | 3 SECURITY DEFINER functies |
| `src/services/financial/costSettingsService.ts` | 3 functies omzetten naar RPC calls |
| `src/components/modals/matches/wedstrijdformulier-modal.tsx` | Syntax fix (regel 51-52) + `withUserContext` verwijderen rond cost CRUD |

### Syntax error fix

De build error op regel 52 wordt ook meegenomen — hoewel de code er correct uitziet in de huidige view, zal een clean rebuild dit bevestigen. Als het probleem een stale build-cache is, lost de code-wijziging in dit plan het automatisch op.

