# Cursor — Harelbeekse Minivoetbal

Overzicht van projectconfiguratie voor Cursor-agents.

## Rules (`.cursor/rules/`)

| Bestand | Scope | Beschrijving |
|---------|-------|--------------|
| `supabase.mdc` | altijd | Ingang: verwijst naar alle Supabase-rules |
| `session-rpc-beveiliging.mdc` | migraties, services, hooks | **Geen `*_public` views** — session-RPC-model, deploy-checklist |
| `supabase-rls-sensitive-data.mdc` | migraties, services, publiek | RLS, gevoelige kolommen, security-tests |
| `supabase-schema.mdc` | `supabase/**` | Migraties, RLS, triggers, edge functions |
| `supabase-client.mdc` | `src/services`, hooks, domains | Session-RPC fetch-lagen, legacy `withUserContext` |
| `ui-mobile-first.mdc` | altijd | Mobiel als hoofdplatform, touch targets |
| `data-snel-laden.mdc` | altijd | TanStack Query, skeletons, achtergrond-sync |
| `ui-21st-dev.mdc` | `src/components/**` | UI-voorbeelden via 21st.dev |
| `project-footer-versie.mdc` | altijd | Footer buildversie `v1.YYMMDD` |

**Naamgeving:** `<domein>-<onderwerp>.mdc` — domeinen: `supabase`, `ui`, `data`, `project`.

## Hooks (`.cursor/hooks/`)

| Script | Trigger | Doel |
|--------|---------|------|
| `update-footer-version.sh` | `sessionStart`, `beforeSubmitPrompt` (fallback) | Footer-versie bijwerken naar vandaag (1×/dag) |

Configuratie: `hooks.json`.

## Skills (`.cursor/skills/`)

| Map | Gebruik |
|-----|---------|
| `21st-dev-reference/` | Workflow voor 21st.dev UI-voorbeelden |
| `ui-ux-pro-max/` | Kleur, typografie, UX-richtlijnen |

## Gerelateerde npm-scripts

```bash
npm run update-types        # Types van remote Supabase-project
npm run update-types:local  # Types van lokale Supabase-stack
npm run test:security       # Na elke security-migratie (40 live checks)
```

Vereist: `npx supabase login` (eenmalig) voor `update-types`.

## Lovable security scanner — false positives

Dit project gebruikt **custom session-token auth** (anon key + `p_session_token` / `x-session-token`), geen Supabase Auth JWT-rollen. Na deploy + `npm run test:security` (40/40 groen) zijn de meeste Lovable Criticals **opgelost op productie**.

**Verwachte scanner-ruis (geen actie nodig):**

| Finding | Waarom veilig |
|---------|----------------|
| SECURITY DEFINER + `GRANT EXECUTE TO anon` (lint 0028/0029) | Anon is de enige REST-rol; autorisatie zit in de RPC-body via `private.resolve_app_session` / `user_sessions`. |
| `verify_jwt = false` op edge functions | JWT op anon key is triviaal; echte auth is `x-session-token` → `validate_session` in `_shared/auth.ts`. |
| `users.password` kolomnaam | Waarde is bcrypt (`crypt()`); kolom is `REVOKE` voor clients. |
| RLS met `get_current_user_role()` | Clients kunnen `set_config` niet meer aanroepen; context alleen via `login_user` / `restore_user_session`. |
| Oude migratiebestanden met `p_user_id integer` | Historische SQL; live DB gebruikt `p_session_token uuid` (zie `20260609110000`). |

**Verificatie:** `npm run test:security` — incl. edge functions zonder sessie → 401, `set_config` geblokkeerd, admin RPCs leeg zonder token.

**Lovable rescan:** trigger handmatig in Lovable na deploy; sommige warnings verdwijnen pas na 24–48u of blijven door bovenstaand design.
