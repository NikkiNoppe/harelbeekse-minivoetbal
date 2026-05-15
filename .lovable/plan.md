## Security fixes — gefaseerde aanpak

Ik wil de security issues oplossen in **3 fasen** om je workflows niet te breken. Fase 1 en 2 zijn veilig & snel. Fase 3 (auth-model) is groot en risicovol — daar wil ik je expliciete go voor.

---

### FASE 1 — Quick wins (lage risico, geen workflow-impact)

1. **Dead code verwijderen**
   - `src/components/pages/admin/AdminPanel.tsx` verwijderen (nergens geïmporteerd, bevat hardcoded `admin/admin123`).

2. **Referee email exposure dichten**
   - `src/services/core/refereeService.ts` en `src/services/scheidsrechter/scheidsrechterService.ts` laten lezen uit `referees_public` view i.p.v. `users` (email weglaten).
   - Veld `email` optioneel maken in de `Referee` interface.

3. **Hardcoded fallback secret in delete-user opruimen** (cosmetic, fix komt mee in fase 2).

---

### FASE 2 — Edge functions auth + RLS finetuning

#### Edge functions: admin-only afdwingen
Patroon: bovenaan elke handler een `requireAdmin(req)` helper die:
- Authorization header leest
- `verify_user_password`-style auth gebruikt of `app.current_user_id` valideert via een service-role lookup in `users` tabel
- `role = 'admin'` checkt

Toevoegen aan:
- `delete-user`
- `send-welcome-email` (ook: valideer dat `email` overeenkomt met user's geregistreerde email óf admin-only)
- `send-forfait-notification` (admin/manager only; valideer recipients tegen DB)
- `sync-card-penalties`, `sync-match-costs`, `sync-all-match-costs`
- `generate-monthly-polls`
- `notify-auto-suspension`
- `generate-competition-schedule`

**Workflow-check:** alle aanroepen vanuit de frontend lopen al via ingelogde admin-flows. Ik audit elke `supabase.functions.invoke('<naam>')` callsite zodat de Authorization header meegestuurd wordt.

#### RLS policies aanscherpen

| Tabel | Probleem | Fix |
|---|---|---|
| `teams` | `Public can read basic team info` lekt contact_phone/email | View `teams_public` (team_id, team_name, club_colors, preferred_play_moments) + base policy alleen voor admin/manager. Frontend public reads omleiden naar view. |
| `users` | `password` kolom leesbaar | View `users_safe` zonder password; SELECT policies op base table verstrengen tot SECURITY DEFINER paden. Login blijft via `verify_user_password` RPC. |
| `team_costs` | Volledig publiek | SELECT beperken tot admin + eigen team manager. Public pagina's die kosten tonen → audit (vermoedelijk geen). |
| `matches.referee_notes` | Publiek | View `matches_public` zonder `referee_notes` (en evt. zonder `home_players`/`away_players` JSONB). Frontend public schedule/standings via view. |

**Workflow-check per tabel:** ik grep elke `.from('teams'|'users'|'team_costs'|'matches')` callsite; publieke (anon) reads → naar view, ingelogde admin/manager reads → blijven op base table.

#### SECURITY DEFINER functies
- Lijst opvragen via linter, dan per functie `REVOKE EXECUTE FROM anon, authenticated` waar niet bedoeld voor publiek.
- Alleen functies die expliciet door publiek/clients worden aangeroepen behouden execute rechten.

---

### FASE 3 — Session-variable auth model (GROOT, apart traject)

Het kritieke issue **"Any user can escalate to admin by setting session variables"** betekent dat het hele custom auth-model (`current_setting('app.current_user_role')`) onveilig is: elke client kan via `SET app.current_user_role = 'admin'` alle RLS bypassen.

**Echte fix** = migratie naar Supabase native `auth.uid()` / `auth.jwt()`:
- Echte Supabase auth users aanmaken voor elke bestaande user
- Login flow vervangen
- Alle ~20 RLS policies herschrijven
- Alle frontend services aanpassen
- Edge functions aanpassen

Dit is een **meerdaags project** met hoog risico op breken. Aanrader: aparte branch + gefaseerde rollout.

**Tijdelijke mitigatie in Fase 2** die ik wel kan doen:
- SECURITY DEFINER wrapper-functies introduceren die identity verifiëren via een server-side mechanisme (bv. token in `password_reset_tokens`-stijl tabel, of Supabase auth voor admin-only).
- Echter: zolang policies leunen op `current_setting` blijft het lek bestaan voor alle non-admin tables.

→ **Vraag aan jou:** doen we Fase 3 nu mee of plannen we die apart?

---

### Wat ik ga opleveren in deze loop

Standaard pak ik **Fase 1 + Fase 2 volledig** aan. Voor Fase 3 wacht ik op je akkoord (en zou ik een nieuw plan maken). Laat het weten als je liever eerst alleen Fase 1, of juist meteen alles wil.