

## Kleurenpalet Instellingen — Dynamisch Themasysteem

### Wat er gebeurt

Een nieuwe tab "Kleuren" wordt toegevoegd aan de Settings pagina (`/admin/settings`) waarmee de admin het volledige kleurenpalet van de website kan aanpassen. Kleuren worden opgeslagen in `application_settings` (category `theme_colors`) en bij het laden van de app toegepast als CSS custom properties op `:root`.

### Architectuur

```text
┌─────────────────────────────────────────┐
│  application_settings                    │
│  setting_category = 'theme_colors'       │
│  setting_value = {                       │
│    primaryBase: "#60368c",               │
│    primaryLight: "#ab86dd",              │
│    scale: { 50: "#faf8ff", ... 900 }     │
│  }                                       │
└──────────────┬──────────────────────────┘
               │ laden bij app start
               ▼
┌─────────────────────────────────────────┐
│  useThemeColors() hook                   │
│  - Haalt kleuren op uit DB              │
│  - Zet CSS variables op :root           │
│  - Berekent shadow rgba's automatisch   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ThemeColorsSettings component           │
│  (nieuwe tab in SettingsPanel)           │
│  - Color pickers voor primary + light   │
│  - Auto-generate palette (50-900)       │
│  - Live preview                         │
│  - Opslaan → DB + direct toepassen      │
│  - Reset naar standaard                 │
└─────────────────────────────────────────┘
```

### UI/UX Ontwerp

De tab "Kleuren" toont:

1. **Hoofdkleuren sectie** — Twee color pickers:
   - "Hoofdkleur" (primary-base, standaard `#60368c`)
   - "Accentkleur" (primary-light, standaard `#ab86dd`)

2. **Automatisch gegenereerd palet** — Op basis van de hoofdkleur worden 50-900 tinten automatisch berekend (HSL lightness shifting). Getoond als horizontale kleurbalken met hex-waarden.

3. **Live preview blok** — Kleine preview met knoppen, kaarten, badges in de gekozen kleuren zodat de admin het effect direct ziet.

4. **Acties** — "Opslaan" knop + "Standaard herstellen" knop.

### Wijzigingen

| # | Wat | Bestand |
|---|-----|---------|
| 1 | **DB record** | Migration: `INSERT INTO application_settings` met category `theme_colors` en standaard paars palet |
| 2 | **RLS policy** | Toevoegen `SELECT` policy voor `theme_colors` zodat iedereen de kleuren kan lezen |
| 3 | **Hook: `useThemeColors`** | Nieuw bestand `src/hooks/useThemeColors.ts` — haalt kleuren op, past CSS vars toe op `:root`, biedt `saveThemeColors()` |
| 4 | **Palette generator util** | Nieuw bestand `src/lib/colorUtils.ts` — `generatePalette(hex)` → genereert 50-900 scale + shadow rgba's via HSL berekeningen |
| 5 | **ThemeColorsSettings component** | Nieuw bestand `src/components/pages/admin/settings/components/ThemeColorsSettings.tsx` — color pickers, preview, opslaan |
| 6 | **SettingsPanel tab toevoegen** | Tab "Kleuren" met `Palette` icoon toevoegen in `SettingsPanel.tsx` |
| 7 | **App-level integratie** | In `App.tsx` of `main.tsx`: `useThemeColors()` aanroepen zodat kleuren bij elke page load uit DB worden geladen |

### Technisch Detail

**Palette generatie** (`colorUtils.ts`):
- Input: 1 hex kleur (primaryBase)
- Converteer naar HSL
- Genereer scale: 50 = H,S,95% → 900 = H,S,10% (lightness verschuiving)
- primaryLight = shade 400
- Shadow rgba's: parse hex naar RGB, maak rgba met diverse opaciteiten

**CSS toepassing** (`useThemeColors`):
```ts
const applyThemeColors = (colors: ThemeColors) => {
  const root = document.documentElement;
  root.style.setProperty('--color-primary-base', colors.primaryBase);
  root.style.setProperty('--color-50', colors.scale[50]);
  // ... alle variabelen
};
```

Doordat de hele app al CSS variables gebruikt, werkt elke kleurwijziging automatisch overal.

**Opslag in DB**:
- `setting_category`: `'theme_colors'`
- `setting_value`: JSON met `primaryBase`, `primaryLight`, en volledige `scale` object

