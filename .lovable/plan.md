

## Analyse: Spelerslijsten worden overschreven bij opslaan door referee

### Hoofdoorzaak: Race condition bij gelijktijdige bewerkingen

Het probleem zit in de `WedstrijdformulierModal` + `enhancedMatchService`:

1. **Team manager** laadt wedstrijd → vult spelers in → slaat op ✅
2. **Referee** had de wedstrijd **eerder** al geladen (vóór stap 1) → ziet lege spelerslijsten
3. Referee vult enkel scores in en drukt op "Opslaan"
4. `createUpdatedMatch()` (regel 620-621) stuurt **altijd** `homePlayers` en `awayPlayers` mee — ook al heeft de referee die niet gewijzigd
5. `enhancedMatchService.updateMatch` (regel 176-177) detecteert `homePlayers !== undefined` → stuurt ze mee naar de database
6. De RPC `update_match_with_context` ziet `home_players` key in de payload → **overschrijft** met de stale (lege) data ❌

Kernprobleem: het formulier verstuurt **altijd** de volledige spelerslijst, zelfs als de gebruiker deze niet heeft gewijzigd. Hierdoor overschrijft een referee of admin met verouderde data de spelerslijst die een team manager net had ingevuld.

### Oplossing: Dirty tracking voor spelerslijsten

Bijhouden of de spelerslijst daadwerkelijk is gewijzigd door de gebruiker. Alleen gewijzigde spelerslijsten meesturen in de update.

### Wijzigingen

**1. `src/components/pages/admin/matches/hooks/useMatchFormState.ts`**
- Twee nieuwe state booleans: `homePlayersDirty` en `awayPlayersDirty` (default `false`)
- Worden `true` gezet wanneer `setHomeTeamSelections`/`setAwayTeamSelections` wordt aangeroepen buiten de sync-useEffect
- Wrapper-functies: `setHomeTeamSelectionsTracked` en `setAwayTeamSelectionsTracked` die de dirty flag zetten
- De sync-useEffect reset de dirty flags naar `false`
- Exporteer `homePlayersDirty` en `awayPlayersDirty`

**2. `src/components/modals/matches/wedstrijdformulier-modal.tsx`**
- In `createUpdatedMatch`: alleen `homePlayers` meegeven als `homePlayersDirty === true`, anders de originele `match.homePlayers` doorsturen (of helemaal weglaten)
- Idem voor `awayPlayers` met `awayPlayersDirty`
- Alle bestaande calls naar `setHomeTeamSelections`/`setAwayTeamSelections` vervangen door de tracked versies
- De player name sync effect (regels 520-556) moet de dirty flag NIET triggeren — dit is cosmetisch, niet een echte wijziging

**3. `src/services/match/enhancedMatchService.ts`**
- In `updateMatch`: als `homePlayers` `undefined` is in de updateData, deze key NIET opnemen in `updateObject` (dit werkt al zo, regel 176-177)
- Geen wijziging nodig hier, het werkt al correct met `undefined`

**4. `src/components/pages/admin/matches/hooks/useEnhancedMatchFormSubmission.ts`**
- In `submitMatchForm`: als `matchData.homePlayers` `undefined` is (niet dirty), niet meesturen als `[]` maar als `undefined`
- Regel 20-21 aanpassen: `const homePlayersToSave = matchData.homePlayers;` (zonder `|| []` fallback)

### Effect
- Als de referee enkel scores invult → `homePlayers` en `awayPlayers` zijn `undefined` in de update → database behoudt bestaande spelerslijsten
- Als de referee wél spelers wijzigt → dirty flag is `true` → data wordt meegestuurd en opgeslagen
- Team managers wijzigen altijd spelers → dirty flag wordt `true` → werkt zoals voorheen

### Bestanden
1. `src/components/pages/admin/matches/hooks/useMatchFormState.ts` — dirty tracking toevoegen
2. `src/components/modals/matches/wedstrijdformulier-modal.tsx` — dirty flags gebruiken in createUpdatedMatch + tracked setters
3. `src/components/pages/admin/matches/hooks/useEnhancedMatchFormSubmission.ts` — undefined doorlaten i.p.v. `|| []`

