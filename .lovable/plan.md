

## Beschikbaarheidsmatrix voor Scheidsrechter Toewijzingen

### Wat wordt gebouwd

Een nieuw **matrix/grid overzicht** als derde tab "Overzicht" op de /admin/scheidsrechters pagina, geïnspireerd op het Excel-screenshot. Dit geeft de admin een spreadsheet-achtige weergave met:

- **Rijen** = sessies (datum + locatie + tijdslot), gegroepeerd per week
- **Kolommen** = alle scheidsrechters
- **Groene cel** = scheidsrechter is beschikbaar (poll-data)
- **"✕" markering** = scheidsrechter is effectief toegewezen
- **Klik op groene cel** = wijs scheidsrechter direct toe aan die sessie

### Desktop weergave
```text
┌──────────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Datum / Locatie / Uur │ Marc D.  │ Franky V.│ Kenneth M│ Kevin V. │
├──────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ ma 2 mrt Harelbeke   │  [groen] │          │          │          │
│   19u00-21u00        │    ✕     │          │          │          │
├──────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ ma 2 mrt Bavikhove   │          │          │ [groen]  │          │
│   19u00-21u00        │          │          │          │          │
└──────────────────────┴──────────┴──────────┴──────────┴──────────┘
```

### Mobile weergave

Op mobile past een matrix met 8+ kolommen niet. In plaats daarvan wordt **per sessie een kaart** getoond met daarin de scheidsrechters als horizontale chips:
- Groene chip = beschikbaar
- Chip met "✕" = toegewezen
- Tik op groene chip = toewijzen

### Technische aanpak

**1. Nieuw component: `src/components/pages/admin/scheidsrechter/components/AvailabilityMatrix.tsx`**

Dit component:
- Haalt voor de geselecteerde maand op: alle matches (gegroepeerd per sessie), alle referees, alle beschikbaarheidsdata uit `referee_availability`, en alle huidige toewijzingen
- Bouwt een matrix: rijen = sessies (datum+locatie+tijdslot), kolommen = referees
- Cellen tonen: leeg (niet beschikbaar/geen reactie), groen (beschikbaar), ✕ in groene cel (toegewezen)
- Klik op een groene cel roept `assignmentService.assignReferee()` aan en refresht
- Desktop: horizontaal scrollbare tabel met sticky eerste kolom
- Mobile: kaart-per-sessie layout met chips

**2. Tab toevoegen in `ScheidsrechtersPage.tsx`**

Nieuwe tab "Overzicht" met een grid/matrix icoon, als eerste tab (standaard actief). De bestaande "Toewijzingen" en "Polls" tabs blijven ongewijzigd.

**3. Data ophalen**

Het component combineert:
- `supabase.from('matches')` gefilterd op maand (reeds bestaand patroon uit AssignmentManagement)
- `refereeAvailabilityService.getAvailabilityForPoll(month)` voor beschikbaarheidsdata per referee
- `supabase.from('users').eq('role', 'referee')` voor de kolomkoppen
- `assignmentService` functies voor toewijzing/verwijdering

**4. Interactie**

- Klik op beschikbare (groene) cel → bevestigingspopup → toewijzen
- Klik op toegewezen (✕) cel → verwijder toewijzing
- Maandfilter bovenaan (hergebruik bestaande `getMonthOptions`)

### Bestanden die gewijzigd/aangemaakt worden

| Bestand | Actie |
|---------|-------|
| `src/components/pages/admin/scheidsrechter/components/AvailabilityMatrix.tsx` | **Nieuw** - Matrix component |
| `src/components/pages/admin/scheidsrechter/components/index.ts` | Export toevoegen |
| `src/components/pages/admin/scheidsrechter/ScheidsrechtersPage.tsx` | Derde tab "Overzicht" toevoegen |

