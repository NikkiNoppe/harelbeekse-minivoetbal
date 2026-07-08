# Design System — Harelbeekse Minivoetbal (MASTER)

> Project-specifieke bron van waarheid voor uniforme UI.  
> Agents: lees dit vóór nieuwe pagina's; combineer met `.cursor/skills/ui-ux-pro-max/` en `ui-design-system.mdc`.

## Product

Multi-tenant minivoetbal-platform (competitie, beker, play-offs, admin).  
**Primair:** mobiel. **Taal:** Nederlands (BE).

## Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui (`src/components/ui/`)
- Framer Motion (subtiel, `motion-safe:` / `useReducedMotion()`)
- Lucide icons — **geen emoji als UI-icoon**
- TanStack Query — zie `data-snel-laden.mdc`

## Layout (uniform op alle pagina's)

```
App layout
└─ main#main-content
   └─ div.w-full.px-4.sm:px-6.lg:px-8.py-8
      └─ div.max-w-7xl.mx-auto
         └─ [pagina-inhoud]
```

### Pagina-wrapper (standaard)

Gebruik `PublicPage` uit `@/components/layout` (exporteert `PUBLIC_PAGE_CLASS` met `motion-safe:animate-slide-up`).

### Card-sectie (standaard)

```tsx
<Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 card-hover border-primary/20">
  <CardHeader>...</CardHeader>
  <CardContent className="pt-0 space-y-4 min-w-0 overflow-hidden">...</CardContent>
</Card>
```

### Spacing-schaal

| Token | Gebruik |
|-------|---------|
| `gap-2` / `gap-4` | Tussen knoppen en formuliervelden |
| `space-y-4 sm:space-y-6` | Tussen secties |
| `py-6`–`py-8` | Pagina-padding (layout) |
| `p-6 sm:p-8` | Card content |

## Kleuren & branding (multi-tenant)

**Nooit hardcoded tenant-naam of hex in componenten.**

```tsx
const branding = useBranding();
// logo: branding.logoPath, naam: branding.displayName
```

| Utility | Gebruik |
|---------|---------|
| `bg-brand-600` | Header, footer, primaire surfaces |
| `text-brand-dark` | Koppen, labels |
| `bg-brand-100` | Pagina-achtergrond |
| `border-primary/20` | Card-randen |
| `primary`, `destructive`, `success` | shadcn semantic knoppen/states |

**Harelbeke (org 1):** blauw `#0072b9`  
**Kuurne (org 2):** donker `#1A1A1A` + geel accent `#FFC107`

Thema via `useThemeColorsInit` + `application_settings.theme_colors` per org.

## Typografie

- Systeemfont-stack (geen custom webfont)
- Body: min. `text-sm`; primaire content niet kleiner dan `text-xs`
- Pagina-`h1`: via `PageHeader` of eerste `CardTitle`
- Datums: `nl-BE`

## Componenten (hergebruik verplicht)

| Behoefte | Component |
|----------|-----------|
| Knoppen | `Button` |
| Modals | `AppModal`, `AppAlertModal` |
| Paginakop | `PageHeader` |
| Pagina-wrapper | `PublicPage` uit `@/components/layout` |
| Tabellen (mobiel) | `ResponsiveTable` of card-stack |
| Feedback | `useToast` |
| Laden | `Skeleton` (min. 250 ms) |
| Navigatie publiek | `Header` + Sheet |
| Navigatie admin | `AdminSidebar` + `admin-quick-sheet` |

## UX-states (verplicht)

| Status | UI |
|--------|-----|
| Laden | Skeleton in content |
| Leeg | "Geen … gevonden" na succesvolle fetch |
| Fout | NL-melding + Opnieuw |
| Actie | Knop disabled + `Loader2` |

## Referenties in codebase

| Voorbeeld | Bestand |
|-----------|---------|
| Publieke pagina + cards | `CompetitiePage.tsx`, `AlgemeenPage` |
| Ingelogde pagina (profiel) | `UserProfilePage.tsx`, `SectionCollapsibleCard.tsx` |
| Inklapbare sectie (reglement-profiel) | `section-collapsible-styles.ts`, `ReglementPage.tsx` |
| Admin settings | `SettingsPage.tsx` |
| Modal met data | `useTeamFinancialDetailModal.ts` |
| Header/nav | `Header.tsx` |
| Thema | `useThemeColors.ts`, `index.css` |

## UI-inspiratie

1. Zoek vergelijkbaar op [21st.dev](https://21st.dev)
2. Pas aan met shadcn + `brand-*` tokens
3. UX-check via ui-ux-pro-max skill (`--stack shadcn`)

## Anti-patterns

- Afwijkende container (`max-w-5xl` random) zonder reden
- Nieuwe card-stijl zonder `border-primary/20` / `card-hover`
- `purple-*`, losse hex, emoji-iconen
- Full-page spinner
- Engelse gebruikersteksten
