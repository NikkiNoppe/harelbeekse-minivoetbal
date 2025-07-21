# Harelbeekse Minivoetbal Competitie

Een moderne webapplicatie voor het beheren van de KRC Harelbeke Minivoetbal competitie.

## 🚀 Project Structuur

```
harelbeekse-minivoetbal/
├── config/                 # Configuratiebestanden
│   ├── components.json     # shadcn/ui configuratie
│   ├── eslint.config.js   # ESLint configuratie
│   ├── postcss.config.js  # PostCSS configuratie
│   ├── tailwind.config.ts # Tailwind CSS configuratie
│   ├── tsconfig.json      # TypeScript hoofdconfiguratie
│   ├── tsconfig.app.json  # TypeScript app configuratie
│   └── tsconfig.node.json # TypeScript node configuratie
├── docs/                  # Documentatie
│   └── README.md         # Project documentatie
├── public/               # Statische bestanden
├── src/                  # Broncode
│   ├── components/       # React componenten
│   ├── pages/           # Pagina componenten
│   ├── services/        # API services
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definities
│   ├── lib/             # Utility functies
│   ├── context/         # React context providers
│   ├── integrations/    # Externe integraties (Supabase)
│   └── assets/          # Afbeeldingen en andere assets
├── supabase/            # Supabase configuratie en migraties
├── .gitignore          # Git ignore regels
├── index.html          # HTML entry point
├── package.json        # NPM dependencies en scripts
└── vite.config.ts      # Vite build configuratie
```

## 🛠️ Technologieën

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database, Auth, Storage)
- **State Management**: React Query + React Context
- **Form Handling**: React Hook Form + Zod
- **Routing**: React Router DOM

## 📦 Installatie

```bash
# Dependencies installeren
npm install

# Development server starten
npm run dev

# Build voor productie
npm run build

# Linting uitvoeren
npm run lint
```

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build voor productie
- `npm run build:dev` - Build in development mode
- `npm run lint` - ESLint uitvoeren
- `npm run preview` - Preview van productie build

## 🌐 Development

De applicatie draait op `http://localhost:8080` in development mode.

## 📚 Documentatie

- [Supabase Documentatie](https://supabase.com/docs)
- [shadcn/ui Documentatie](https://ui.shadcn.com)
- [Tailwind CSS Documentatie](https://tailwindcss.com/docs)

## 🤝 Bijdragen

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je wijzigingen (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is privé en eigendom van KRC Harelbeke.
