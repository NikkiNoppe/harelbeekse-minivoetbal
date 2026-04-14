

## Plan: Verdere uniformisatie van Competition, Beker en Playoff admin pages

### Huidige structurele verschillen

| Sectie | Competitie | Beker | Playoff |
|--------|-----------|-------|---------|
| Loading state | Geen (data laadt stil) | Loader2 spinner ✓ | Loader2 spinner ✓ |
| Aanmaken card | CardHeader patroon ✓ | CardHeader patroon ✓ | CardHeader patroon ✓ |
| Beheren card | CardHeader + Alert + stats ✓ | CardHeader + Alert + stats ✓ | **Geen aparte card** - inline status cards met eigen stijl |
| Verwijderen card | Aparte Card met CardHeader ✓ | Aparte Card met CardHeader ✓ | **Geen aparte card** - delete button in status cards |
| Status cards | Alert-based | Alert-based | Custom inline cards met gekleurde borders en icon-circles |
| Planning overzicht | Preview in tabel | Preview in tabel | Losse `<div>` met week cards, geen omsluitende Card |
| Date selector | N.v.t. | Raw `<div>` overlay met `fixed inset-0` | N.v.t. |
| Lege staat | Alert in Beheren card | Alert in Beheren card | Aparte centered Card |

### Wijzigingen

**1. CompetitionPage.tsx**
- Loading spinner toevoegen bij initieel laden (zoals Beker)
- Geen verdere structurele wijzigingen nodig (is al het referentie-patroon)

**2. BekerPage.tsx**
- Date selector overlay vervangen door `AppModal` component (consistent met modal design system)
- Verder al uniform met Competition

**3. AdminPlayoffPage.tsx** (meeste werk)
- **Beheren card toevoegen**: Concept/Finalized status omzetten naar een "Playoffs Beheren" Card met CardHeader/CardTitle/CardDescription, met daarin de status Alert en actie-buttons (zoals Competition en Beker)
- **Verwijderen card toevoegen**: Aparte "Playoffs Verwijderen" Card met dezelfde structuur als Competition en Beker (Alert waarschuwing + destructive Button)
- **Planning per Week in Card**: Week-overzicht verpakken in een Card met CardHeader ("Planning per Week" als CardTitle)
- **Lege staat uniformiseren**: Gebruik Alert in Beheren card i.p.v. aparte centered Card

### Gemeenschappelijk patroon na wijzigingen

```text
┌─────────────────────────────────────┐
│ [Trophy] Titel                      │
│ Subtitel                            │
│ [WorkflowStepper - alleen playoff]  │
├─────────────────────────────────────┤
│ Card: Nieuwe [X] Aanmaken           │
│   CardHeader + CardTitle            │
│   CardContent: config + buttons     │
├─────────────────────────────────────┤
│ Card: [X] Beheren                   │
│   CardHeader + CardTitle            │
│   CardContent:                      │
│     - Alert (actief/inactief)       │
│     - Stats/details                 │
│     - Actie-buttons (finaliseer..)  │
├─────────────────────────────────────┤
│ Card: [X] Verwijderen               │
│   CardHeader + CardTitle            │
│   CardContent:                      │
│     - Alert waarschuwing            │
│     - Destructive button            │
├─────────────────────────────────────┤
│ Card: Overzicht/Planning (optioneel)│
│   CardHeader + CardTitle            │
│   CardContent: preview/week data    │
└─────────────────────────────────────┘
```

### Bestanden die worden gewijzigd
- `src/components/pages/admin/competition/CompetitionPage.tsx` — loading state toevoegen
- `src/components/pages/admin/beker/components/BekerPage.tsx` — date selector naar AppModal
- `src/components/pages/admin/AdminPlayoffPage.tsx` — status cards herstructureren naar Beheren/Verwijderen Cards, week display in Card

### Wat niet verandert
- Geen backend wijzigingen
- WorkflowStepper blijft (uniek voor playoff maar waardevol)
- Standings tabel blijft (uniek voor playoff)
- Alle functionaliteit blijft exact hetzelfde

