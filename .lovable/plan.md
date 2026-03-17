

## Plan: Fix Kostenlijst Beheer — Updates werken niet + inline bewerking

### Hoofdoorzaak: RLS blokkeert updates stil

De `FinancialSettingsModal` (de modal die daadwerkelijk wordt gebruikt op `/admin/financial`) roept `enhancedCostSettingsService.updateCostSetting()` aan. Deze functie voert de Supabase `.update()` uit **zonder `withUserContext()`**. 

De `costs` tabel heeft een RLS policy: `get_current_user_role() = 'admin'` voor mutaties. Zonder `withUserContext()` retourneert `get_current_user_role()` een lege string → de update wordt **stil geblokkeerd** door RLS (0 rows affected, geen error). Vandaar dat er niets in de database verandert.

Dezelfde bug geldt voor `addCostSetting`.

### Wijzigingen

**1. `src/services/financial/enhancedCostSettingsService.ts`** — Wrap mutaties in `withUserContext`
- `updateCostSetting`: wrap de `.update()` call op `costs` én de cascade `.update()` op `team_costs` in `withUserContext`
- `addCostSetting`: wrap de `.insert()` call in `withUserContext`
- Dit zorgt ervoor dat de admin RLS context correct wordt ingesteld vóór elke schrijfoperatie

**2. `src/components/modals/financial/financial-settings-modal.tsx`** — Inline bewerking onder geselecteerde rij
- Verwijder het huidige "top form" patroon voor bewerking (het formulier dat bovenaan verschijnt bij edit)
- Voeg inline edit toe: bij klik op Edit verschijnt een compacte rij met naam + bedrag velden direct **onder** het geselecteerde item
- Twee knoppen: "Opslaan" en "Annuleren"
- Het "Nieuw Tarief" formulier bovenaan blijft ongewijzigd (enkel voor nieuwe items)
- Na succesvol opslaan: invalidate ook `financial-overview` query cache

### Bestanden
1. `src/services/financial/enhancedCostSettingsService.ts` — 2 functies wrappen met `withUserContext`
2. `src/components/modals/financial/financial-settings-modal.tsx` — Inline edit UI

