## Impact op dit project

**Korte conclusie: je bestaande website blijft volledig werken.** De Supabase-mail bevestigt expliciet:

> *"Existing tables keep their current grants. This change applies to new tables in new projects from May 30, and all existing projects from October 30."*

Alle huidige tabellen in `public` (users, teams, players, matches, team_costs, application_settings, ...) behouden hun grants voor `anon`, `authenticated` en `service_role`. De frontend (`supabase-js`) en de edge functions blijven dus zonder aanpassing functioneren tot **30 oktober 2026**, en zelfs daarna voor reeds bestaande tabellen.

**Wel een risico:** vanaf **30 oktober 2026** krijgen *nieuwe* tabellen die we via migrations aanmaken in dit project geen automatische grants meer. Zonder ingreep zou een nieuwe tabel een `42501`-fout geven zodra de frontend of een edge function (met anon/authenticated context) ze probeert te lezen of te schrijven. Onze huidige migration-stijl (zie bv. `20250101000000_create_season_data_table.sql`) bevat enkel `CREATE TABLE` + RLS, géén `GRANT`.

## Wat ik wil doen (preventief, geen runtime-impact nu)

### 1. Conventie vastleggen voor toekomstige migrations
Iedere nieuwe `CREATE TABLE public.<x>` in een migration krijgt voortaan standaard:

```sql
GRANT SELECT                         ON public.<x> TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<x> TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<x> TO service_role;
ALTER TABLE public.<x> ENABLE ROW LEVEL SECURITY;
-- + expliciete RLS policies
```

De *werkelijke* afscherming blijft RLS doen (zoals nu al overal). De `GRANT` is enkel het "deurtje openzetten" naar de Data API; RLS bepaalt wie binnen mag.

Ik leg dit vast in een korte conventie-nota onder `DOCUMENTATIE/SUPABASE_GRANTS_CONVENTION.md` zodat zowel jij als ik (en toekomstige AI-sessies) dit consequent toepassen.

### 2. Audit van bestaande tabellen — geen actie nodig
Ik heb de volledige tabellijst nagelopen tegen de RLS-policies in context:
- `users`, `teams`, `team_users`, `players`, `matches`, `team_costs`, `costs`, `competition_standings`, `application_settings`, `monthly_polls`, `poll_match_dates`, `referee_assignments`, `referee_availability`, `password_reset_tokens` → allemaal aangemaakt vóór de cut-off, behouden hun bestaande grants. **Geen migratie nodig.**

### 3. Geen defensieve "re-grant" migration draaien
Ik raad af om nu een grote `GRANT ... ON ALL TABLES IN SCHEMA public`-migration te draaien:
- het is niet nodig (Supabase garandeert behoud van grants),
- het kan per ongeluk *te ruime* rechten geven aan tabellen waar je dat misschien niet wil (bv. `password_reset_tokens` is bewust enkel `service_role`),
- het verhoogt het risico op afwijkingen tussen migration-state en live-state.

### 4. Niet-aanbevolen: `ALTER DEFAULT PRIVILEGES`
Ook al lijkt dit een "fix-once" oplossing, het werkt niet betrouwbaar voor de Supabase Data API rollout en zou Supabase's eigen toekomstige defaults kunnen kruisen. Beter expliciet per tabel.

## Samenvatting

| Vraag | Antwoord |
|---|---|
| Gaat mijn website nu stuk? | Nee. |
| Gaat mijn website op 30 mei 2026 stuk? | Nee, dat geldt enkel voor *nieuwe* projecten. |
| Gaat mijn website op 30 oktober 2026 stuk? | Nee, bestaande tabellen behouden hun grants. |
| Wat moet er wel gebeuren? | Bij élke nieuwe tabel die we vanaf nu aanmaken expliciete `GRANT`-statements meeleveren. |
| Concrete actie nu? | Eén documentatiebestand toevoegen als checklist; verder géén code- of DB-wijzigingen. |

## Te wijzigen bestanden bij goedkeuring

- **Nieuw:** `DOCUMENTATIE/SUPABASE_GRANTS_CONVENTION.md` (conventie + copy-paste sjabloon)

Geen wijzigingen aan source code, geen database migration, geen edge function updates.