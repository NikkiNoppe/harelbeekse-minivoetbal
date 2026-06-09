# Auth roadmap (Harelbeekse Minivoetbal)

## Huidige productie (default)

- **Custom session auth** via `user_sessions` + `p_session_token` op ~59 session-RPC's
- Client: `localStorage.auth_data` + `getRpcSessionArgs()`
- Edge functions: `x-session-token` → `validate_session`
- **Geen Supabase Auth JWT** in de standaard flow

Dit model is bewust gehard (juni 2026): invoker wrappers, `private.resolve_app_session`, security tests 44/44.

## Fase 0 — afgerond in codebase

- Legacy `withUserContext` / direct `.from()` verwijderd uit productiepaden
- Admin backup via `get_admin_database_backup_for_session`
- Cleanup: `private.cleanup_expired_auth_rows()` + pg_cron job `cleanup-expired-auth-rows` (03:00 UTC)

## Fase 1 — beslismoment

| Behoefte | Blijven bij custom | Supabase Auth pilot |
|----------|-------------------|---------------------|
| Username + wachtwoord | Ja (RPC) | Email + wachtwoord |
| MFA / SSO | Zelf bouwen | Later ingebouwd |
| Magic links | Edge + tokens | Auth templates |
| Onderhoud session-RPC's | ~59 RPCs | Geleidelijk afbouwen |
| Edge auth | `x-session-token` | JWT + legacy header |

**Aanbeveling:** custom auth behouden tot er expliciet MFA/SSO/JWT-behoefte is. Pilot staat klaar achter feature flag.

## Fase 2b — pilot (feature flag)

Zet in `.env.local`:

```bash
VITE_USE_SUPABASE_AUTH=true
```

Vereisten:

1. `users.auth_uid` gekoppeld aan `auth.users` (per user migreren)
2. Supabase Auth user met zelfde e-mail/wachtwoord
3. Login met **e-mailadres** (niet username) — SuperAdmin blijft via `login_super_admin`

Flow:

1. `supabase.auth.signInWithPassword`
2. RPC `establish_app_session_from_supabase_auth` → legacy `user_sessions` token
3. Rest van app ongewijzigd (`getRpcSessionArgs()`)

Database:

- `get_app_user_from_auth()` — JWT → app user
- RLS pilot: `teams_select_authenticated_jwt_pilot` op `teams` voor `authenticated`

Edge functions: `Authorization: Bearer <jwt>` wordt naast `x-session-token` geaccepteerd (`_shared/auth.ts`).

## Wat niet doen

- `user_sessions` / `password_reset_tokens` / `auth_rate_limits` droppen zonder vervanging
- Supabase Auth zonder `auth_uid`-koppeling
- Alle session-RPC's in één keer verwijderen
