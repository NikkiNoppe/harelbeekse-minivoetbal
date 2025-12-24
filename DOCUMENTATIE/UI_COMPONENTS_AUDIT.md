# UI Components Audit Report

**Datum:** 24 December 2025  
**Locatie:** `src/components/ui/`  
**Totaal componenten:** 56

---

## 📊 Usage Statistieken

### ✅ Veel Gebruikt (Top 10)
| Component | Gebruik | Status |
|-----------|---------|--------|
| `button.tsx` | 62x | ✅ Behouden |
| `card.tsx` | 46x | ✅ Behouden |
| `input.tsx` | 40x | ✅ Behouden |
| `label.tsx` | 36x | ✅ Behouden |
| `table.tsx` | 31x | ✅ Behouden |
| `select.tsx` | 30x | ✅ Behouden |
| `badge.tsx` | 29x | ✅ Behouden |
| `app-modal.tsx` | 22x | ✅ Behouden |
| `app-alert-modal.tsx` | 15x | ✅ Behouden |
| `skeleton.tsx` | 13x | ✅ Behouden |

### ⚠️ Weinig Gebruikt (1-5x)
| Component | Gebruik | Aanbeveling |
|-----------|---------|-------------|
| `auto-fit-text.tsx` | 1x | ⚠️ Review - mogelijk custom component |
| `calendar.tsx` | 1x | ⚠️ Review - mogelijk voor toekomstig gebruik |
| `filter-input.tsx` | 1x | ⚠️ Review |
| `progress.tsx` | 1x | ⚠️ Review |
| `radio-group.tsx` | 1x | ⚠️ Review |
| `search-input.tsx` | 1x | ⚠️ Review |
| `sonner.tsx` | 1x | ✅ Behouden - toast notifications |
| `toaster.tsx` | 1x | ✅ Behouden - toast notifications |
| `toggle.tsx` | 1x | ⚠️ Review |
| `SidebarIcon.tsx` | 1x | ⚠️ Review - naming inconsistency |
| `HamburgerIcon.tsx` | 2x | ⚠️ Review - naming inconsistency |
| `accordion.tsx` | 2x | ⚠️ Review |
| `command.tsx` | 2x | ⚠️ Review |
| `dialog.tsx` | 2x | ⚠️ Review - vervangen door app-modal? |
| `dropdown-menu.tsx` | 2x | ⚠️ Review |
| `popover.tsx` | 2x | ⚠️ Review |
| `separator.tsx` | 2x | ⚠️ Review |
| `sheet.tsx` | 3x | ⚠️ Review |
| `sidebar.tsx` | 2x | ⚠️ Review |
| `toast.tsx` | 2x | ✅ Behouden - toast system |
| `tooltip.tsx` | 3x | ⚠️ Review |
| `collapsible.tsx` | 4x | ⚠️ Review |
| `scroll-area.tsx` | 4x | ⚠️ Review |
| `form.tsx` | 5x | ✅ Behouden - form system |
| `tabs.tsx` | 6x | ✅ Behouden |
| `checkbox.tsx` | 7x | ✅ Behouden |
| `switch.tsx` | 8x | ✅ Behouden |
| `textarea.tsx` | 8x | ✅ Behouden |
| `alert.tsx` | 13x | ✅ Behouden |

### ❌ NIET Gebruikt (0x) - **Kandidaten voor Verwijdering**

| Component | Gebruik | Reden | Actie |
|-----------|---------|-------|-------|
| `alert-dialog.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `aspect-ratio.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `avatar.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `breadcrumb.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `carousel.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `chart.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `context-menu.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `drawer.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `hover-card.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `input-otp.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `menubar.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `navigation-menu.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `pagination.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `resizable.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `slider.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `toggle-group.tsx` | 0x | Shadcn component, niet gebruikt | ❌ Verwijderen |
| `use-toast.ts` | 0x | Hook - mogelijk indirect gebruikt | ⚠️ Check dependencies |

**Totaal ongebruikt:** 17 componenten

---

## 🎯 Aanbevelingen

### 1. **Verwijder Ongebruikte Shadcn Components (16 bestanden)**

Deze componenten zijn geïnstalleerd via shadcn/ui maar worden nergens gebruikt:

```bash
# Veilig te verwijderen
rm src/components/ui/alert-dialog.tsx
rm src/components/ui/aspect-ratio.tsx
rm src/components/ui/avatar.tsx
rm src/components/ui/breadcrumb.tsx
rm src/components/ui/carousel.tsx
rm src/components/ui/chart.tsx
rm src/components/ui/context-menu.tsx
rm src/components/ui/drawer.tsx
rm src/components/ui/hover-card.tsx
rm src/components/ui/input-otp.tsx
rm src/components/ui/menubar.tsx
rm src/components/ui/navigation-menu.tsx
rm src/components/ui/pagination.tsx
rm src/components/ui/resizable.tsx
rm src/components/ui/slider.tsx
rm src/components/ui/toggle-group.tsx
```

**Geschatte ruimtebesparing:** ~50-80 KB

---

### 2. **Fix Naming Inconsistencies**

```bash
# PascalCase → kebab-case (shadcn standaard)
mv src/components/ui/HamburgerIcon.tsx src/components/ui/hamburger-icon.tsx
mv src/components/ui/SidebarIcon.tsx src/components/ui/sidebar-icon.tsx
```

**Update imports in:**
- Zoek naar `from "@/components/ui/HamburgerIcon"`
- Zoek naar `from "@/components/ui/SidebarIcon"`

---

### 3. **Review Weinig Gebruikte Components**

Overweeg of deze echt nodig zijn of kunnen worden geconsolideerd:
- `dialog.tsx` (2x) - Mogelijk vervangen door `app-modal.tsx`?
- `sheet.tsx` (3x) - Mogelijk vervangen door `app-modal.tsx` met variant?
- `tooltip.tsx` (3x) - Behouden als gebruikt
- `accordion.tsx` (2x) - Behouden als gebruikt

---

### 4. **Check `use-toast.ts` Dependencies**

Hoewel direct 0x geïmporteerd, wordt deze mogelijk indirect gebruikt door:
- `toast.tsx`
- `toaster.tsx`
- `sonner.tsx`

**Actie:** Behouden, maar verifieer dat het daadwerkelijk gebruikt wordt.

---

## 📋 Samenvatting

| Categorie | Aantal | Actie |
|-----------|--------|-------|
| Veel gebruikt (10+) | 10 | ✅ Behouden |
| Matig gebruikt (5-9) | 5 | ✅ Behouden |
| Weinig gebruikt (1-4) | 24 | ⚠️ Review |
| Niet gebruikt (0) | 17 | ❌ Verwijderen |

**Totaal te verwijderen:** 16-17 bestanden  
**Ruimtebesparing:** ~50-80 KB  
**Impact:** Geen - niet gebruikt in codebase

---

## ✅ Voordelen van Cleanup

1. **Kleinere bundle size** - Minder code om te bundelen
2. **Snellere builds** - Minder bestanden om te verwerken
3. **Betere overzichtelijkheid** - Alleen gebruikte componenten
4. **Makkelijker onderhoud** - Minder componenten om up-to-date te houden
5. **Duidelijkere dependencies** - Weet precies wat je gebruikt

---

## 🚀 Implementatie Plan

1. **Fase 1:** Verwijder 16 ongebruikte shadcn components
2. **Fase 2:** Fix naming inconsistencies (HamburgerIcon, SidebarIcon)
3. **Fase 3:** Review weinig gebruikte components
4. **Fase 4:** Overweeg barrel export (`ui/index.ts`) voor betere imports

**Geschatte tijd:** 15-30 minuten  
**Risico:** Zeer laag (componenten worden niet gebruikt)

