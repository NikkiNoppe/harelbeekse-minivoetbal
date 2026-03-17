

## Plan: Automatische boetes bij onvolledig wedstrijdformulier

### Validatieregels per team bij afsluiting (`isCompleted = true`)

```text
Per team (thuis + uit apart):
├── 0 spelers ingevuld?
│   └── → Boete "Wedstrijdformulier niet ingevuld" (id: 21, €10,00)
└── Spelers aanwezig maar:
    ├── < 4 spelers MET rugnummer?
    │   └── → Boete "Wedstrijdformulier niet correct ingevuld" (id: 16, €5,00)
    └── Geen kapitein aangeduid?
        └── → Boete "Wedstrijdformulier niet correct ingevuld" (id: 16, €5,00)
```

Belangrijk verschil: rugnummer-check telt hoeveel spelers een rugnummer hebben (niet hoeveel er geen hebben). Een speler zonder rugnummer mag op het formulier staan (bv. last-minute afmelding), maar er moeten minstens 4 spelers met rugnummer zijn.

De twee boetes zijn wederzijds exclusief: 0 spelers → alleen "niet ingevuld". Anders → eventueel "niet correct ingevuld".

### Wijzigingen

**`src/services/match/backgroundSideEffects.ts`**
- Nieuwe functie `syncFormCompletionPenalties(ctx, matchId, matchInfo, updateData)`
- Per team (`homePlayers` / `awayPlayers`):
  - Filter spelers met `playerId !== null`
  - 0 spelers → lookup cost by name `'Wedstrijdformulier niet ingevuld'` → idempotent insert in `team_costs`
  - \>0 spelers maar `< 4 met jerseyNumber` OF `geen isCaptain` → lookup cost by name `'Wedstrijdformulier niet correct ingevuld'` → idempotent insert
- Idempotent: check bestaand record op `match_id + team_id + cost_setting_id` voor insert
- Wordt aangeroepen in `scheduleBackgroundSideEffects` wanneer `updateData.isCompleted === true`, als nieuwe `executeWithRetry` stap

### Bestanden
1. `src/services/match/backgroundSideEffects.ts` — 1 nieuwe side effect functie + aanroep in scheduler

