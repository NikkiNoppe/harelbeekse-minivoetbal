# Modal Audit Report

**Generated:** 12/23/2025, 9:15:03 PM

## Summary

- **Total Modals:** 50
- **Migrated (AppModal/AppAlertModal):** 10
- **Legacy (Dialog/AlertDialog):** 40
- **With Hardcoded Colors:** 18
- **Missing Tokens:** 49

## Modals Requiring Migration

### Layout

- **File:** `src/components/Layout.tsx`
- **Type:** Mixed
- **Background:** hardcoded
- **Hardcoded Colors:** bg-purple-100
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### AdminPanel

- **File:** `src/components/pages/admin/AdminPanel.tsx`
- **Type:** Mixed
- **Background:** missing
- **Hardcoded Colors:** bg-purple-100, bg-red-100
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 1

### AdminPlayoffPage

- **File:** `src/components/pages/admin/AdminPlayoffPage.tsx`
- **Type:** Mixed
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 10

### BekerPage

- **File:** `src/components/pages/admin/beker/components/BekerPage.tsx`
- **Type:** Mixed
- **Background:** missing
- **Hardcoded Colors:** bg-gray-50, bg-black
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 6

### BlogPage

- **File:** `src/components/pages/admin/blog/BlogPage.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ✅
  - shadow: ❌
- **Buttons Found:** 4

### AdminCRUDTable

- **File:** `src/components/pages/admin/common/components/AdminCRUDTable.tsx`
- **Type:** Mixed
- **Background:** missing
- **Hardcoded Colors:** bg-purple-50, bg-red-50, bg-white
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 5

### FinancialMonthlyReportsModal

- **File:** `src/components/pages/admin/financial/components/FinancialMonthlyReportsModal.tsx`
- **Type:** Mixed
- **Background:** hardcoded
- **Hardcoded Colors:** bg-purple-100, bg-purple-50, bg-white
- **Token Coverage:**
  - bg-card: ✅
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### TransactionEditModal

- **File:** `src/components/pages/admin/financial/components/TransactionEditModal.tsx`
- **Type:** Mixed
- **Background:** present
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### MatchesFormModal

- **File:** `src/components/pages/admin/matches/MatchesFormModal.tsx`
- **Type:** Mixed
- **Background:** present
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### MatchesPage

- **File:** `src/components/pages/admin/matches/MatchesPage.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 1

### MatchesPenaltyShootoutModal

- **File:** `src/components/pages/admin/matches/components/MatchesPenaltyShootoutModal.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 1

### NotificationFormModal

- **File:** `src/components/pages/admin/notifications/NotificationFormModal.tsx`
- **Type:** Dialog
- **Background:** missing
- **Hardcoded Colors:** bg-white
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 7

### NotificationPage

- **File:** `src/components/pages/admin/notifications/NotificationPage.tsx`
- **Type:** Dialog
- **Background:** missing
- **Hardcoded Colors:** bg-red-50
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 4

### PlayerPage

- **File:** `src/components/pages/admin/players/PlayerPage.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### PlayersList

- **File:** `src/components/pages/admin/players/components/PlayersList.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 3

### usePlayersUpdated

- **File:** `src/components/pages/admin/players/hooks/usePlayersUpdated.ts`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### CompetitionDataSettings

- **File:** `src/components/pages/admin/settings/components/CompetitionDataSettings.tsx`
- **Type:** Dialog
- **Background:** missing
- **Hardcoded Colors:** bg-purple-100, bg-red-50, bg-white
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ✅
  - shadow: ❌
- **Buttons Found:** 13

### SeasonDataSettings

- **File:** `src/components/pages/admin/settings/components/SeasonDataSettings.tsx`
- **Type:** Dialog
- **Background:** missing
- **Hardcoded Colors:** bg-purple-100, bg-red-50, bg-white
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### TimeslotsSettings

- **File:** `src/components/pages/admin/settings/components/TimeslotsSettings.tsx`
- **Type:** Mixed
- **Background:** present
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### VacationsSettings

- **File:** `src/components/pages/admin/settings/components/VacationsSettings.tsx`
- **Type:** Mixed
- **Background:** hardcoded
- **Hardcoded Colors:** bg-red-100
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### VenuesSettings

- **File:** `src/components/pages/admin/settings/components/VenuesSettings.tsx`
- **Type:** Mixed
- **Background:** present
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### AdminSuspensionsPage

- **File:** `src/components/pages/admin/suspensions/AdminSuspensionsPage.tsx`
- **Type:** Dialog
- **Background:** missing
- **Hardcoded Colors:** bg-purple-50, bg-blue-50
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 15

### TeamsPage

- **File:** `src/components/pages/admin/teams/TeamsPage.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 1

### UserPage

- **File:** `src/components/pages/admin/users/UserPage.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 1

### UserDeleteConfirmDialog

- **File:** `src/components/pages/admin/users/components/UserDeleteConfirmDialog.tsx`
- **Type:** Mixed
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### UserListTable

- **File:** `src/components/pages/admin/users/components/UserListTable.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 6

### useUserManagement

- **File:** `src/components/pages/admin/users/hooks/useUserManagement.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### alert-dialog

- **File:** `src/components/ui/alert-dialog.tsx`
- **Type:** Dialog
- **Background:** present
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### app-modal

- **File:** `src/components/ui/app-modal.tsx`
- **Type:** Mixed
- **Background:** present
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 4

### command

- **File:** `src/components/ui/command.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### dialog

- **File:** `src/components/ui/dialog.tsx`
- **Type:** Dialog
- **Background:** present
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### TeamSelector

- **File:** `src/components/user/dialog/TeamSelector.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### UserFormFields

- **File:** `src/components/user/dialog/UserFormFields.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### useEditPlayerOperation

- **File:** `src/components/user/players/hooks/useEditPlayerOperation.ts`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### usePlayerDialogs

- **File:** `src/components/user/players/hooks/usePlayerDialogs.ts`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### usePlayerOperations

- **File:** `src/components/user/players/hooks/usePlayerOperations.ts`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### ConfirmDeleteDialog

- **File:** `src/components/user/teams/ConfirmDeleteDialog.tsx`
- **Type:** Mixed
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

### TeamModal

- **File:** `src/components/user/teams/TeamModal.tsx`
- **Type:** Mixed
- **Background:** present
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### TeamsList

- **File:** `src/components/user/teams/TeamsList.tsx`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌
- **Buttons Found:** 2

### useTeamsEnhanced

- **File:** `src/components/user/teams/hooks/useTeamsEnhanced.ts`
- **Type:** Dialog
- **Background:** missing
- **Token Coverage:**
  - bg-card: ❌
  - text-card-foreground: ❌
  - shadow: ❌

