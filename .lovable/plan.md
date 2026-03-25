
Doel: zorgen dat verwijderen van boetes/kosten in het wedstrijdformulier echt in DB blijft staan (ook na “Opslaan” en ook zichtbaar correct in /admin/financial), zonder visuele wijzigingen.

1) Oorzaak vastzetten (waarom “Succesvol” toch terugkomt)
- Delete zelf werkt via `delete_team_cost_as_admin` op `team_costs`.
- Daarna wordt bij “Opslaan” opnieuw automatische synchronisatie gestart die records terug toevoegt:
  - `scheduleBackgroundSideEffects(...)` draait nu bij elke submit met `isCompleted=true` ook `syncFormCompletionPenalties` (boetes) en `syncMatchCosts` (kosten).
  - `process_match_costs_trigger` op `matches` kan match costs opnieuw aanmaken zodra `home_score/away_score/is_submitted` in update zitten.
  - `/admin/financial` triggert bij mount ook `syncAllMatchCosts()`, wat verwijderde match_costs opnieuw kan aanmaken.

2) Zelfde principe als spelers toepassen: “dirty/changed-only” updates
- In `enhancedMatchService.updateMatch` eerst huidige matchwaarden ophalen (scores, submitted, referee, players).
- Alleen velden in `updateObject` zetten die effectief gewijzigd zijn (zoals bij players dirty tracking).
- Gevolg: bij enkel boete/kost verwijderen + opslaan (zonder matchdata-wijziging) geen onnodige update van score/submitted => geen auto-recreate.

3) Side effects conditioneel maken (niet altijd)
- In `backgroundSideEffects.ts` extra flags gebruiken:
  - `playersChanged`
  - `submissionTransition` (false→true)
  - `scoreOrRefereeChanged`
- `syncFormCompletionPenalties` enkel uitvoeren bij `playersChanged` of `submissionTransition`.
- `syncMatchCosts` enkel uitvoeren bij `submissionTransition` of echte score/referee wijziging.
- Bij penalty-berekening fallback op bestaande DB players als payload geen players bevat (undefined ≠ leeg).

4) /admin/financial mag niet stilzwijgend “herstellen” wat admin net verwijderde
- In `FinancialPage.tsx` automatische `matchCostService.syncAllMatchCosts()` on mount uitschakelen.
- Pagina blijft wel volledig up-to-date via query refetch/invalidation (al aanwezig), maar zonder deleted records terug te creëren.

5) Validatie (gericht op jouw case)
- Match `2232` (Shaktar Belledune - MVC 't Brouwputje):
  - boete verwijderen in Boetes, opslaan, modal heropenen: blijft weg.
  - zelfde in Financieel: blijft weg.
  - naar `/admin/financial`: blijft weg.
- SQL-check op `team_costs where match_id=2232` voor/na acties om te bevestigen dat DB echt mee wijzigt.

Technische impact (geen UI-styling wijzigingen):
- `src/services/match/enhancedMatchService.ts` (changed-only payload + flags)
- `src/services/match/backgroundSideEffects.ts` (conditionele sync)
- `src/components/pages/admin/financial/FinancialPage.tsx` (auto sync on mount verwijderen)
- Geen migratie vereist.
