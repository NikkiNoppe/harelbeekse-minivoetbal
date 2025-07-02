# Button Styling Systeem

Dit document beschrijft het gestandaardiseerde button styling systeem voor de Harelbeekse Minivoetbal applicatie.

## 🎨 Beschikbare Button Stijlen

### 1. **ButtonDark** - "Inloggen" Style
- **Gebruik**: Primaire acties, belangrijke buttons
- **Styling**: Donkerpaarse achtergrond, witte tekst
- **Hover**: Lichtpaarse achtergrond
- **Class**: `btn-dark`

```tsx
<Button className="btn-dark">
  Inloggen
</Button>
```

### 2. **ButtonLight** - "Wachtwoord vergeten?" Style
- **Gebruik**: Secundaire acties, alternatieve opties
- **Styling**: Lichtpaarse achtergrond, witte tekst
- **Hover**: Donkerpaarse achtergrond
- **Class**: `btn-light`

```tsx
<Button className="btn-light">
  Wachtwoord vergeten?
</Button>
```

### 3. **ButtonWhite** - Dropdown Style
- **Gebruik**: Dropdown triggers, selectie buttons
- **Styling**: Witte achtergrond, donkerpaarse tekst en border
- **Hover**: Donkerpaarse achtergrond, witte tekst
- **Class**: `btn-white`

```tsx
<Button className="btn-white">
  Selecteer optie
</Button>
```

## 📏 Size Varianten

Alle button stijlen ondersteunen verschillende groottes:

### Kleine Button
```tsx
<Button className="btn-dark btn-sm">
  Kleine Button
</Button>
```

### Standaard Button (default)
```tsx
<Button className="btn-dark">
  Standaard Button
</Button>
```

### Grote Button
```tsx
<Button className="btn-dark btn-lg">
  Grote Button
</Button>
```

## 📐 Width Varianten

### Volledige Breedte (default)
```tsx
<Button className="btn-dark">
  Volledige breedte
</Button>
```

### Auto Width
```tsx
<Button className="btn-dark btn-auto">
  Auto breedte
</Button>
```

## 🔧 Disabled State

Alle buttons ondersteunen een disabled state:

```tsx
<Button className="btn-dark" disabled>
  Uitgeschakeld
</Button>
```

## 🎯 Praktische Voorbeelden

### Login Form
```tsx
<Button type="submit" className="btn-dark" disabled={isLoading}>
  {isLoading ? "Inloggen..." : "Inloggen"}
</Button>

<Button type="button" className="btn-light" onClick={onForgotPassword}>
  Wachtwoord vergeten?
</Button>
```

### Dropdown Trigger
```tsx
<Button className="btn-white btn-auto">
  Selecteer team
</Button>
```

### Action Buttons
```tsx
<div className="flex gap-2">
  <Button className="btn-dark btn-auto">
    Opslaan
  </Button>
  <Button className="btn-light btn-auto">
    Annuleren
  </Button>
</div>
```

## 🎨 CSS Classes Overzicht

### Basis Classes
- `btn-dark` - Donkere button (Inloggen stijl)
- `btn-light` - Lichte button (Wachtwoord vergeten stijl)
- `btn-white` - Witte button (Dropdown stijl)

### Size Classes
- `btn-sm` - Kleine button
- `btn-md` - Middelgrote button (default)
- `btn-lg` - Grote button

### Width Classes
- `btn-full` - Volledige breedte (default)
- `btn-auto` - Auto breedte

## 🔄 Migratie van Oude Stijlen

### Van Inline Styles naar Classes

**Oud:**
```tsx
<Button className="w-full bg-purple-dark text-white hover:bg-purple-light hover:text-white border border-purple-dark">
  Inloggen
</Button>
```

**Nieuw:**
```tsx
<Button className="btn-dark">
  Inloggen
</Button>
```

### Van Legacy Classes naar Nieuwe Classes

**Oud:**
```tsx
<Button className="btn-login-primary">
  Inloggen
</Button>
```

**Nieuw:**
```tsx
<Button className="btn-dark">
  Inloggen
</Button>
```

## 🧪 Testen

Gebruik de `ButtonExamples` component om alle button stijlen te testen:

```tsx
import ButtonExamples from "@/components/ui/button-examples";

// In je component
<ButtonExamples />
```

## 📋 Best Practices

1. **Consistentie**: Gebruik altijd de gestandaardiseerde classes
2. **Semantiek**: Kies de juiste button stijl voor de context
3. **Toegankelijkheid**: Voeg altijd `disabled` toe wanneer nodig
4. **Responsiviteit**: Gebruik `btn-auto` voor buttons die niet de volledige breedte nodig hebben

## 🎨 Kleurenschema

- **Donkerpaars**: `var(--purple-dark)` / `#60368c`
- **Lichtpaars**: `var(--purple-light)` / `#ab86dd`
- **Wit**: `#ffffff`

## 🔧 Onderhoud

De button stijlen zijn gedefinieerd in `src/index.css` in de sectie "STANDARDIZED BUTTON STYLES". Wijzigingen aan de styling moeten daar worden gemaakt. 