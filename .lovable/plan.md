

## Scheidsrechter Notities Overzicht (Admin Profiel)

### Concept

Een nieuw kader op `/profile` (alleen voor admin) dat alle scheidsrechternotities uit wedstrijdformulieren toont. Ongelezen notities staan bovenaan in een open lijst; afgevinkte ("gelezen") notities schuiven naar een ingeklapte sectie onderaan.

### Visueel ontwerp

```text
┌─────────────────────────────────────────────┐
│ 📋 Scheidsrechter Notities          (3 nieuw)│
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ ☐  W12 · FC Alpha vs FC Beta           │ │
│ │    12 jan 2025 · Ref: janssen           │ │
│ │    "Speler #5 protesteerde herhaaldelijk"│ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ☐  W15 · FC Gamma vs FC Delta          │ │
│ │    19 jan 2025 · Ref: devos             │ │
│ │    "Wedstrijd 5 min later gestart"      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ▸ Gelezen notities (4)                      │
│   (ingeklapt, klikbaar om te openen)        │
└─────────────────────────────────────────────┘
```

### Technisch

**Data ophalen**: Query `matches` tabel waar `referee_notes IS NOT NULL` en `referee_notes != ''` en `is_submitted = true`. Join met `teams` voor teamnamen. Sorteren op `match_date DESC`.

**Gelezen-status**: Opslaan in `localStorage` (`admin_read_referee_notes` key, array van match_id's). Geen DB-wijziging nodig -- dit is persoonlijke admin-voorkeur, niet gedeeld.

**Component**: `RefereeNotesCard` -- nieuw component inline in `UserProfilePage.tsx`:
- Fetch via `withUserContext` + supabase query
- Split in `unread` en `read` lijsten op basis van localStorage
- Checkbox per notitie om te markeren als gelezen
- Gelezen notities in `Collapsible` sectie
- Badge met aantal ongelezen

**Plaatsing**: Na de UserTeamInfoCard, voor de NextMatchCard, alleen zichtbaar als `isAdmin`.

### Bestanden

1. **`src/components/pages/user/UserProfilePage.tsx`** -- nieuw `RefereeNotesCard` component toevoegen + renderen in admin view

Geen database migraties nodig.

