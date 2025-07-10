# Project Structuur Documentatie

## 📁 Overzicht

Dit document beschrijft de professionele mappenstructuur van de Harelbeekse Minivoetbal Competitie applicatie.

## 🏗️ Hoofdstructuur

```
harelbeekse-minivoetbal/
├── config/                 # Configuratiebestanden
├── docs/                  # Documentatie
├── public/               # Statische bestanden
├── scripts/              # Build en setup scripts
├── src/                  # Broncode
├── supabase/             # Backend configuratie
└── [root files]         # Project configuratie
```

## 📂 Gedetailleerde Beschrijving

### `/config/` - Configuratiebestanden
Alle configuratiebestanden zijn georganiseerd in één map voor betere onderhoudbaarheid.

- **`components.json`** - shadcn/ui component configuratie
- **`eslint.config.js`** - ESLint linting regels
- **`postcss.config.js`** - PostCSS configuratie voor Tailwind
- **`tailwind.config.ts`** - Tailwind CSS thema en configuratie
- **`tsconfig.json`** - TypeScript hoofdconfiguratie
- **`tsconfig.app.json`** - TypeScript configuratie voor app code
- **`tsconfig.node.json`** - TypeScript configuratie voor Node.js tools

### `/docs/` - Documentatie
Project documentatie en handleidingen.

- **`README.md`** - Hoofddocumentatie van het project
- **`PROJECT_STRUCTURE.md`** - Dit document

### `/public/` - Statische Bestanden
Bestanden die direct toegankelijk zijn via de browser.

- **`favicon.ico`** - Website icoon
- **`robots.txt`** - SEO configuratie
- **`lovable-uploads/`** - Geüploade bestanden

### `/scripts/` - Scripts
Build en setup scripts voor ontwikkelaars.

- **`setup.sh`** - Automatische project setup script

### `/src/` - Broncode
De kern van de applicatie.

#### `/src/components/` - React Componenten
Georganiseerd per functionaliteit:

- **`admin/`** - Admin panel componenten
- **`auth/`** - Authenticatie componenten
- **`footer/`** - Footer componenten
- **`header/`** - Header en navigatie
- **`match/`** - Wedstrijd gerelateerde componenten
- **`navigation/`** - Navigatie componenten
- **`tables/`** - Tabel componenten
- **`team/`** - Team management componenten
- **`theme/`** - Thema componenten
- **`ui/`** - Herbruikbare UI componenten (shadcn/ui)
- **`user/`** - Gebruiker management componenten

#### `/src/pages/` - Pagina Componenten
Hoofdpagina's van de applicatie.

#### `/src/services/` - API Services
Backend communicatie en business logic.

#### `/src/hooks/` - Custom React Hooks
Herbruikbare React hooks.

#### `/src/types/` - TypeScript Types
Type definities voor de hele applicatie.

#### `/src/lib/` - Utility Functies
Herbruikbare utility functies.

#### `/src/context/` - React Context
State management met React Context.

#### `/src/integrations/` - Externe Integraties
Integraties met externe services (Supabase).

#### `/src/assets/` - Assets
Afbeeldingen, fonts en andere statische assets.

### `/supabase/` - Backend Configuratie
Supabase database en backend configuratie.

- **`config.toml`** - Supabase project configuratie
- **`functions/`** - Edge functions
- **`migrations/`** - Database migraties

## 🔧 Configuratie Bestanden

### Root Level
- **`.gitignore`** - Git ignore regels
- **`index.html`** - HTML entry point
- **`package.json`** - NPM dependencies en scripts
- **`vite.config.ts`** - Vite build configuratie

## 📝 Naming Conventies

### Bestanden
- **React componenten**: PascalCase (bijv. `UserProfile.tsx`)
- **Hooks**: camelCase met `use` prefix (bijv. `useAuth.ts`)
- **Services**: camelCase (bijv. `userService.ts`)
- **Types**: PascalCase (bijv. `UserTypes.ts`)
- **Configuratie**: kebab-case (bijv. `eslint.config.js`)

### Mappen
- **Componenten**: camelCase (bijv. `userManagement/`)
- **Services**: camelCase (bijv. `apiServices/`)
- **Configuratie**: camelCase (bijv. `buildConfig/`)

## 🚀 Development Workflow

1. **Setup**: Run `./scripts/setup.sh`
2. **Development**: `npm run dev`
3. **Build**: `npm run build`
4. **Lint**: `npm run lint`

## 📚 Best Practices

### Component Organisatie
- Elke component in zijn eigen bestand
- Componenten gegroepeerd per functionaliteit
- Herbruikbare componenten in `/src/components/ui/`

### State Management
- Lokale state met `useState`
- Gedeelde state met React Context
- Server state met React Query

### Styling
- Tailwind CSS voor styling
- shadcn/ui voor consistente componenten
- Custom CSS alleen waar nodig

### TypeScript
- Strikte typing waar mogelijk
- Type definities in `/src/types/`
- Interface definities bij componenten

## 🔍 Debugging

### Development Tools
- React Developer Tools
- TypeScript compiler
- ESLint voor code kwaliteit
- Vite dev server met hot reload

### Logging
- Console.log voor development
- Error boundaries voor productie
- Supabase logging voor backend 