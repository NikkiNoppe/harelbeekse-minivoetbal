

## Plan: Wedstrijdformulier uitbreidingen (4 onderdelen)

### 1. Scheidsrechter leeg kunnen laten

**Probleem:** Het Radix `Select` component heeft geen "geen selectie" optie. Er is geen manier om de scheidsrechter terug op leeg te zetten.

**Oplossing:** In `wedstrijdformulier-modal.tsx`:
- Voeg een "Geen scheidsrechter" optie toe aan de Select dropdown (boven de lijst met scheidsrechters):
  ```
  <SelectItem value="__none__">Geen scheidsrechter</SelectItem>
  ```
- In `onValueChange`: als waarde `"__none__"` is, zet `selectedReferee` op `""` (lege string)
- In `createUpdatedMatch`: stuur `referee: selectedReferee || null` zodat lege string als `null` naar de database gaat
- In `refereeSelectValue` memo: als `selectedReferee` leeg is, return `undefined` (wat al zo is)

### 2. Boetes verwijderen werkt niet (alleen UI, niet in database)

**Probleem:** De `removeSavedPenalty` functie (regel 267-269) verwijdert alleen uit de lokale `savedPenalties` state. Er wordt geen database-call gedaan. Na heropenen laadt de modal de penalties opnieuw uit de database, waardoor ze terugkomen.

**Oplossing:** In `wedstrijdformulier-modal.tsx`:
- `savedPenalties` moet de `id` van de `team_costs` rij bevatten (nu ontbreekt dit)
- Pas de penalty-laad-logica aan (regel 141-161): haal ook het `id` veld mee in `savedPenalties`
- Pas `removeSavedPenalty` aan: roep `costSettingsService.deleteTransaction(penaltyId)` aan en verwijder pas uit state na succesvolle DB-delete
- Voeg `withUserContext` wrapping toe in de delete-call als nodig (admin RLS)

### 3. Financieel kadertje (admin-only, match-gebonden kosten CRUD)

**Probleem:** Admin wil alle kosten verbonden aan een wedstrijd zien en beheren (veldkosten, administratie, scheidsrechter, boetes) vanuit het wedstrijdformulier.

**Oplossing:** In `wedstrijdformulier-modal.tsx`:
- Nieuw collapsible sectie "Financieel" toevoegen, alleen zichtbaar voor `isAdmin`
- Geplaatst na de Boetes sectie, zelfde styling (Collapsible + Card)
- Bij openen: query `team_costs` voor `match_id = match.matchId` (beide teams), inclusief `costs` join
- Toon lijst van alle kosten per team met: kostnaam, bedrag, team
- CRUD mogelijkheden:
  - **Verwijderen**: rode trash-knop per rij, roept `costSettingsService.deleteTransaction(id)` aan
  - **Bedrag aanpassen**: inline edit (klik op bedrag → input), roept `costSettingsService.updateTransaction(id, { amount })` aan
  - **Toevoegen**: knop "Kost toevoegen" met team-selector + cost-type dropdown (alle actieve costs) → insert via `costSettingsService.addTransaction()`
- State: `matchCosts` array geladen bij modal open, `isFinancieelOpen` collapsible state
- Alle DB-calls via `withUserContext` voor admin RLS

### 4. Scheidsrechter veld leeg opslaan in database

**Probleem:** De `update_match_with_context` functie stuurt `referee` altijd mee. Als de waarde `""` is, wordt dit opgeslagen als lege string in plaats van `NULL`.

**Oplossing:** In `enhancedMatchService.ts`: zorg dat `referee` als `null` wordt meegestuurd wanneer leeg:
```typescript
referee: updateData.referee || null
```
Dit werkt al correct omdat de RPC `CASE WHEN p_update_data ? 'referee'` gebruikt en de waarde gewoon `null` accepteert.

### Technische details

| Bestand | Wijziging |
|---------|-----------|
| `wedstrijdformulier-modal.tsx` | "Geen scheidsrechter" optie, penalty delete fix, nieuw Financieel sectie |
| `enhancedMatchService.ts` | referee `""` → `null` mapping |
| Geen database-migraties nodig | Bestaande `team_costs` tabel + `costs` join volstaan |

### Veiligheid
- Financieel sectie alleen zichtbaar voor admin
- Delete/update calls gaan via bestaande RLS policies (admin-only op `team_costs`)
- `withUserContext` wrapping voor alle financiële DB-calls

