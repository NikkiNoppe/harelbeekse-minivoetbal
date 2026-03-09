

## Plan: Achtergrond, Header & Footer Kleuren Dynamisch Maken

### Probleem

De `applyThemeToCSS` functie zet alleen `--color-50` t/m `--color-900` CSS variabelen, maar de Header, Footer en achtergronden gebruiken hardcoded Tailwind klassen zoals `bg-purple-900`, `bg-purple-300`, `bg-purple-100`. Deze reageren niet op het dynamische thema.

### Oplossing

**Twee aanpassingen:**

**1. Tailwind config: purple kleuren koppelen aan CSS variabelen**

In `tailwind.config.ts`, de `purple` kleuren wijzigen van hardcoded hex naar CSS variabelen:

```ts
purple: {
  50: 'var(--color-50)',
  100: 'var(--color-100)',
  200: 'var(--color-200)',
  300: 'var(--color-300)',
  400: 'var(--color-400)',
  500: 'var(--color-500)',
  600: 'var(--color-600)',
  700: 'var(--color-700)',
  800: 'var(--color-800)',
  900: 'var(--color-900)',
  dark: 'var(--color-primary-base)',
  light: 'var(--color-primary-light)',
  white: '#ffffff',
  'light-gray': 'var(--color-50)',
}
```

Dit zorgt ervoor dat alle `bg-purple-*`, `text-purple-*`, `border-purple-*` klassen automatisch meebewegen met het thema.

**2. Soccer kleuren ook koppelen:**

```ts
soccer: {
  green: 'var(--color-primary-base)',
  'dark-green': 'var(--color-700)',
  'light-green': 'var(--color-primary-light)',
  black: 'var(--color-primary-base)',
  white: '#ffffff',
  gray: 'var(--color-50)',
}
```

### Resultaat

- Header (`bg-purple-900`) past automatisch aan naar de donkerste tint van het gekozen thema
- Footer (`bg-purple-300`) past aan naar de 300-tint
- Achtergronden (`bg-purple-100`) passen aan naar de 100-tint
- Alle 214 referenties naar `bg-purple-*` in 26 bestanden werken automatisch mee
- Geen wijzigingen nodig in individuele componenten

### Bestanden

| # | Bestand | Wijziging |
|---|---------|-----------|
| 1 | `tailwind.config.ts` | Purple + soccer kleuren naar CSS variabelen |

