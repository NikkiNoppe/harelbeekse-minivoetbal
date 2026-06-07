# Cursor — Harelbeekse Minivoetbal

Overzicht van projectconfiguratie voor Cursor-agents.

## Rules (`.cursor/rules/`)

| Bestand | Scope | Beschrijving |
|---------|-------|--------------|
| `supabase.mdc` | altijd | Ingang: verwijst naar alle Supabase-rules |
| `supabase-schema.mdc` | `supabase/**` | Migraties, RLS, triggers, edge functions |
| `supabase-client.mdc` | `src/services`, hooks, domains | Queries, `withUserContext`, mutaties |
| `ui-mobile-first.mdc` | altijd | Mobiel als hoofdplatform, touch targets |
| `data-snel-laden.mdc` | altijd | TanStack Query, skeletons, achtergrond-sync |
| `ui-21st-dev.mdc` | `src/components/**` | UI-voorbeelden via 21st.dev |
| `project-footer-versie.mdc` | altijd | Footer buildversie `v1.YYMMDD` |

**Naamgeving:** `<domein>-<onderwerp>.mdc` — domeinen: `supabase`, `ui`, `data`, `project`.

## Hooks (`.cursor/hooks/`)

| Script | Trigger | Doel |
|--------|---------|------|
| `update-footer-version.sh` | `sessionStart` | Footer-versie bijwerken naar vandaag |

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
```

Vereist: `npx supabase login` (eenmalig) voor `update-types`.
