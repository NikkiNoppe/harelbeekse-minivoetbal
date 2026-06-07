---
name: 21st-dev-reference
description: >-
  Use 21st.dev as the primary UI component reference — no API key needed.
  Browse, fetch, and adapt open-source React/Tailwind/shadcn patterns from
  21st.dev when building or redesigning interfaces.
---

# 21st.dev als referentie (zonder API-key)

Gebruik [21st.dev](https://21st.dev) als **voorbeeldbibliotheek**, niet via Magic MCP. Alle community-componenten zijn MIT-licentie en gratis te bekijken en kopiëren.

## Wanneer toepassen

- Nieuwe pagina's, secties, modals, cards, navigatie, hero's, dashboards
- UI-verbeteringen of redesigns
- "Maak het mooier / moderner / professioneler"

## Workflow

1. **Zoek vergelijkbare componenten** op https://21st.dev — categorieën: Marketing Blocks (hero, pricing, CTA, footer) en UI Components (buttons, cards, tables, modals).
2. **Haal het voorbeeld op** via WebFetch op de component-URL (`https://21st.dev/{author}/{component}`) of de registry-URL (`https://21st.dev/r/{author}/{component}`).
3. **Pas aan het project aan** — gebruik bestaande primitives uit `src/components/ui/`, Tailwind-tokens en `cn()` uit `@/lib/utils`. Geen generieke AI-slop; volg het 21st.dev-voorbeeld qua layout, spacing en hiërarchie.
4. **Animeer met Framer Motion** (`framer-motion` is geïnstalleerd) — scroll reveals, hover, page transitions zoals in 21st.dev-voorbeelden.
5. **Combineer met UI/UX Pro Max** (`.cursor/skills/ui-ux-pro-max/`) voor kleuren, typografie en UX-richtlijnen.

## Installeren vs. handmatig kopiëren

**Voorkeur in dit project:** handmatig adapteren naar bestaande `src/components/ui/` — het project heeft geen `components.json`.

Als shadcn CLI nodig is:
```bash
npx shadcn@latest add "https://21st.dev/r/{author}/{component-name}"
```
Controleer daarna imports en pas aan op `@/` aliassen.

## Inspiratiebronnen op 21st.dev

| Behoefte | Waar kijken |
|----------|-------------|
| Landing / marketing | Marketing Blocks → hero, features, testimonials, pricing |
| Admin / data UI | UI Components → tables, cards, sidebars, forms |
| Kleuren & fonts | Themes |
| Volledige schermen | Screens |

Documentatie-index: https://help.21st.dev/llms.txt

## Regels

- **Geen API-key vereist** — nooit vragen om 21st.dev Magic MCP of API-key.
- **Niet blind kopiëren** — businesslogica, Supabase-hooks en bestaande patronen van dit project behouden.
- **Bestaande design tokens** — `primary`, `muted`, `card`, enz. uit `index.css` / Tailwind-config; geen losse hex-kleuren tenzij bewust.
- **Toegankelijkheid** — focus states, contrast en `min-h-[44px]` op interactieve elementen (zoals bestaande button-stijl).
- **Performance** — geen zware animaties op admin-tabellen; subtiel op publieke pagina's.

## Voorbeeld-prompts voor de agent

```
Bouw een hero-sectie voor de publieke homepage. Gebruik 21st.dev als referentie
voor layout en animaties; pas aan onze shadcn-componenten en club-kleuren aan.
```

```
Redesign de financial summary cards. Zoek vergelijkbare card-patterns op 21st.dev
en implementeer met Framer Motion hover-states.
```
