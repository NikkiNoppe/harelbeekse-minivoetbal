

## Plan: Uniformiseren van Competition, Cup en Playoff admin pages

### Huidige inconsistenties

| Aspect | Competitie | Beker | Playoff |
|--------|-----------|-------|---------|
| Page header | Geen icoon, `text-2xl font-bold` | Geen icoon, zelfde stijl | Heeft icoon, andere spacing |
| Spacing | `space-y-8` | `space-y-8` | `space-y-6` |
| Delete bevestiging | Browser `confirm()` | `AppAlertModal` | `AppAlertModal` |
| Button stijl | Mix `<button className="btn">` + `<Button>` | Mix `<button className="btn">` | `<Button>` component |
| Loading state | Geen indicator | Tekst "Teams laden..." | Loader2 spinner |
| Beheer + Verwijder cards | 2 aparte cards | 2 aparte cards | Inline status cards |

### Wijzigingen

**1. CompetitionPage.tsx - Uniformiseren**
- Icoon toevoegen aan header (Trophy)
- `confirm()` vervangen door `AppAlertModal` voor verwijderen
- Alle `<button className="btn ...">` vervangen door `<Button>` component met juiste variants
- Loading state toevoegen met Loader2 spinner (consistent met Playoff)
- Spacing normaliseren naar `space-y-6`

**2. BekerPage.tsx - Uniformiseren**
- Icoon toevoegen aan header (Trophy)
- Alle `<button className="btn ...">` vervangen door `<Button>` component
- Loading state vervangen door Loader2 spinner in plaats van tekst
- Spacing normaliseren naar `space-y-6`
- Date selector modal: gebruik AppModal of overlay consistent met design system

**3. AdminPlayoffPage.tsx - Kleine aanpassingen**
- Header subtitle toevoegen zoals Competition en Beker ("Beheer de playoffs - ...")
- Beheer/Verwijder secties herstructureren naar zelfde Card-patronen als Competition en Beker (CardHeader + CardTitle + CardDescription + CardContent)

### Gemeenschappelijk patroon na wijzigingen

```text
┌─────────────────────────────────────┐
│ [Icon] Titel                        │
│ Subtitel beschrijving               │
├─────────────────────────────────────┤
│ Card: Nieuwe [X] Aanmaken           │
│   - Config velden                   │
│   - Preview + Create + Cancel btns  │
│   - AppAlertModal bevestiging       │
├─────────────────────────────────────┤
│ Card: [X] Beheren                   │
│   - Status alert (actief/inactief)  │
│   - Statistieken                    │
├─────────────────────────────────────┤
│ Card: [X] Verwijderen               │
│   - Waarschuwing alert              │
│   - Destructive button              │
│   - AppAlertModal bevestiging       │
└─────────────────────────────────────┘
```

### Bestanden die worden gewijzigd
- `src/components/pages/admin/competition/CompetitionPage.tsx`
- `src/components/pages/admin/beker/components/BekerPage.tsx`
- `src/components/pages/admin/AdminPlayoffPage.tsx`

Geen backend wijzigingen. Puur visuele en UX-uniformisatie.

