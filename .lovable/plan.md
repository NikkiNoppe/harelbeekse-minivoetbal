

## Plan: Gestyleerde boete-bevestiging met team-specifieke logica

### Probleem
1. De boete-bevestiging gebruikt `window.confirm()` — geen styling, past niet bij het design system
2. De boete wordt altijd voor **beide** teams voorgesteld, ook als slechts voor 1 team spelers werden aangepast

### Wijzigingen

**1. `wedstrijdformulier-modal.tsx`** — Vervang `window.confirm` door `AppAlertModal`
- Voeg state toe: `showLatePenaltyModal`, `latePenaltyTeams` (array van teamnamen die gewijzigd werden), en `pendingLatePenaltySubmission`
- Detecteer welke teams gewijzigd zijn door de huidige spelers te vergelijken met de originele `match.homePlayers` / `match.awayPlayers`:
  - Als home spelers gewijzigd → home team in de boete-lijst
  - Als away spelers gewijzigd → away team in de boete-lijst
- Toon `AppAlertModal` met dynamische tekst:
  - 1 team: *"Wil je een boete aanrekenen voor [teamnaam]?"*
  - 2 teams: *"Wil je een boete aanrekenen voor beide teams?"*
- Bij bevestiging: sla de betreffende team-IDs op en ga door met submit
- Bij annuleren: submit zonder boete

**2. `useEnhancedMatchFormSubmission.ts`** — Vervang `forceLatePenalty: boolean` door `forceLatePenaltyTeamIds: number[]`
- Geef de specifieke team-IDs door aan de service in plaats van een boolean

**3. `enhancedMatchService.ts`** — Accepteer `forceLatePenaltyTeamIds` in plaats van `forceLatePenalty`
- Geef de team-IDs door aan `scheduleBackgroundSideEffects`

**4. `backgroundSideEffects.ts`** — Accepteer optionele `latePenaltyTeamIds`
- In `syncLatePenalty`: als `latePenaltyTeamIds` meegegeven, gebruik alleen die IDs in plaats van beide teams
- `scheduleBackgroundSideEffects` krijgt een extra parameter `latePenaltyTeamIds?: number[]`

### Detectielogica voor gewijzigde teams

```text
function hasPlayersChanged(original, current):
  - Vergelijk geselecteerde spelers (playerId !== null)
  - Als verschil in aantal of in specifieke playerIds → team is gewijzigd
```

### Bestanden
1. `src/components/modals/matches/wedstrijdformulier-modal.tsx` — AppAlertModal + team-detectie
2. `src/components/pages/admin/matches/hooks/useEnhancedMatchFormSubmission.ts` — `forceLatePenaltyTeamIds`
3. `src/services/match/enhancedMatchService.ts` — doorgeef team-IDs
4. `src/services/match/backgroundSideEffects.ts` — team-specifieke penalty

