

## Plan: Indieningstijdstip tonen via `transaction_date`

### Analyse

Het veld `transaction_date` is momenteel van type `date` (geen tijdcomponent). Door dit om te vormen naar `timestamptz` kan het tijdstip van indiening direct worden opgeslagen zonder extra kolom.

**Impact check**: Het veld wordt op ~15 plaatsen gebruikt. Bestaande `date`-waarden worden automatisch `YYYY-MM-DD 00:00:00+00` bij conversie. Filtering met `.gte()` / `.lte()` en `new Date()` parsing blijven correct werken.

### Wijzigingen

**1. SQL migratie** -- `transaction_date` van `date` naar `timestamptz`
```sql
ALTER TABLE public.team_costs 
ALTER COLUMN transaction_date TYPE timestamptz 
USING transaction_date::timestamptz;

ALTER TABLE public.team_costs 
ALTER COLUMN transaction_date SET DEFAULT now();
```

**2. `backgroundSideEffects.ts`** -- Bij late penalty insert: gebruik `new Date().toISOString()` in plaats van `.split('T')[0]`, zodat het volledige tijdstip bewaard blijft.

**3. `financial-team-detail-modal.tsx`** -- Bij transacties met cost name "Boete te laat ingevuld": toon naast de datum ook het tijdstip (HH:mm:ss) uit `transaction_date`. Andere transacties blijven enkel de datum tonen.

**4. `costSettingsService.ts`** -- Geen wijziging nodig; `transaction_date` wordt al als string doorgegeven.

### Bestanden
1. Nieuwe SQL migratie -- type conversie
2. `src/services/match/backgroundSideEffects.ts` -- volledige ISO timestamp bij late penalty
3. `src/components/modals/financial/financial-team-detail-modal.tsx` -- tijdstip tonen bij boetes

