# Button Audit Report

**Generated:** 12/23/2025, 9:05:31 PM

## Summary

- **Total Buttons:** 244
- **Standardized:** 96
- **Inconsistent:** 148
- **Legacy CSS Classes:** 127
- **Button Component:** 116
- **Hardcoded Colors:** 1

## Inconsistent Buttons by Component

### AdminPlayoffPage

- **File:** `src/components/pages/admin/AdminPlayoffPage.tsx`
- **Inconsistent Buttons:** 9

  - **component** (line 166): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 169): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 256): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 792): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 795): `variant="outline"` → Recommended: `btn--outline`
  - **hardcoded** (line 945): `flex-1 h-11 bg-green-600 hover:bg-green-700 text-white` → Recommended: `btn--secondary`
  - **component** (line 949): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 971): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 975): `variant="outline"` → Recommended: `btn--outline`

### MatchesFormFilter

- **File:** `src/components/pages/admin/matches/MatchesFormFilter.tsx`
- **Inconsistent Buttons:** 9

  - **component** (line 151): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 167): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 170): `variant="ghost"` → Recommended: `btn--ghost`
  - **component** (line 181): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 184): `variant="ghost"` → Recommended: `btn--ghost`
  - **component** (line 195): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 198): `variant="ghost"` → Recommended: `btn--ghost`
  - **component** (line 209): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 217): `variant="ghost"` → Recommended: `btn--ghost`

### NotificationPage

- **File:** `src/components/pages/admin/notifications/NotificationPage.tsx`
- **Inconsistent Buttons:** 8

  - **component** (line 321): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 326): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 345): `variant="ghost"` → Recommended: `btn--ghost`
  - **component** (line 353): `variant="ghost"` → Recommended: `btn--ghost`
  - **component** (line 401): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 406): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 430): `variant="ghost"` → Recommended: `btn--ghost`
  - **component** (line 438): `variant="ghost"` → Recommended: `btn--ghost`

### SchorsingenPage

- **File:** `src/components/pages/admin/schorsingen/SchorsingenPage.tsx`
- **Inconsistent Buttons:** 8

  - **component** (line 88): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 90): `variant="destructive"` → Recommended: `btn--danger`
  - **component** (line 92): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 99): `variant="destructive"` → Recommended: `btn--danger`
  - **component** (line 101): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 103): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 185): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 213): `variant="outline"` → Recommended: `btn--outline`

### AdminSuspensionsPage

- **File:** `src/components/pages/admin/suspensions/AdminSuspensionsPage.tsx`
- **Inconsistent Buttons:** 7

  - **legacy** (line 311): `btn--outline` → Recommended: `btn--outline`
  - **legacy** (line 480): `btn--icon` → Recommended: `btn--icon`
  - **component** (line 691): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 698): `variant="destructive"` → Recommended: `btn--danger`
  - **component** (line 703): `variant="ghost"` → Recommended: `btn--ghost`
  - **component** (line 708): `variant="ghost"` → Recommended: `btn--ghost`
  - **component** (line 764): `variant="outline"` → Recommended: `btn--outline`

### MatchFilterPanel

- **File:** `src/components/common/MatchFilterPanel.tsx`
- **Inconsistent Buttons:** 5

  - **component** (line 92): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 109): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 120): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 123): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 187): `variant="outline"` → Recommended: `btn--outline`

### AdminCRUDTable

- **File:** `src/components/pages/admin/common/components/AdminCRUDTable.tsx`
- **Inconsistent Buttons:** 5

  - **component** (line 76): `variant="destructive"` → Recommended: `btn--danger`
  - **component** (line 80): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 105): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 116): `variant="outline"` → Recommended: `btn--outline`
  - **legacy** (line 209): `btn-dark` → Recommended: `btn--primary`

### CompetitionDataSettings

- **File:** `src/components/pages/admin/settings/components/CompetitionDataSettings.tsx`
- **Inconsistent Buttons:** 5

  - **component** (line 515): `variant="outline"` → Recommended: `btn--outline`
  - **legacy** (line 570): `btn--icon` → Recommended: `btn--icon`
  - **legacy** (line 620): `btn--icon` → Recommended: `btn--icon`
  - **legacy** (line 676): `btn--icon` → Recommended: `btn--icon`
  - **legacy** (line 739): `btn--icon` → Recommended: `btn--icon`

### SuspensionRulesSettings

- **File:** `src/components/pages/admin/settings/components/SuspensionRulesSettings.tsx`
- **Inconsistent Buttons:** 5

  - **component** (line 132): `variant="destructive"` → Recommended: `btn--danger`
  - **component** (line 150): `variant="ghost"` → Recommended: `btn--ghost`
  - **component** (line 156): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 181): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 231): `variant="outline"` → Recommended: `btn--outline`

### ResponsiveCardsTable

- **File:** `src/components/tables/ResponsiveCardsTable.tsx`
- **Inconsistent Buttons:** 5

  - **component** (line 56): `variant="destructive"` → Recommended: `btn--danger`
  - **component** (line 61): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 80): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 95): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 118): `variant="outline"` → Recommended: `btn--outline`

### AdminTeamSelector

- **File:** `src/components/pages/admin/common/components/AdminTeamSelector.tsx`
- **Inconsistent Buttons:** 4

  - **component** (line 66): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 81): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 86): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 146): `variant="secondary"` → Recommended: `btn--secondary`

### UserListTable

- **File:** `src/components/pages/admin/users/components/UserListTable.tsx`
- **Inconsistent Buttons:** 4

  - **component** (line 245): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 255): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 258): `variant="secondary"` → Recommended: `btn--secondary`
  - **legacy** (line 294): `btn--icon` → Recommended: `btn--icon`

### PlayOffPage

- **File:** `src/components/pages/public/competition/PlayOffPage.tsx`
- **Inconsistent Buttons:** 4

  - **component** (line 41): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 69): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 99): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 275): `variant="secondary"` → Recommended: `btn--secondary`

### AdminPanel

- **File:** `src/components/pages/admin/AdminPanel.tsx`
- **Inconsistent Buttons:** 3

  - **component** (line 270): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 279): `variant="ghost"` → Recommended: `btn--ghost`
  - **component** (line 287): `variant="ghost"` → Recommended: `btn--ghost`

### BekerPage

- **File:** `src/components/pages/admin/beker/components/BekerPage.tsx`
- **Inconsistent Buttons:** 3

  - **component** (line 317): `variant="secondary"` → Recommended: `btn--secondary`
  - **legacy** (line 341): `btn--outline` → Recommended: `btn--outline`
  - **component** (line 478): `variant="destructive"` → Recommended: `btn--danger`

### MatchesCupCard

- **File:** `src/components/pages/admin/matches/components/MatchesCupCard.tsx`
- **Inconsistent Buttons:** 3

  - **component** (line 58): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 67): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 78): `variant="outline"` → Recommended: `btn--outline`

### NotificationFormModal

- **File:** `src/components/pages/admin/notifications/NotificationFormModal.tsx`
- **Inconsistent Buttons:** 3

  - **component** (line 435): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 505): `variant="secondary"` → Recommended: `btn--secondary`
  - **component** (line 590): `variant="secondary"` → Recommended: `btn--secondary`

### BlogPage

- **File:** `src/components/pages/admin/blog/BlogPage.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 225): `variant="outline"` → Recommended: `btn--outline`
  - **legacy** (line 293): `btn--icon` → Recommended: `btn--icon`

### CompetitionPage

- **File:** `src/components/pages/admin/competition/CompetitionPage.tsx`
- **Inconsistent Buttons:** 2

  - **legacy** (line 451): `btn--outline` → Recommended: `btn--outline`
  - **component** (line 600): `variant="destructive"` → Recommended: `btn--danger`

### CompetitionWithFairnessPage

- **File:** `src/components/pages/admin/competition/CompetitionWithFairnessPage.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 129): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 194): `variant="outline"` → Recommended: `btn--outline`

### FinancialPage

- **File:** `src/components/pages/admin/financial/FinancialPage.tsx`
- **Inconsistent Buttons:** 2

  - **legacy** (line 189): `btn--outline` → Recommended: `btn--outline`
  - **legacy** (line 193): `btn--outline` → Recommended: `btn--outline`

### FinancialEnhancedSettingsModal

- **File:** `src/components/pages/admin/financial/components/FinancialEnhancedSettingsModal.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 243): `variant="destructive"` → Recommended: `btn--danger`
  - **legacy** (line 368): `btn--outline` → Recommended: `btn--outline`

### FinancialSettingsModal

- **File:** `src/components/pages/admin/financial/components/FinancialSettingsModal.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 284): `variant="secondary"` → Recommended: `btn--secondary`
  - **legacy** (line 332): `btn--outline` → Recommended: `btn--outline`

### FinancialTeamDetailModal

- **File:** `src/components/pages/admin/financial/components/FinancialTeamDetailModal.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 336): `variant="outline"` → Recommended: `btn--outline`
  - **legacy** (line 478): `btn--outline` → Recommended: `btn--outline`

### AdminPlayoffMatchesPage

- **File:** `src/components/pages/admin/matches/AdminPlayoffMatchesPage.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 24): `variant="destructive"` → Recommended: `btn--danger`
  - **component** (line 28): `variant="outline"` → Recommended: `btn--outline`

### PlayerDataRefreshPopup

- **File:** `src/components/pages/admin/matches/components/PlayerDataRefreshPopup.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 87): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 109): `variant="ghost"` → Recommended: `btn--ghost`

### PlayerPage

- **File:** `src/components/pages/admin/players/PlayerPage.tsx`
- **Inconsistent Buttons:** 2

  - **legacy** (line 126): `btn--outline` → Recommended: `btn--outline`
  - **legacy** (line 140): `btn--outline` → Recommended: `btn--outline`

### PlayersList

- **File:** `src/components/pages/admin/players/components/PlayersList.tsx`
- **Inconsistent Buttons:** 2

  - **legacy** (line 112): `btn--icon` → Recommended: `btn--icon`
  - **component** (line 266): `variant="ghost"` → Recommended: `btn--ghost`

### ScheidsrechtersPage

- **File:** `src/components/pages/admin/scheidsrechter/ScheidsrechtersPage.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 224): `variant="default"` → Recommended: `btn--primary`
  - **component** (line 226): `variant="secondary"` → Recommended: `btn--secondary`

### TabVisibilitySettingsUpdated

- **File:** `src/components/pages/admin/settings/components/TabVisibilitySettingsUpdated.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 136): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 173): `variant="outline"` → Recommended: `btn--outline`

### TimeslotsSettings

- **File:** `src/components/pages/admin/settings/components/TimeslotsSettings.tsx`
- **Inconsistent Buttons:** 2

  - **legacy** (line 224): `btn-dark` → Recommended: `btn--primary`
  - **legacy** (line 260): `btn--icon` → Recommended: `btn--icon`

### VacationsSettings

- **File:** `src/components/pages/admin/settings/components/VacationsSettings.tsx`
- **Inconsistent Buttons:** 2

  - **legacy** (line 199): `btn-dark` → Recommended: `btn--primary`
  - **legacy** (line 239): `btn--icon` → Recommended: `btn--icon`

### UserRow

- **File:** `src/components/user/UserRow.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 41): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 49): `variant="outline"` → Recommended: `btn--outline`

### TeamSelector

- **File:** `src/components/user/dialog/TeamSelector.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 56): `variant="outline"` → Recommended: `btn--outline`
  - **component** (line 108): `variant="secondary"` → Recommended: `btn--secondary`

### TeamsList

- **File:** `src/components/user/teams/TeamsList.tsx`
- **Inconsistent Buttons:** 2

  - **component** (line 95): `variant="outline"` → Recommended: `btn--outline`
  - **legacy** (line 118): `btn--icon` → Recommended: `btn--icon`

### NotificationPopup

- **File:** `src/components/common/NotificationPopup.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 284): `variant="ghost"` → Recommended: `btn--ghost`

### PageHeader

- **File:** `src/components/navigation/PageHeader.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 40): `variant="ghost"` → Recommended: `btn--ghost`

### FairnessPreview

- **File:** `src/components/pages/admin/competition/FairnessPreview.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 55): `variant="outline"` → Recommended: `btn--outline`

### DateGeneratorPreview

- **File:** `src/components/pages/admin/competition/components/DateGeneratorPreview.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 103): `variant="outline"` → Recommended: `btn--outline`

### FinancialAffectedTransactionsModal

- **File:** `src/components/pages/admin/financial/components/FinancialAffectedTransactionsModal.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 165): `variant="destructive"` → Recommended: `btn--danger`

### FinancialCostSettingsModal

- **File:** `src/components/pages/admin/financial/components/FinancialCostSettingsModal.tsx`
- **Inconsistent Buttons:** 1

  - **legacy** (line 288): `btn--outline` → Recommended: `btn--outline`

### FinancialMonthlyReportsModal

- **File:** `src/components/pages/admin/financial/components/FinancialMonthlyReportsModal.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 528): `variant="outline"` → Recommended: `btn--outline`

### MatchesPage

- **File:** `src/components/pages/admin/matches/MatchesPage.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 54): `variant="destructive"` → Recommended: `btn--danger`

### MatchesPastTabContent

- **File:** `src/components/pages/admin/matches/MatchesPastTabContent.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 53): `variant="outline"` → Recommended: `btn--outline`

### MatchesPastList

- **File:** `src/components/pages/admin/matches/components/MatchesPastList.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 38): `variant="outline"` → Recommended: `btn--outline`

### MatchesPenaltyShootoutModal

- **File:** `src/components/pages/admin/matches/components/MatchesPenaltyShootoutModal.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 167): `variant="outline"` → Recommended: `btn--outline`

### MatchesRefereeCardsSection

- **File:** `src/components/pages/admin/matches/components/MatchesRefereeCardsSection.tsx`
- **Inconsistent Buttons:** 1

  - **legacy** (line 248): `btn--icon` → Recommended: `btn--icon`

### MatchesRefereePenaltySection

- **File:** `src/components/pages/admin/matches/components/MatchesRefereePenaltySection.tsx`
- **Inconsistent Buttons:** 1

  - **legacy** (line 291): `btn--icon` → Recommended: `btn--icon`

### VenuesSettings

- **File:** `src/components/pages/admin/settings/components/VenuesSettings.tsx`
- **Inconsistent Buttons:** 1

  - **legacy** (line 215): `btn--icon` → Recommended: `btn--icon`

### TeamsPage

- **File:** `src/components/pages/admin/teams/TeamsPage.tsx`
- **Inconsistent Buttons:** 1

  - **legacy** (line 66): `btn--outline` → Recommended: `btn--outline`

### TeamForm

- **File:** `src/components/pages/admin/teams/components/TeamForm.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 52): `variant="outline"` → Recommended: `btn--outline`

### PlayerSelectionActions

- **File:** `src/components/pages/admin/teams/player-selection/PlayerSelectionActions.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 19): `variant="outline"` → Recommended: `btn--outline`

### UserPage

- **File:** `src/components/pages/admin/users/UserPage.tsx`
- **Inconsistent Buttons:** 1

  - **legacy** (line 108): `btn--outline` → Recommended: `btn--outline`

### Header

- **File:** `src/components/pages/header/Header.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 187): `variant="ghost"` → Recommended: `btn--ghost`

### AlgemeenPage

- **File:** `src/components/pages/public/information/AlgemeenPage.tsx`
- **Inconsistent Buttons:** 1

  - **legacy** (line 156): `btn-dark` → Recommended: `btn--primary`

### KaartenPage

- **File:** `src/components/pages/public/information/KaartenPage.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 218): `variant="outline"` → Recommended: `btn--outline`

### sidebar

- **File:** `src/components/ui/sidebar.tsx`
- **Inconsistent Buttons:** 1

  - **component** (line 304): `variant="ghost"` → Recommended: `btn--ghost`

