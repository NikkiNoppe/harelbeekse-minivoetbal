

## Plan: Alle Kleuren Flexibel & Aanpasbaar Maken

### Analyse

**Hardcoded kleuren gevonden:**

1. **`src/index.css`**: 2x `#fee2e2` (destructive hover bg), plus de initiële `:root` waarden (worden al overschreven door JS)
2. **`src/index.css` regel 1650-1655**: Tailwind `red-*` klassen in `.btn--danger` 
3. **43 TSX bestanden**: ~450 matches met `bg-red-*`, `bg-green-*`, `bg-blue-*`, `bg-yellow-*` - dit zijn semantische kleuren (fout=rood, succes=groen, info=blauw, waarschuwing=geel). Deze horen bij het design system maar zijn nu niet aanpasbaar.
4. **Supabase email templates**: Hardcoded hex in HTML emails (buiten scope - geen CSS vars mogelijk)

### Aanpak (3 stappen)

**1. Nieuwe CSS variabelen toevoegen voor semantische achtergrondkleuren**

In `src/index.css` `:root` toevoegen:
```css
--color-destructive-bg: #fee2e2;
--color-success-bg: #dcfce7;
--color-warning-bg: #fef3c7;
--color-info: #3b82f6;
--color-info-bg: #eff6ff;
--color-info-dark: #1d4ed8;
```

En de 2x hardcoded `#fee2e2` en `.btn--danger` Tailwind klassen vervangen door deze variabelen.

**2. ThemeColors interface uitbreiden**

In `src/lib/colorUtils.ts`:
- `ThemeColors` uitbreiden met `destructive`, `success`, `warning`, `info` objecten
- `applyThemeToCSS` updaten om ook deze semantische kleuren als CSS vars te zetten
- Defaults behouden als huidige waarden

**3. ThemeColorsSettings Live Preview uitbreiden**

In `ThemeColorsSettings.tsx` toevoegen:
- **Buttons sectie**: Primary, Secondary, Outline, Danger knoppen met live preview  
- **Semantische kleuren sectie**: Color pickers voor Destructive (rood), Success (groen), Warning (oranje), Info (blauw) met elk hun base/bg/dark varianten
- Alle wijzigingen direct zichtbaar in live preview
- Opslaan werkt voor alles tegelijk

### Bestanden

| # | Bestand | Wijziging |
|---|---------|-----------|
| 1 | `src/index.css` | Nieuwe CSS vars toevoegen, hardcoded hex vervangen |
| 2 | `src/lib/colorUtils.ts` | ThemeColors uitbreiden met semantische kleuren, applyThemeToCSS updaten |
| 3 | `src/hooks/useThemeColors.ts` | Fallback logica voor nieuwe velden |
| 4 | `src/components/pages/admin/settings/components/ThemeColorsSettings.tsx` | Live preview met alle buttons + semantische kleuren pickers |

