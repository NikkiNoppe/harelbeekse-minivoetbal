# Opkuis `referee_matches`

## Analyse op echte data (53 rijen)

| kolom | gevuld | nuttig? | actie |
|---|---|---|---|
| `created_at` | 53 | nee (user) | **DROP** |
| `updated_at` | 53 | nee (user) | **DROP** |
| `assignment_notes` | 0 | nooit gebruikt | **DROP** |
| `confirmed_at` | 0 | nooit gezet (geen confirm-flow actief) | **DROP** |
| `availability_notes` | 25 | enkel auto-string "Door admin als beschikbaar gemarkeerd" → ruis | **DROP** |
| `status` | 48× pending, 5× null | enkel pending → discriminator zonder waarde | **zie hieronder** |
| `poll_group_id` | 26 | gebruikt in availability poll | behouden |
| `poll_month` | 53 | gebruikt voor maand-filtering | behouden |
| `assigned_at` | 48 | gebruikt | behouden |
| `assigned_by` | 48 | gebruikt (audit wie toewees) | behouden |
| `is_available` | 26 | kern van availability | behouden |
| `match_id` / `referee_id` | kern | behouden |

## Voorstel voor `status`

Twee opties — kies er één:

**Optie A — volledig droppen.** Een rij is "toegewezen" zodra `assigned_at IS NOT NULL`. Confirm/decline-knoppen in het scheidsrechter-dashboard verdwijnen (worden toch niet gebruikt — 0 confirmed, 0 declined in DB).

**Optie B — behouden maar enkel als de confirm/decline-flow blijft.** Dan blijft de kolom nuttig voor toekomstig gebruik, ook al staat alles nu op pending.

→ Mijn aanbeveling: **Optie A**. De flow wordt niet gebruikt en `assigned_at` is een betere waarheidsbron.

## Eindstructuur `referee_matches` (na opkuis)

```
id, referee_id, match_id,
is_available,
poll_group_id, poll_month,
assigned_at, assigned_by
```

8 kolommen i.p.v. 15. Eén rij per (referee, match) blijft de regel.

## Migratie-stappen

1. **Code aanpassen eerst** — alle services/RPCs/UI strippen van `status`, `confirmed_at`, `assignment_notes`, `availability_notes`, `created_at`, `updated_at`.
   - `assignmentService.ts`: filter `.not('status', 'is', null)` → `.not('assigned_at', 'is', null)`. Insert zet `assigned_at = now()` i.p.v. `status='pending'`.
   - `refereeAvailabilityService.ts`: drop alle `availability_notes`.
   - `RefereeDashboard` + `AssignedMatchesSection`: confirm/decline-knoppen verwijderen.
   - 9 RPCs herschrijven (zelfde lijst als vorige merge: `assign_referee_to_match`, `assign_referee_to_session`, `remove_*`, `check_referee_conflict`, `get_available_referees_for_match`, `admin_set_referee_availability`, `admin_get_referee_availability`, `finalize_poll_assignments`) — schrappen referenties naar `status` etc.
   - `clearAvailability`: voorwaarde `is_available IS NULL AND status IS NULL` → enkel `is_available IS NULL AND assigned_at IS NULL`.
2. **Migratie** — `ALTER TABLE referee_matches DROP COLUMN ...` voor de 6 kolommen (+ status indien Optie A). Unique constraints behouden.
3. Smoke-test op `/admin/scheidsrechters` en referee dashboard.

## Risico

Klein — geen van de te droppen kolommen wordt voor business-logica gebruikt (data bewijst het). Het enige beslispunt is `status` (Optie A vs B).

## Vraag aan jou

Optie **A** (status ook weg, confirm/decline-knoppen weg) of Optie **B** (status behouden voor later)?
