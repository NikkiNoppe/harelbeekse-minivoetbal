

## Analyse huidige situatie

**Probleem**: In `RefereeUpcomingMatches` (regel 897-909) worden wedstrijden gefilterd op alleen "Open" status. Zodra een wedstrijd gesloten/gelockt is of gestart, verdwijnt deze uit de lijst -- ook als de scores nog niet zijn ingevuld. De `useRefereeMatches` hook filtert ook al completed matches weg (regel 62-64: `home_score === null && away_score === null`).

**Gewenst gedrag**:
1. Wedstrijden zonder scores blijven **altijd** zichtbaar (ook als locked/gestart)
2. Afgelopen wedstrijden (met scores) worden getoond in een **inklapbare sectie**
3. Filter per maand voor historische wedstrijden

---

## Plan

### 1. `useRefereeMatches` hook aanpassen
- **Alle** wedstrijden ophalen voor de geselecteerde maand (niet meer filteren op `home_score === null`)
- De hook retourneert het volledige resultaat; filtering naar "nog in te vullen" vs "afgelopen" gebeurt in de UI

### 2. `RefereeUpcomingMatches` component herstructureren
De wedstrijden worden opgedeeld in twee groepen:

**Groep A -- "Te spelen / In te vullen"** (altijd zichtbaar, expanded)
- Wedstrijden waar scores nog `null` zijn, ongeacht lock-status
- Sorteer chronologisch (oplopend)
- Toon status-badge: "Open", "Gesloten" of "Gestart" zodat de scheidsrechter weet wat de status is
- Clickable om wedstrijdformulier te openen (zoals nu)

**Groep B -- "Afgelopen wedstrijden"** (collapsible, standaard ingeklapt)
- Wedstrijden waar scores zijn ingevuld (`home_score !== null && away_score !== null`)
- Gebruik `Collapsible` (Radix) component
- Toon kort: teamnamen, datum, score
- Clickable om wedstrijdformulier readonly te bekijken
- Sorteer chronologisch (aflopend, meest recente bovenaan)

### 3. Maandfilter uitbreiden
- Huidige filter toont alleen huidige + volgende maand
- Uitbreiden met **vorige maanden** van het lopende seizoen (bijv. september t/m huidige maand + volgende maand)
- Dit geeft de scheidsrechter toegang tot zijn historiek

### 4. Visuele structuur

```text
┌─────────────────────────────────────┐
│ 📅 Komende Wedstrijden  [Mrt 2026▾]│
├─────────────────────────────────────┤
│                                     │
│  ── Te spelen / In te vullen (2) ── │
│  ┌─ Match Card (Gesloten) ────────┐ │
│  │ Team A vs Team B  ·  15 mrt    │ │
│  └────────────────────────────────┘ │
│  ┌─ Match Card (Open) ───────────┐ │
│  │ Team C vs Team D  ·  22 mrt   │ │
│  └────────────────────────────────┘ │
│                                     │
│  ▶ Afgelopen wedstrijden (3)        │
│    (click to expand)                │
│  ┌─ Match Card ──────────────────┐ │
│  │ Team E 2-1 Team F  ·  8 mrt  │ │
│  └────────────────────────────────┘ │
│  ...                                │
└─────────────────────────────────────┘
```

### Bestanden te wijzigen
- `src/hooks/useRefereeMatches.ts` -- verwijder score-filter, retourneer alles
- `src/components/pages/user/UserProfilePage.tsx` -- herstructureer `RefereeUpcomingMatches` met twee groepen + collapsible + uitgebreide maandfilter

