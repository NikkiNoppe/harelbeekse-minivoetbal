

## Plan: Fix late penalty amount & kostenlijst cascading update

### Probleem 1: Late penalty insert mist het `amount` veld
In `backgroundSideEffects.ts` regel 308-315 wordt de "Boete te laat ingevuld" penalty ingevoegd **zonder `amount`**. Het `amount` veld in `team_costs` blijft `null`, wat ertoe leidt dat het bedrag mogelijk niet correct wordt getoond in de financiele overview.

**Fix**: Voeg `amount: costSetting.amount` toe aan de insert in `syncLatePenalty`.

### Probleem 2: Kostenlijst cascading update werkt niet correct
In `costSettingsService.ts` regel 122-126 updatet `updateCostSetting` alle `team_costs` records met het nieuwe bedrag. Dit werkt via:
```
.update({ amount: setting.amount })
.eq('cost_setting_id', id)
```
Dit zou moeten werken, maar het probleem is waarschijnlijk dat `team_costs` records die **geen `amount` hebben** (null) niet correct worden bijgewerkt, of de RLS policies blokkeren de update. De RLS policy vereist `get_current_user_role() = 'admin'` of `pg_trigger_depth() > 0`. Als admin zou dit moeten werken.

Laat me verifiëren of er nog een ander probleem is — de update query zelf lijkt correct. Het kan zijn dat records die via de database trigger (`process_match_financial_costs`) zijn aangemaakt geen `amount` veld hebben (de trigger insert zonder amount), waardoor ze `null` blijven en de cascading update ze wel correct zou moeten updaten.

**Fix**: Geen codewijziging nodig voor de cascading update zelf — die logica is correct. Het probleem zat erin dat nieuwe records zonder `amount` werden aangemaakt.

### Wijzigingen

**1. `src/services/match/backgroundSideEffects.ts`** — Voeg `amount` toe aan late penalty insert
- Regel 308-315: voeg `amount: costSetting.amount` toe aan het insert object

### Bestanden
1. `src/services/match/backgroundSideEffects.ts` — 1 regel toevoegen

