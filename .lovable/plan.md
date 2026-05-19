## Doel

Nieuwe **Archief / Geschiedenis** sectie waar per seizoen het eindklassement van de competitie en de bekerwinnaar (+ finale-uitslag) permanent bewaard worden. De admin maakt snapshots via één knop op het einde van het seizoen — zo blijven gegevens behouden ook nadat de actieve competitie/beker gewist wordt.

## Wat er bewaard wordt per seizoen

**Competitie:** eindklassement (positie, team, gespeeld, W/G/V, doelpunten voor/tegen, doelsaldo, punten) + seizoenlabel (bv. `2025-2026`).

**Beker:** winnaar, verliezer, eindstand finale, datum finale (optioneel strafschoppen). Geen halvefinalisten.

Geen losse wedstrijduitslagen.

## UI/UX

### Admin: archiveren

Twee nieuwe knoppen bovenaan de bestaande admin-pagina's, enkel zichtbaar voor `admin`:

1. **Competitiepagina (admin)** → knop `Seizoen archiveren` (primair, `Archive` icoon). Modal:
   - Seizoenlabel (auto-ingevuld, bewerkbaar)
   - Preview van het huidige eindklassement
   - Bij bestaand label: bevestigingswaarschuwing → admin kan overschrijven
   - Bevestigingsknop `Archiveer competitie`

2. **Bekerpagina (admin)** → knop `Beker archiveren`. Modal:
   - Seizoenlabel
   - Auto-detectie finale (winnaar/verliezer/score/datum) met manuele override (dropdown op cup-matches)
   - Bevestigingsknop

Beker en competitie kunnen los van elkaar gearchiveerd worden (UPSERT per veld).

### Publieke archiefpagina

Nieuwe route `/archief`, opgenomen in hoofdnavigatie naast `Competitie` / `Beker`. Daarnaast een **"Vorige seizoenen"** link/knop bovenaan zowel de publieke Competitie- als Bekerpagina die hier naartoe linkt.

**Layout:**
```text
+----------------------------------------------+
|  Archief                                     |
|  [2025-2026] [2024-2025] [2023-2024] ...    |  ← seizoen-chips
+----------------------------------------------+
|  ┌─ Bekerwinnaar ──┐ ┌─ Eindklassement ────┐|
|  │   🏆            │ │ 1. Team A   42 pts  │|
|  │  Team X         │ │ 2. Team B   38 pts  │|
|  │  4 - 2          │ │ 3. Team C   35 pts  │|
|  │  vs Team Y      │ │ ...                 │|
|  └─────────────────┘ └─────────────────────┘|
+----------------------------------------------+
```

- Mobile-first: verticaal gestapeld, bekerkaart eerst (visueel sterkst), dan klassement.
- Seizoenchips: horizontaal scrollbaar, meest recente links, actief seizoen geaccentueerd met primaire kleur.
- Lege state: vriendelijke melding "Nog geen gearchiveerde seizoenen".
- Klassement hergebruikt styling van `ResponsiveStandingsTable` voor consistentie.
- Bekerkaart: subtiele gradient + `Trophy` icoon uit lucide, accent op winnaar-teamnaam.

## Technisch

### Database

Nieuwe tabel `season_archives`:
- `season_label` (text, uniek) — bv. `2025-2026`
- `competition_standings` (jsonb, nullable) — array `{position, team_name, played, won, draw, lost, goals_for, goals_against, goal_diff, points}`
- `cup_winner` (jsonb, nullable) — `{winner, runner_up, score, date, penalties?}`
- `archived_at`, `archived_by`

**RLS:**
- `SELECT` voor `anon` + `authenticated`
- `INSERT/UPDATE/DELETE` enkel admin via `get_current_user_role() = 'admin'`
- Expliciete `GRANT SELECT` op `anon, authenticated` (volgens project-conventie, mem://security/supabase-grants-new-tables)

UPSERT op `season_label` met `COALESCE` zodat los archiveren van competitie/beker elkaar niet overschrijft. Overschrijven van een bestaand veld mag (bevestigd via modal).

### Frontend

Nieuwe bestanden:
- `src/services/archiveService.ts` — `getArchives()`, `getArchive(label)`, `archiveCompetition(label, standings)`, `archiveCup(label, cupData)`
- `src/hooks/useArchives.ts` — react-query hooks
- `src/components/pages/public/archive/ArchivePage.tsx`
- `src/components/pages/public/archive/SeasonSelector.tsx`
- `src/components/pages/public/archive/StandingsArchiveCard.tsx`
- `src/components/pages/public/archive/CupWinnerCard.tsx`
- `src/components/modals/admin/archive-season-modal.tsx`
- `src/components/modals/admin/archive-cup-modal.tsx`

Aanpassingen:
- `src/config/routes.ts` — route `/archief`
- `Header.tsx` — navigatielink
- `CompetitionPage.tsx` (admin) — knop `Seizoen archiveren`
- `BekerPage.tsx` (admin) — knop `Beker archiveren`
- Publieke `CompetitiePage.tsx` + `PublicBekerPage.tsx` — "Vorige seizoenen" link naar `/archief`
- `sitemap.xml` + SEO-meta voor de nieuwe pagina

### Snapshot-logica

- **Competitie:** snapshot uit `competition_standings` + `teams` join, volledig denormaliseerd in jsonb zodat verwijdering van teams het archief niet breekt.
- **Beker:** auto-detect = meest recente cup-match in het seizoen; in modal kan admin via dropdown een andere cup-match als finale kiezen indien auto-detect faalt.

## Scope-grenzen

- ❌ Geen losse match-archivering (behalve finale-meta).
- ❌ Geen kaarten/schorsingen/topscorers (kan later toegevoegd worden).
- ❌ Geen automatische trigger — admin doet het bewust.
- ✅ Verwijderen van actieve competitie blijft volledig los van dit archief.