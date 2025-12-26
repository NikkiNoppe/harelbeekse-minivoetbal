# Componenten Usage Analyse - `/components/pages/admin/matches/components`

## ✅ Componenten die WEL gebruikt worden:

### Direct gebruikt in `wedstrijdformulier-modal.tsx`:
1. **MatchesDataSection** ✅
   - Gebruikt in: `wedstrijdformulier-modal.tsx`
   
2. **MatchesScoreSection** ✅
   - Gebruikt in: `wedstrijdformulier-modal.tsx`
   
3. **MatchesPlayerSelectionSection** ✅
   - Gebruikt in: `wedstrijdformulier-modal.tsx`
   - Gebruikt zelf: `OptimizedMatchesPlayerSelectionTable`, `MatchesCaptainSelection`, `MatchesPlayerSelectionActions`
   
4. **MatchesRefereeNotesSection** ✅
   - Gebruikt in: `wedstrijdformulier-modal.tsx`
   
5. **MatchesFormActions** ✅
   - Gebruikt in: `wedstrijdformulier-modal.tsx`
   
6. **MatchesRefereeCardsSection** ✅
   - Gebruikt in: `wedstrijdformulier-modal.tsx`
   - Gebruikt zelf: `MatchesCardIcon`
   
7. **MatchesRefereePenaltySection** ✅
   - Gebruikt in: `wedstrijdformulier-modal.tsx`
   
8. **MatchesAdminHiddenFields** ✅
   - Gebruikt in: `wedstrijdformulier-modal.tsx`

### Indirect gebruikt (via andere componenten):
9. **MatchesCardIcon** ✅
   - Gebruikt in: `MatchesRefereeCardsSection`, `MatchesPlayerSelectionTable`
   
10. **MatchesCaptainSelection** ✅
    - Gebruikt in: `MatchesPlayerSelectionSection`
    
11. **MatchesPlayerSelectionActions** ✅
    - Gebruikt in: `MatchesPlayerSelectionSection`
    
12. **MatchesPlayerSelectionTable** ✅
    - Gebruikt in: `OptimizedMatchesPlayerSelectionTable`
    - Gebruikt zelf: `MatchesCardIcon`, `PlayerSelectValue`
    
13. **OptimizedMatchesPlayerSelectionTable** ✅
    - Gebruikt in: `MatchesPlayerSelectionSection`
    
14. **PlayerSelectValue** ✅
    - Gebruikt in: `MatchesPlayerSelectionTable`

### Gebruikt in andere delen van de applicatie:
15. **MatchesCard** ✅
   - Gebruikt in: `MatchesFormList.tsx`, `CompetitiePage.tsx`, `MatchesCupCard.tsx`
   
16. **MatchesCupCard** ✅
   - Gebruikt in: `PublicBekerPage.tsx`
   - Gebruikt zelf: `MatchesCard`
   
17. **MatchesPastList** ✅
   - Gebruikt in: `MatchesPastTabContent.tsx`
   
18. **MatchesFormMessage** ✅
   - Gebruikt in: `MatchesPastTabContent.tsx`

---

## ❌ Componenten die NIET gebruikt worden:

1. **MatchesAdminDataSection** ❌
   - **Status**: Niet gebruikt
   - **Export naam**: `AdminMatchDataSection` (niet `MatchesAdminDataSection`)
   - **Opmerking**: Mogelijk oude code die vervangen is door `MatchesDataSection`

2. **MatchesFormMenuItem** ❌
   - **Status**: Niet gebruikt
   - **Opmerking**: Alleen definitie gevonden, geen imports/gebruik

---

## 📊 Samenvatting:

- **Totaal componenten**: 20
- **Gebruikt**: 18 ✅
- **Niet gebruikt**: 2 ❌

### Aanbeveling:
- **MatchesAdminDataSection**: Verwijderen (lijkt oude/deprecated code)
- **MatchesFormMenuItem**: Verwijderen (niet gebruikt, mogelijk oude code)

---

## 🔍 Details per component:

### MatchesAdminDataSection
- **Bestand**: `MatchesAdminDataSection.tsx`
- **Export**: `AdminMatchDataSection` (niet `MatchesAdminDataSection`)
- **Gebruik**: Geen imports gevonden
- **Vervangen door**: Waarschijnlijk `MatchesDataSection`

### MatchesFormMenuItem
- **Bestand**: `MatchesFormMenuItem.tsx`
- **Export**: `MatchesFormMenuItem`
- **Gebruik**: Geen imports gevonden
- **Functie**: Menu item component (mogelijk oude UI pattern)

