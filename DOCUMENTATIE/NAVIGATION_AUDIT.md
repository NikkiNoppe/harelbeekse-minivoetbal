# Navigation Components Audit

**Datum:** 24 December 2025  
**Locatie:** `src/components/navigation/`  
**Totaal componenten:** 6 (5 componenten + 1 barrel export)

---

## 📊 Huidige Structuur

```
src/components/navigation/
├── AdminQuickSheet.tsx          ← Admin quick actions sheet
├── MatchdayActionsBar.tsx       ← Matchday-specific action bar
├── MobileBottomNav.tsx          ← Mobile bottom navigation
├── PageHeader.tsx               ← Page header with back button
├── SingleActionScreen.tsx       ← Single action screen layout
└── index.ts                     ← Barrel export (✅ GOED!)
```

---

## 🔍 Component Analyse

### 1. **AdminQuickSheet.tsx**
- **Doel:** Sheet met admin quick actions
- **Gebruik:** Admin navigatie shortcuts
- **Naming:** ✅ Goed - duidelijk wat het is
- **Locatie:** ✅ Correct - is navigatie component

### 2. **MatchdayActionsBar.tsx**
- **Doel:** Action bar voor matchday-specifieke acties
- **Gebruik:** Alleen op bepaalde admin pagina's
- **Naming:** ✅ Goed - beschrijvend
- **Locatie:** ⚠️ **Twijfelachtig** - is dit navigatie of een feature-specific component?

### 3. **MobileBottomNav.tsx**
- **Doel:** Bottom navigation voor mobile
- **Gebruik:** Globale mobile navigatie
- **Naming:** ✅ Goed
- **Locatie:** ✅ Correct
- **Status:** ⚠️ **NIET GEBRUIKT** volgens eerdere cleanup

### 4. **PageHeader.tsx**
- **Doel:** Herbruikbare page header met back button
- **Gebruik:** Veel gebruikt (24x)
- **Naming:** ✅ Goed
- **Locatie:** ✅ Correct

### 5. **SingleActionScreen.tsx**
- **Doel:** Layout voor screens met één primaire actie
- **Gebruik:** Gebruikt in verschillende screens
- **Naming:** ⚠️ **Onduidelijk** - "Screen" suggereert een page, niet een component
- **Locatie:** ⚠️ **Twijfelachtig** - is dit navigatie of een layout component?

### 6. **index.ts**
- **Doel:** Barrel export voor cleaner imports
- **Status:** ✅ **EXCELLENT!** Dit is hoe het hoort!

---

## ⚠️ Problemen & Verbeterpunten

### **Probleem 1: Naming Inconsistentie**

**Huidige naming:**
```
AdminQuickSheet.tsx      ← PascalCase ✅
MatchdayActionsBar.tsx   ← PascalCase ✅
MobileBottomNav.tsx      ← PascalCase ✅
PageHeader.tsx           ← PascalCase ✅
SingleActionScreen.tsx   ← PascalCase ✅
```

**Observatie:** Alle componenten gebruiken PascalCase - dit is **consistent**! ✅

**MAAR:** Voor consistentie met `ui/` directory (kebab-case), zou je kunnen overwegen:
```
admin-quick-sheet.tsx
matchday-actions-bar.tsx
mobile-bottom-nav.tsx
page-header.tsx
single-action-screen.tsx
```

**Aanbeveling:** Behoud PascalCase voor navigatie componenten, want:
- Het is al consistent binnen deze directory
- Het onderscheidt navigatie (PascalCase) van UI primitives (kebab-case)
- Geen imports hoeven geüpdatet te worden

---

### **Probleem 2: Component Categorisatie**

Niet alle componenten zijn pure "navigatie":

| Component | Type | Juiste Locatie? |
|-----------|------|-----------------|
| `AdminQuickSheet` | Navigation | ✅ Ja |
| `MobileBottomNav` | Navigation | ✅ Ja |
| `PageHeader` | Layout/Navigation | ⚠️ Grijs gebied |
| `MatchdayActionsBar` | Feature-specific | ❌ Nee - te specifiek |
| `SingleActionScreen` | Layout | ❌ Nee - dit is een layout, geen navigatie |

---

### **Probleem 3: MobileBottomNav Niet Gebruikt**

Volgens eerdere cleanup is `MobileBottomNav` verwijderd uit `Layout.tsx`.

**Check:** Is deze component nog ergens anders gebruikt?

```bash
grep -r "MobileBottomNav" src --include="*.tsx"
```

Als **niet gebruikt** → ❌ **Verwijderen**

---

### **Probleem 4: Onduidelijke Scheiding**

De directory bevat een mix van:
- ✅ **Echte navigatie** (AdminQuickSheet, MobileBottomNav)
- ⚠️ **Layout componenten** (PageHeader, SingleActionScreen)
- ⚠️ **Feature-specific** (MatchdayActionsBar)

---

## 🎯 Aanbevelingen

### **Optie A: Minimale Aanpassing (Aanbevolen)**

1. **Verwijder MobileBottomNav** (als niet gebruikt)
2. **Verplaats componenten naar betere locaties:**
   ```
   src/components/
   ├── navigation/
   │   ├── admin-quick-sheet.tsx    ← Blijft hier
   │   └── index.ts
   ├── layout/                       ← NIEUW
   │   ├── page-header.tsx          ← Verplaats
   │   ├── single-action-screen.tsx ← Verplaats
   │   └── index.ts
   └── admin/
       └── matchday-actions-bar.tsx  ← Verplaats naar admin-specifiek
   ```

3. **Update barrel exports**

---

### **Optie B: Behoud Huidige Structuur**

Als je de huidige structuur wilt behouden:

1. **Verwijder alleen MobileBottomNav** (als niet gebruikt)
2. **Hernoem voor duidelijkheid:**
   ```
   AdminQuickSheet.tsx        → admin-quick-sheet.tsx
   MatchdayActionsBar.tsx     → matchday-actions-bar.tsx
   PageHeader.tsx             → page-header.tsx
   SingleActionScreen.tsx     → single-action-screen.tsx
   ```
3. **Update alle imports** (24 plekken)

---

### **Optie C: Grote Refactor (Meest Logisch)**

Herstructureer naar duidelijke categorieën:

```
src/components/
├── navigation/              ← Alleen echte navigatie
│   ├── admin-quick-sheet.tsx
│   └── index.ts
├── layout/                  ← Layout componenten
│   ├── page-header.tsx
│   ├── single-action-screen.tsx
│   └── index.ts
└── pages/admin/             ← Feature-specific components
    └── matches/
        └── matchday-actions-bar.tsx
```

**Voordelen:**
- ✅ Duidelijke scheiding van verantwoordelijkheden
- ✅ Makkelijker te vinden waar componenten thuishoren
- ✅ Schaalbaarder voor toekomstige componenten

**Nadelen:**
- ⚠️ Veel imports moeten worden geüpdatet
- ⚠️ Meer werk

---

## 📋 Samenvatting

| Aspect | Status | Actie |
|--------|--------|-------|
| **Naming** | ✅ Consistent (PascalCase) | Optioneel: kebab-case |
| **Barrel Export** | ✅ Aanwezig | Behouden! |
| **MobileBottomNav** | ❌ Niet gebruikt | Verwijderen |
| **Categorisatie** | ⚠️ Gemengd | Herstructureren |
| **Aantal componenten** | 5 actief | Reduceren naar 1-2 |

---

## ✅ Mijn Aanbeveling

**Start met Optie A (Minimale Aanpassing):**

1. ✅ **Verwijder MobileBottomNav** (als niet gebruikt)
2. ✅ **Hernoem naar kebab-case** voor consistentie met `ui/`
3. ⚠️ **Overweeg later** om layout componenten te verplaatsen

**Impact:**
- Minimale breaking changes
- Betere consistentie
- Cleaner directory

**Wil je dat ik dit implementeer?** 🚀

