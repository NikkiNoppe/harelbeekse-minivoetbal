

## Verbetering /admin/schorsingen pagina

### Huidige problemen
1. **Kaarten Overzicht** toont "Wachtend/Actief" badges via `getStatusBadge()` -- moet weg, dit is puur een kaartenbalans
2. **Schorsingen** zijn te "zwaar" visueel met status badges (active/pending/completed) -- moet simpeler, chronologisch
3. Geen bewerkingsmodal voor bestaande schorsingen

### Plan

#### 1. PlayerCardsTable vereenvoudigen
- Verwijder de `getStatusBadge()` functie die "Wachtend"/"Actief" badges toont
- Toon alleen gele en rode kaartenaantallen per speler -- dat is de balans
- Houd de huidige sortering (team, dan speler)

#### 2. SuspensionsTable/Card vereenvoudigen
- Verwijder de status badge (active/pending/completed) volledig
- Maak een compacte, minimale weergave per schorsing:
  ```
  Speler Naam (Team)
  Geschorst voor wedstrijd: 15 september 2025 - tegen Shaktar Belledune
  Wedstrijden: 1
  ```
- Sorteer chronologisch op `cardDate` of `suspendedForMatch.date`
- Voeg een edit-knop toe (potlood icoon) per schorsing voor de admin

#### 3. EditSuspensionModal aanmaken (nieuw bestand)
- Zelfde structuur als `AddSuspensionModal` maar prefilled met bestaande data
- Velden: reden, aantal wedstrijden, notities
- Opslaan via `suspensionService.updateSuspension()`
- Verwijder-optie via danger button

#### 4. SuspensionFilters aanpassen
- Verwijder het status-filter (statussen bestaan niet meer visueel)
- Houd alleen het team-filter

#### 5. SchorsingenPage AdminView aanpassen
- Verwijder `statusFilter` state
- Koppel edit handler aan SuspensionsTable
- Wire nieuwe EditSuspensionModal

### Bestanden te wijzigen/maken
- `src/components/pages/admin/schorsingen/components/PlayerCardsTable.tsx` -- verwijder statusBadge logica
- `src/components/pages/admin/schorsingen/components/SuspensionsTable.tsx` -- compacte weergave, geen status, edit knop
- `src/components/pages/admin/schorsingen/components/SuspensionFilters.tsx` -- verwijder status filter
- `src/components/pages/admin/schorsingen/components/EditSuspensionModal.tsx` -- nieuw
- `src/components/pages/admin/schorsingen/components/index.ts` -- export toevoegen
- `src/components/pages/admin/schorsingen/SchorsingenPage.tsx` -- wire edit modal, verwijder statusFilter

