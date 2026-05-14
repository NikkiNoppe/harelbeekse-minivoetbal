# Plan: Samenvoegen tot `referee_matches`

## Haalbaarheid: ja, maar met aandachtspunten

Beide tables zijn al gekoppeld aan dezelfde sleutel (`user_id` / `referee_id` + `match_id`). Data is klein: 26 availability-rijen + 48 assignment-rijen → migratie is veilig. **1 edge-case:** 1 availability-rij zonder `match_id` (cluster-only) — die wordt gemigreerd met `match_id = NULL` of weggegooid.

## Nieuwe table: `referee_matches`

Eén rij per (referee, match). Eén rij dekt zowel "is beschikbaar" als "is toegewezen".

| kolom | bron |
|---|---|
| `id`, `referee_id`, `match_id` | uniek samen |
| `is_available` (bool, nullable) | uit availability — `null` = nog niet gereageerd |
| `availability_notes` (text) | uit availability.notes |
| `poll_group_id`, `poll_month` | uit availability |
| `status` (enum, nullable) | uit assignments — `null` = enkel beschikbaarheid, anders pending/confirmed/declined/cancelled |
| `assigned_by`, `assigned_at`, `confirmed_at` | uit assignments |
| `assignment_notes` (text) | uit assignments.notes |
| `created_at`, `updated_at` | nieuw |

**Unique constraint:** `(referee_id, match_id)` — vervangt beide huidige uniques.

## Migratie-stappen (1 SQL migration)

1. Maak `referee_matches` aan + RLS policies + indexes + grants
2. Backfill: 
   - INSERT vanuit `referee_availability` (status = NULL)
   - UPSERT vanuit `referee_assignments` op `(referee_id, match_id)` — zet status-velden, behoud is_available
3. Verwijder oude tables `referee_availability` + `referee_assignments`
4. Drop oude RPCs die ernaar wijzen (zie hieronder)

## RLS policies (zelfde als nu, op nieuwe table)

- Admins: full access
- Referees: `SELECT` + `UPDATE` op eigen rijen (`referee_id = current_user_id`)

## RPCs aanpassen (9 stuks)

Alle SECURITY DEFINER RPCs moeten naar `referee_matches` schrijven i.p.v. de oude tables:

- `assign_referee_to_match`, `assign_referee_to_session` → UPSERT op (referee_id, match_id), zet status='pending'
- `remove_referee_assignment`, `remove_referee_from_session` → zet status=NULL (rij blijft bestaan als availability-info aanwezig is) of DELETE als is_available ook null
- `admin_set_referee_availability`, `admin_get_referee_availability` → schrijft/leest `is_available`
- `check_referee_conflict`, `get_available_referees_for_match` → JOIN niet meer nodig, single table
- `finalize_poll_assignments` (indien aanwezig) → idem

## Frontend services aanpassen (6 bestanden)

- `assignmentService.ts` — alle queries naar `referee_matches`, filter op `status IS NOT NULL` voor "echte" assignments
- `refereeAvailabilityService.ts` — queries naar `referee_matches`, filter/upsert op `is_available`
- `autoSuggestService.ts` — single-table query i.p.v. JOIN
- `pollService.ts` — idem
- `monthScheduleService.ts` — idem
- `scheidsrechterService.ts` — idem

UI-componenten (`AssignmentManagement.tsx`, `AvailabilityMatrix.tsx`, `UserProfilePage.tsx` backup-export) blijven werken via de service-laag. Geen UI-wijzigingen.

## Voordelen na merge

- **1 query** voor "beschikbare + toegewezen referees per match" i.p.v. JOIN op 2 tables
- Geen sync-issues meer tussen availability en assignment
- Eenvoudigere RLS (1 policy-set)
- Auto-suggest service wordt aanzienlijk sneller (1 SELECT i.p.v. 2 + merge in code)

## Risico's

- **Grote refactor:** ~9 RPCs + 6 services + 1 migratie. Eén bug kan de hele scheidsrechter-flow breken
- **`matches.assigned_referee_id` blijft bestaan** als denormalised cache — moet in sync blijven (zoals nu)
- **De cluster-only availability rij (1 stuk)** moet je beslissen: meenemen als `match_id NULL` (vereist dat unique constraint NULLs toelaat — standaard zo) of negeren
- **Rollback** vereist dat we oude tables niet droppen tot je hebt gevalideerd. Aanbeveling: in stap 3 hernoem ik `referee_availability` → `_old_referee_availability` en `referee_assignments` → `_old_referee_assignments` i.p.v. te droppen. Na 1-2 weken handmatig droppen.

## Volgorde van implementatie

1. Migratie aanmaken (table + RLS + grants + backfill + rename oude tables)
2. Alle 9 RPCs herschrijven in dezelfde migratie
3. 6 services aanpassen om `referee_matches` te gebruiken
4. Smoke-test op `/admin/scheidsrechters` en `/profiel` (referee view)
5. Na validatie: aparte cleanup-migratie om `_old_*` tables te droppen
