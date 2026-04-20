

## Plan: Finale automatisch invullen na halve finales

### Situatie

De halve finales zijn afgerond:
- **SF-1**: Team 16 (9) vs Team 5 (2) → winnaar **Team 16**
- **SF-2**: Team 2 (5) vs Team 4 (3) → winnaar **Team 2**

Maar de **Finale** (match_id 1286) staat nog leeg (home en away = `null`). De automatische doorstroming heeft niet plaatsgevonden, vermoedelijk omdat de halve finales destijds zijn opgeslagen via een pad dat `autoAdvanceWinner` niet triggerde, of vóór de doorstroom-logica volledig werkte.

### Bestaande logica (geen wijziging nodig)

In `cupService.ts` bestaat al alle benodigde logica:
- `autoAdvanceWinner(matchId)` → bepaalt winnaar uit scores
- `getNextMatchUniqueNumber('SF-1')` → `'FINAL'`
- `shouldBeHomeTeam('SF-1', 1)` → `true` (oneven = home)
- `shouldBeHomeTeam('SF-2', 2)` → `false` (even = away)

Resultaat: Team 16 thuis, Team 2 uit in de finale.

### Oplossing (2 stappen)

**Stap 1 — Eenmalige correctie via SQL migratie**

De finale direct invullen met de huidige winnaars zodat de bracket meteen klopt:

```sql
UPDATE matches 
SET home_team_id = 16, away_team_id = 2
WHERE match_id = 1286 AND unique_number = 'FINAL';
```

**Stap 2 — Robustness fix in `matchesFormService.updateMatchForm`**

Onderzoeken waarom `autoAdvanceWinner` niet getriggerd werd toen de halve finales werden ingediend. Mogelijke oorzaken:
- De voorwaarde `matchData.homeScore !== undefined && matchData.awayScore !== undefined` faalt als scores als `null` binnenkomen
- De `is_cup_match` check faalt door een edge case

We checken in `cupService.advanceWinner` of die call ook gebeurt bij latere score-updates en niet alleen bij eerste indiening. De huidige logica triggert wél bij score-wijzigingen — de meest waarschijnlijke oorzaak is dat de scores van de halve finales handmatig in de database zijn aangepast (niet via het wedstrijdformulier), waardoor de service-laag werd overgeslagen.

Geen code-wijziging nodig hier; we voegen alleen een **defensieve fallback** toe: bij het laden van de bekerpagina checkt een lichte hook of er afgeronde matches zijn waarvan de winnaar nog niet doorgeschoven is naar de volgende ronde, en doet dat dan alsnog.

Concreet: nieuwe utility `cupService.reconcileAdvancements()` die:
1. Alle ingediende cup-matches met scores ophaalt
2. Per match controleert of de volgende ronde de winnaar bevat
3. Zo niet → `advanceWinner` aanroept

Deze wordt aangeroepen vanuit `BekerPage.tsx` (admin) bij mount, achter een feature flag/admin-only.

### Bestanden die wijzigen

- **Migratie**: één UPDATE statement voor match_id 1286
- `src/services/match/cupService.ts` — nieuwe functie `reconcileAdvancements()` toevoegen
- `src/components/pages/admin/beker/components/BekerPage.tsx` — eenmalige call op mount voor admins

### Wat niet verandert

- Geen wijziging aan bestaande `autoAdvanceWinner` / `advanceWinner` logica
- Geen wijziging aan RLS policies of database functies
- Geen wijziging aan andere admin pages

