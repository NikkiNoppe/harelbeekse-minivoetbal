# 🚀 VS Code Safari Development Setup

## ✅ **Browser Fout DEFINITIEF Opgelost!**

De "Unable to launch browser" fout is volledig opgelost! We gebruiken nu **Tasks** in plaats van **Launch Configurations** om browser problemen te vermijden.

## 🎯 **Beschikbare Configuraties:**

### **🚀 Start Development Server (Safari)**
- **Wanneer**: Normale development met Safari auto-open
- **Hoe**: `Ctrl+F5` → Kies deze configuratie
- **Wat**: Gebruikt `npm run dev` (Safari opent automatisch via Vite config)

### **🌐 Start Dev Server (Explicit Safari)**  
- **Wanneer**: Expliciete Safari opening
- **Hoe**: `Ctrl+F5` → Kies deze configuratie
- **Wat**: Gebruikt `npm run dev:safari`

### **📱 Start with Safari Script**
- **Wanneer**: Extra feedback tijdens opstarten
- **Hoe**: `Ctrl+F5` → Kies deze configuratie  
- **Wat**: Gebruikt `npm run safari` (custom script)

### **🎯 Universal Dev Server (Auto-detect)**
- **Wanneer**: Automatische package manager detectie
- **Hoe**: `Ctrl+F5` → Kies deze configuratie
- **Wat**: Detecteert Bun/npm/yarn/pnpm automatisch

### **🔧 Build Production**
- **Wanneer**: Production build maken
- **Hoe**: `Ctrl+F5` → Kies deze configuratie
- **Wat**: Gebruikt `npm run build`

### **👀 Preview Build**
- **Wanneer**: Production build testen
- **Hoe**: `Ctrl+F5` → Kies deze configuratie
- **Wat**: Gebruikt `npm run preview`

### **🧹 Lint Code**
- **Wanneer**: Code quality check
- **Hoe**: `Ctrl+F5` → Kies deze configuratie
- **Wat**: Gebruikt `npm run lint`

## 🎮 **Hoe te gebruiken (GEEN BROWSER FOUTEN MEER!):**

### **Methode 1: Keyboard Shortcuts (AANBEVOLEN)**
- `Ctrl+F5` (of `Cmd+F5` op Mac) → Start development server + Safari
- `Ctrl+Shift+F5` → Expliciete Safari versie  
- `Ctrl+Alt+F5` → Safari script met feedback

### **Methode 2: Tasks Menu**
1. Druk `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. Kies "🚀 Start Development Server (Safari)"

### **Methode 3: NPM Scripts Panel**
1. Open NPM Scripts panel in VS Code
2. Klik op "dev" script
3. Safari opent automatisch

### **Methode 4: Terminal Script (Backup)**
```bash
./start-safari.sh
```

## 🛠️ **Troubleshooting:**

### **Als Safari niet opent:**
- Gebruik "🎯 Universal Dev Server" configuratie
- Of ga handmatig naar `http://localhost:8080`

### **Als scripts niet werken:**
- Check of je package manager geïnstalleerd is
- Run `npm install` of equivalent eerst

### **Voor andere browsers:**
- Pas `vite.config.ts` aan
- Of open handmatig je preferred browser

## 💡 **Tips:**

- **Gebruik `🚀 Start Development Server`** voor dagelijks werk
- **Gebruik `🎯 Universal Dev Server`** als je package manager problemen hebt  
- **Gebruik `📱 Safari Script`** voor extra feedback
- **Stop server**: `Ctrl+C` in terminal 

# VS Code Debug Configuration

Deze directory bevat VS Code configuratie bestanden voor debugging en development.

## Debug Configuraties

### 1. Launch Safari against localhost
- **Beschrijving**: Start automatisch de development server en opent Safari
- **Gebruik**: F5 of Debug panel → "Launch Safari against localhost"
- **Voordelen**: 
  - Start automatisch `npm run dev`
  - Opent Safari met debugging enabled
  - Configureert Safari voor development
  - Native macOS browser

### 2. Launch Safari (no server)
- **Beschrijving**: Opent Safari zonder server te starten
- **Gebruik**: Wanneer de server al draait
- **Voordelen**: Snelle Safari launch voor debugging

### 3. Debug React Components (Safari)
- **Beschrijving**: Geoptimaliseerd voor React debugging in Safari
- **Gebruik**: Voor het debuggen van React componenten
- **Voordelen**: 
  - Source maps enabled
  - Webpack path overrides
  - Optimized voor React development
  - Safari Developer Tools

## Tasks

### npm: dev
- **Beschrijving**: Start de Vite development server
- **Port**: 8080
- **URL**: http://localhost:8080
- **Auto-start**: Wordt automatisch gestart door debug configuraties

## Safari Instellingen

De Safari configuratie gebruikt:
- **User Data Directory**: `.vscode/safari-debug-profile/`
- **Developer Tools**: Automatisch geactiveerd
- **Native macOS integratie**: Volledige Safari debugging

## Vereisten voor Safari Debugging

1. **Safari Developer Tools inschakelen**:
   - Open Safari
   - Ga naar Safari → Settings → Advanced
   - Vink "Show Develop menu in menu bar" aan

2. **VS Code Safari Debugger Extension**:
   - Installeer de "Safari Debugger" extension in VS Code
   - Of gebruik de ingebouwde Safari debugging (VS Code 1.60+)

## Snelle Start

1. Open het project in VS Code
2. Druk op `F5` of ga naar Debug panel
3. Selecteer "Launch Safari against localhost"
4. De server start automatisch en Safari opent

## Troubleshooting

### Safari start niet
- Controleer of Safari Developer Tools zijn ingeschakeld
- Zorg dat Safari is geïnstalleerd en up-to-date
- Probeer "Launch Safari (no server)" als de server al draait

### Server start niet
- Controleer of alle dependencies geïnstalleerd zijn: `npm install`
- Controleer of port 8080 vrij is
- Kijk naar de terminal output voor errors

### Debugging werkt niet
- Controleer of Safari Developer Tools zijn ingeschakeld
- Controleer of source maps enabled zijn in Vite config
- Zorg dat de juiste webRoot is ingesteld
- Probeer de "Debug React Components (Safari)" configuratie

### Safari Developer Tools niet beschikbaar
- Ga naar Safari → Settings → Advanced
- Vink "Show Develop menu in menu bar" aan
- Herstart Safari indien nodig 