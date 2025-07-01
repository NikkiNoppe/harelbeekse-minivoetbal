# 🏗️ Project Architecture

## 📁 Folder Structure

Deze applicatie volgt een **professionele, schaalbare architectuur** gebaseerd op feature-driven development en separation of concerns.

### 🎯 Root Structure
```
harelbeekse-minivoetbal/
├── src/                    # Frontend source code
├── supabase/              # Backend (Supabase)
├── public/                # Static assets
└── docs/                  # Documentation
```

### 🎨 Frontend Architecture (`src/`)

#### **App Layer** (`src/app/`)
- **Purpose**: Application-level configuratie en routing
- **Contains**: 
  - `App.tsx` - Root component
  - `main.tsx` - Application entry point
  - `pages/` - Route components

#### **Features Layer** (`src/features/`)
- **Purpose**: Business logic georganiseerd per feature
- **Pattern**: Feature-driven development
- **Features**:
  - `auth/` - Authenticatie & autorisatie
  - `teams/` - Team management
  - `matches/` - Wedstrijd management  
  - `players/` - Speler management
  - `admin/` - Admin functionaliteit
  - `dashboard/` - User dashboard

#### **Shared Layer** (`src/shared/`)
- **Purpose**: Herbruikbare resources across features
- **Structure**:
```
shared/
├── components/           # UI components (buttons, forms, etc.)
├── hooks/               # Custom React hooks
├── services/            # API services & business logic
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── constants/           # App constants & configuration
├── context/             # React Context providers
└── integrations/        # External service integrations
```

#### **Styles Layer** (`src/styles/`)
- **Purpose**: Globale styling en themes
- **Contains**: CSS, Tailwind config, component styles

### 🔧 Backend Architecture (`supabase/`)

```
supabase/
├── functions/           # Edge Functions (serverless)
├── migrations/          # Database schema migrations
└── config/             # Supabase configuration
```

## 🎯 Design Principles

### 1. **Feature-Driven Development**
- Elke feature is zelfstandig en bevat eigen components, hooks, en types
- Features communiceren via shared services
- Makkelijk te testen en te onderhouden

### 2. **Separation of Concerns**
- **UI Components**: Alleen presentatie logic
- **Hooks**: State management en side effects
- **Services**: API calls en business logic
- **Types**: Type safety across de app

### 3. **Dependency Direction**
```
Features → Shared ← App
     ↓
   Services
```

### 4. **Path Aliases**
```typescript
@shared/*     → src/shared/*
@features/*   → src/features/*
@app/*        → src/app/*
```

## 📝 Development Guidelines

### Adding New Features
1. Maak nieuwe map in `src/features/`
2. Volg bestaande structure pattern
3. Export via feature index.ts
4. Update shared types indien nodig

### Shared Components
- Plaats in `src/shared/components/`
- Maak herbruikbaar en generiek
- Documenteer props interface

### Services
- Een service per domein (teams, matches, etc.)
- Gebruik TypeScript voor type safety
- Handle errors consistently

### Types
- Centraliseer in `src/shared/types/`
- Export via index.ts
- Gebruik interfaces over types waar mogelijk

## 🚀 Benefits

### ✅ **Maintainability**
- Clear separation of concerns
- Easy to locate and modify code
- Consistent patterns across features

### ✅ **Scalability** 
- Easy to add new features
- Shared code is reusable
- Independent feature development

### ✅ **Developer Experience**
- Intuitive folder structure
- Clear import paths
- Type safety everywhere

### ✅ **Team Collaboration**
- Multiple developers can work on different features
- Reduced merge conflicts
- Clear ownership boundaries

## 🔄 Migration Status

- ✅ Folder structure reorganized
- ✅ Path aliases configured
- ✅ Core imports updated
- 🔄 All imports migration (in progress)
- ⏳ Feature exports standardization
- ⏳ Documentation completion 