
## Fixplan: spelerslijst van referee wordt nog steeds niet meegestuurd

### Wat ik gecontroleerd heb
- De database-functie `update_match_with_context` is al correct aangepast: referees **mogen nu** `home_players` en `away_players` opslaan.
- De blokkade zit nog in de frontend, in `src/components/modals/matches/wedstrijdformulier-modal.tsx`:
  - In `createUpdatedMatch` worden spelers voor referee expliciet op `undefined` gezet:
    - `homePlayers: (isReferee && !isAdmin) ? undefined : ...`
    - `awayPlayers: (isReferee && !isAdmin) ? undefined : ...`
  - Daardoor krijgt de RPC nog altijd geen spelersdata, ondanks “Succesvol”.

### Implementatie
1. **Referee-strip verwijderen in `createUpdatedMatch`**
   - Bestand: `src/components/modals/matches/wedstrijdformulier-modal.tsx`
   - Pas de opbouw van `updatedMatch` aan zodat spelersdata voor referee ook meegaat wanneer dirty:
   - `homePlayers: homePlayersDirty ? homePlayersWithNames : undefined`
   - `awayPlayers: awayPlayersDirty ? awayPlayersWithNames : undefined`
   - Commentaar updaten (nu klopt “Referees should NEVER include player data” niet meer).

2. **Dirty-tracking gedrag behouden**
   - Geen forced player payload.
   - Alleen meesturen als effectief gewijzigd (`homePlayersDirty/awayPlayersDirty`), zodat bestaande safeguards tegen onbedoeld overschrijven behouden blijven.

3. **Cup-pad hardenen tegen lege fallback**
   - Bestand: `src/services/match/enhancedMatchService.ts`
   - In de `isCupMatch` branch bij `matchFormData`:
     - vervang `homePlayers: updateData.homePlayers || []` door `homePlayers: updateData.homePlayers as any`
     - vervang `awayPlayers: updateData.awayPlayers || []` door `awayPlayers: updateData.awayPlayers as any`
   - Zo blijft `undefined` echt “niet wijzigen” en wordt niet stilzwijgend `[]` gestuurd.

4. **Validatie na fix (end-to-end)**
   - Ingelogd als referee op `/profile`.
   - Gespeelde wedstrijd openen, spelers invullen, **Opslaan**, modal sluiten en opnieuw openen.
   - Verwacht: spelers blijven zichtbaar.
   - Extra controle: DB-rij voor die match bevat `playerId` waarden (niet alleen 8 lege placeholders).

### Technische details
- Geen nieuwe migratie nodig (backend permissies staan al goed).
- Fix zit volledig in frontend payload-opbouw.
- Security/consistency blijft intact door:
  - bestaande `prevent_player_data_wipe` trigger
  - bestaande dirty-tracking architectuur.
