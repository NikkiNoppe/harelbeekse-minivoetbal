# Modal Migration Report

## Executive Summary

This report identifies all remaining modals that need migration to the unified `AppModal`/`AppAlertModal` system. **15 modal components** have been identified that still use the legacy `Dialog`/`AlertDialog` components directly.

---

## Migration Status Overview

### ✅ Already Migrated
- `ConfirmDeleteDialog.tsx` → `AppAlertModal`
- `UserDeleteConfirmDialog.tsx` → `AppAlertModal`
- `PlayerModal.tsx` → `AppModal`
- `UserModal.tsx` → `AppModal`
- `MatchesFormModal.tsx` → `AppModal`
- `BekerPage.tsx` (inline modal) → `AppAlertModal`
- `CompetitionPage.tsx` (inline modal) → `AppAlertModal`

### ⚠️ Needs Migration (15 components)

---

## Detailed Migration Analysis

### 1. Financial Modals (7 components)

#### 1.1 `FinancialSettingsModal.tsx`
**Location:** `src/components/pages/admin/financial/components/FinancialSettingsModal.tsx`  
**Lines:** 1-405  
**Current Issues:**
- Uses `Dialog` directly (line 2)
- Uses `AlertDialog` for delete confirmation (lines 15-23)
- Hardcoded classes: `className="modal"` (line ~260)
- Missing mobile bottom-sheet support
- Delete confirmation uses legacy `AlertDialog` components

**Migration Snippet:**
```tsx
// Replace Dialog import
- import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
+ import { AppModal, AppModalBody, AppModalHeader, AppModalTitle } from "@/components/ui/app-modal";
+ import { AppAlertModal } from "@/components/ui/app-alert-modal";

// Replace main Dialog wrapper (around line 260)
- <Dialog open={open} onOpenChange={onOpenChange}>
-   <DialogContent className="modal">
-     <DialogHeader>
-       <DialogTitle>Kosteninstellingen</DialogTitle>
-     </DialogHeader>
+ <AppModal
+   open={open}
+   onOpenChange={onOpenChange}
+   title="Kosteninstellingen"
+   size="lg"
+ >
+   <AppModalBody>
     {/* Existing form content */}
-   </DialogContent>
- </Dialog>
+   </AppModalBody>
+ </AppModal>

// Replace delete AlertDialog (around line ~300)
- <AlertDialog open={deletingItem !== null} onOpenChange={...}>
-   <AlertDialogContent className="modal">
+ <AppAlertModal
+   open={deletingItem !== null}
+   onOpenChange={(open) => !open && setDeletingItem(null)}
+   title="Kosteninstelling verwijderen"
+   description="Weet je zeker dat je deze kosteninstelling wilt verwijderen?"
+   confirmAction={{
+     label: "Verwijderen",
+     onClick: handleDelete,
+     variant: "destructive",
+   }}
+   cancelAction={{
+     label: "Annuleren",
+     onClick: () => setDeletingItem(null),
+   }}
+ />
```

**Missing Tokens:**
- Replace hardcoded `bg-white` with `bg-card`
- Replace `text-gray-*` with `text-muted-foreground`

---

#### 1.2 `FinancialTeamDetailModal.tsx`
**Location:** `src/components/pages/admin/financial/components/FinancialTeamDetailModal.tsx`  
**Lines:** 1-506  
**Current Issues:**
- Uses `Dialog` directly (line 2)
- Hardcoded classes: `className="modal"` (line ~200)
- Missing mobile bottom-sheet support
- Nested `TransactionEditModal` (also needs migration)

**Migration Snippet:**
```tsx
// Replace Dialog import
- import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
+ import { AppModal, AppModalBody, AppModalHeader, AppModalTitle } from "@/components/ui/app-modal";

// Replace Dialog wrapper (around line 200)
- <Dialog open={open} onOpenChange={onOpenChange}>
-   <DialogContent className="modal">
-     <DialogHeader>
-       <DialogTitle>Financiële Details: {team?.team_name}</DialogTitle>
-     </DialogHeader>
+ <AppModal
+   open={open}
+   onOpenChange={onOpenChange}
+   title={`Financiële Details: ${team?.team_name}`}
+   size="lg"
+ >
+   <AppModalBody>
     {/* Existing content */}
-   </DialogContent>
- </Dialog>
+   </AppModalBody>
+ </AppModal>
```

**Missing Tokens:**
- Replace `bg-white` with `bg-card`
- Replace `border-gray-*` with `border-border`

---

#### 1.3 `TransactionEditModal.tsx`
**Location:** `src/components/pages/admin/financial/components/TransactionEditModal.tsx`  
**Lines:** 1-234  
**Current Issues:**
- Uses `Dialog` directly (line 2)
- Hardcoded classes: `className="modal"` (line ~150)
- Missing mobile bottom-sheet support

**Migration Snippet:**
```tsx
// Replace Dialog import
- import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
+ import { AppModal, AppModalBody, AppModalHeader, AppModalTitle, AppModalFooter } from "@/components/ui/app-modal";

// Replace Dialog wrapper (around line 150)
- <Dialog open={open} onOpenChange={onOpenChange}>
-   <DialogContent className="modal">
-     <DialogHeader>
-       <DialogTitle>Transactie bewerken</DialogTitle>
-     </DialogHeader>
+ <AppModal
+   open={open}
+   onOpenChange={onOpenChange}
+   title="Transactie bewerken"
+   size="md"
+   primaryAction={{
+     label: isSubmitting ? "Opslaan..." : "Opslaan",
+     onClick: handleSave,
+     disabled: isSubmitting,
+     loading: isSubmitting,
+   }}
+   secondaryAction={{
+     label: "Annuleren",
+     onClick: () => onOpenChange(false),
+   }}
+ >
+   <AppModalBody>
     {/* Existing form */}
-     <DialogFooter>
-       {/* Actions */}
-     </DialogFooter>
-   </DialogContent>
- </Dialog>
+   </AppModalBody>
+ </AppModal>
```

---

#### 1.4 `FinancialEnhancedSettingsModal.tsx`
**Location:** `src/components/pages/admin/financial/components/FinancialEnhancedSettingsModal.tsx`  
**Lines:** 1-411  
**Current Issues:**
- Uses `Dialog` directly (line 3)
- Hardcoded classes: `className="modal"` (line ~200)
- Missing mobile bottom-sheet support

**Migration:** Similar to `FinancialSettingsModal.tsx` (see 1.1)

---

#### 1.5 `FinancialAffectedTransactionsModal.tsx`
**Location:** `src/components/pages/admin/financial/components/FinancialAffectedTransactionsModal.tsx`  
**Lines:** 1-179  
**Current Issues:**
- Uses `Dialog` directly (line 2)
- Hardcoded classes: `className="modal"` (line ~60)
- Missing mobile bottom-sheet support

**Migration Snippet:**
```tsx
// Replace Dialog import
- import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
+ import { AppModal, AppModalBody, AppModalHeader, AppModalTitle } from "@/components/ui/app-modal";

// Replace Dialog wrapper (around line 60)
- <Dialog open={open} onOpenChange={onOpenChange}>
-   <DialogContent className="modal">
-     <DialogHeader>
-       <DialogTitle>Betrokken Transacties</DialogTitle>
-     </DialogHeader>
+ <AppModal
+   open={open}
+   onOpenChange={onOpenChange}
+   title="Betrokken Transacties"
+   size="lg"
+ >
+   <AppModalBody>
     {/* Existing table content */}
-   </DialogContent>
- </Dialog>
+   </AppModalBody>
+ </AppModal>
```

---

#### 1.6 `FinancialCostSettingsModal.tsx`
**Location:** `src/components/pages/admin/financial/components/FinancialCostSettingsModal.tsx`  
**Lines:** 1-320  
**Current Issues:**
- Uses `Dialog` directly (line 3)
- Hardcoded classes: `className="modal"` (line ~150)
- Missing mobile bottom-sheet support

**Migration:** Similar to `FinancialSettingsModal.tsx` (see 1.1)

---

#### 1.7 `FinancialMonthlyReportsModal.tsx`
**Location:** `src/components/pages/admin/financial/components/FinancialMonthlyReportsModal.tsx`  
**Lines:** 1-538  
**Current Issues:**
- Uses `Dialog` directly (line 2)
- Hardcoded classes: `className="modal"` (line ~150)
- Missing mobile bottom-sheet support
- Large content area (needs `size="lg"`)

**Migration Snippet:**
```tsx
// Replace Dialog import
- import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
+ import { AppModal, AppModalBody, AppModalHeader, AppModalTitle } from "@/components/ui/app-modal";

// Replace Dialog wrapper (around line 150)
- <Dialog open={open} onOpenChange={onOpenChange}>
-   <DialogContent className="modal">
-     <DialogHeader>
-       <DialogTitle>Maandelijkse Rapporten</DialogTitle>
-     </DialogHeader>
+ <AppModal
+   open={open}
+   onOpenChange={onOpenChange}
+   title="Maandelijkse Rapporten"
+   size="lg"
+ >
+   <AppModalBody>
     {/* Existing report content */}
-   </DialogContent>
- </Dialog>
+   </AppModalBody>
+ </AppModal>
```

---

### 2. User/Team Modals (2 components)

#### 2.1 `TeamModal.tsx`
**Location:** `src/components/user/teams/TeamModal.tsx`  
**Lines:** 1-444  
**Current Issues:**
- Uses `Dialog` directly (line 3)
- Hardcoded classes: `className="modal"` (line ~200)
- Missing mobile bottom-sheet support
- Complex form with nested preferences

**Migration Snippet:**
```tsx
// Replace Dialog import
- import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
+ import { AppModal, AppModalBody, AppModalHeader, AppModalTitle, AppModalFooter } from "@/components/ui/app-modal";

// Replace Dialog wrapper (around line 200)
- <Dialog open={open} onOpenChange={onOpenChange}>
-   <DialogContent className="modal">
-     <DialogHeader>
-       <DialogTitle>{modalTitle}</DialogTitle>
-     </DialogHeader>
+ <AppModal
+   open={open}
+   onOpenChange={onOpenChange}
+   title={modalTitle}
+   size="lg"
+   primaryAction={{
+     label: saveButtonText,
+     onClick: handleSave,
+     disabled: !isFormValid || isLoading,
+     loading: isLoading,
+   }}
+   secondaryAction={{
+     label: "Annuleren",
+     onClick: () => onOpenChange(false),
+   }}
+ >
+   <AppModalBody>
     {/* Existing form content */}
-     <DialogFooter>
-       {/* Actions */}
-     </DialogFooter>
-   </DialogContent>
- </Dialog>
+   </AppModalBody>
+ </AppModal>
```

---

#### 2.2 `ForgotPasswordModal.tsx`
**Location:** `src/components/pages/login/ForgotPasswordModal.tsx`  
**Lines:** 1-126  
**Current Issues:**
- Uses `Dialog` directly (line 8)
- Hardcoded classes: `className="modal"` (line 67)
- Custom close button (line 68-75)
- Missing mobile bottom-sheet support

**Migration Snippet:**
```tsx
// Replace Dialog import
- import { Dialog, DialogContent } from "@/components/ui/dialog";
+ import { AppModal, AppModalBody } from "@/components/ui/app-modal";

// Replace Dialog wrapper (around line 66)
- <Dialog open={open} onOpenChange={onOpenChange}>
-   <DialogContent className="modal relative">
-     <button className="btn--close absolute top-3 right-3 z-10" ...>
-       <X size={20} />
-     </button>
-     <div className="modal__title">Wachtwoord vergeten</div>
+ <AppModal
+   open={open}
+   onOpenChange={onOpenChange}
+   title="Wachtwoord vergeten"
+   size="sm"
+   primaryAction={{
+     label: isLoading ? "Versturen..." : "Wachtwoord resetten",
+     onClick: form.handleSubmit(onSubmit),
+     disabled: isLoading,
+     loading: isLoading,
+   }}
+   secondaryAction={{
+     label: "Annuleren",
+     onClick: () => onOpenChange(false),
+   }}
+ >
+   <AppModalBody>
     <Form {...form}>
       {/* Existing form fields */}
-       <div className="modal__actions">
-         {/* Actions */}
-       </div>
     </Form>
-   </DialogContent>
- </Dialog>
+   </AppModalBody>
+ </AppModal>
```

---

### 3. Match/Admin Modals (3 components)

#### 3.1 `MatchesPenaltyShootoutModal.tsx`
**Location:** `src/components/pages/admin/matches/components/MatchesPenaltyShootoutModal.tsx`  
**Lines:** 1-185  
**Current Issues:**
- Uses `Dialog` directly (line 3)
- **Custom styling:** `className="sm:max-w-2xl max-w-[95vw] min-h-[500px] bg-background border shadow-xl relative mx-4 sm:mx-auto z-[1003] animate-in slide-in-from-bottom-4 duration-300"` (line 82)
- Custom close button (line 83-90)
- Hardcoded z-index: `z-[1003]` (should use `z-modal`)
- Custom animation classes

**Migration Snippet:**
```tsx
// Replace Dialog import
- import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
+ import { AppModal, AppModalBody, AppModalHeader, AppModalTitle, AppModalSubtitle } from "@/components/ui/app-modal";

// Replace Dialog wrapper (around line 81)
- <Dialog open={open} onOpenChange={onOpenChange}>
-   <DialogContent className="sm:max-w-2xl max-w-[95vw] min-h-[500px] bg-background border shadow-xl relative mx-4 sm:mx-auto z-[1003] animate-in slide-in-from-bottom-4 duration-300">
-     <button className="btn--close" ...>
-       <X size={20} />
-     </button>
-     <DialogHeader className="pb-6">
-       <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
-         <Target className="h-6 w-6 text-primary" />
-         Penalty Shootout
-       </DialogTitle>
-       <DialogDescription className="text-muted-foreground text-base mt-2">
-         De wedstrijd staat gelijk na reguliere speeltijd...
-       </DialogDescription>
-     </DialogHeader>
+ <AppModal
+   open={open}
+   onOpenChange={onOpenChange}
+   title={
+     <div className="flex items-center gap-3">
+       <Target className="h-6 w-6 text-primary" />
+       Penalty Shootout
+     </div>
+   }
+   subtitle="De wedstrijd staat gelijk na reguliere speeltijd. In bekercompetitie moet er een winnaar zijn - bepaal deze via penalty's."
+   size="lg"
+   primaryAction={{
+     label: "Bevestigen",
+     onClick: handleSubmit,
+     disabled: !!error,
+   }}
+   secondaryAction={{
+     label: "Annuleren",
+     onClick: handleCancel,
+   }}
+ >
+   <AppModalBody className="min-h-[400px]">
     {/* Existing form content */}
-   </DialogContent>
- </Dialog>
```

**Missing Tokens:**
- Remove hardcoded `z-[1003]` (use default `z-modal`)
- Replace `shadow-xl` with `shadow-[var(--shadow-elevation-3)]`
- Remove custom animation classes (handled by AppModal)

---

#### 3.2 `NotificationFormModal.tsx`
**Location:** `src/components/pages/admin/notifications/NotificationFormModal.tsx`  
**Lines:** 1-783  
**Current Issues:**
- Uses `Dialog` directly (line 4)
- **Custom layout:** `className="modal p-0 gap-0 flex flex-col"` (line 260)
- Sticky header/footer (lines 262, 762)
- Complex scrollable form
- Missing mobile bottom-sheet support

**Migration Snippet:**
```tsx
// Replace Dialog import
- import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
+ import { AppModal, AppModalBody, AppModalHeader, AppModalTitle, AppModalFooter } from "@/components/ui/app-modal";

// Replace Dialog wrapper (around line 259)
- <Dialog open={isOpen} onOpenChange={onClose}>
-   <DialogContent className="modal p-0 gap-0 flex flex-col">
-     <div className="modal__title sticky top-0 z-10 flex items-center gap-2">
-       <Bell className="w-5 h-5 text-[var(--color-500)]" />
-       {isEditing ? 'Notificatie Bewerken' : 'Nieuwe Notificatie'}
-     </div>
-     <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
+ <AppModal
+   open={isOpen}
+   onOpenChange={onClose}
+   title={
+     <div className="flex items-center gap-2">
+       <Bell className="w-5 h-5 text-[var(--color-500)]" />
+       {isEditing ? 'Notificatie Bewerken' : 'Nieuwe Notificatie'}
+     </div>
+   }
+   size="lg"
+   variant="default" // Keep as default for large forms
+   primaryAction={{
+     label: isSubmitting ? 'Opslaan...' : (isEditing ? 'Bijwerken' : 'Aanmaken'),
+     onClick: () => formRef.current?.requestSubmit(),
+     disabled: isSubmitting || !formData.message,
+     loading: isSubmitting,
+   }}
+   secondaryAction={{
+     label: "Annuleren",
+     onClick: onClose,
+   }}
+ >
+   <AppModalBody>
+     <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
       {/* Existing form content - remove sticky header/footer */}
-       <div className="modal__actions sticky bottom-0">
-         {/* Actions */}
-       </div>
     </form>
-   </DialogContent>
- </Dialog>
+   </AppModalBody>
+ </AppModal>
```

**Note:** This modal has complex internal state. The form submission should be handled via a ref to the form element.

---

#### 3.3 `AdminPlayoffPage.tsx` (AlertDialog)
**Location:** `src/components/pages/admin/AdminPlayoffPage.tsx`  
**Lines:** 1023-1058  
**Current Issues:**
- Uses `AlertDialog` directly (line 1023)
- Hardcoded classes: `className="modal max-w-[90vw] sm:max-w-md"` (line 1032)
- Missing mobile bottom-sheet support

**Migration Snippet:**
```tsx
// Replace AlertDialog import
- import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
+ import { AppAlertModal } from "@/components/ui/app-alert-modal";

// Replace AlertDialog (around line 1023)
- <AlertDialog open={confirmAction !== null} onOpenChange={...}>
-   <AlertDialogContent className="modal max-w-[90vw] sm:max-w-md">
-     <AlertDialogHeader>
-       <AlertDialogTitle className="modal__title">
-         {confirmAction && confirmDialogContent[confirmAction].title}
-       </AlertDialogTitle>
-       <div className="text-center text-sm text-muted-foreground">
-         {confirmAction && confirmDialogContent[confirmAction].description}
-       </div>
-     </AlertDialogHeader>
-     <AlertDialogFooter className="modal__actions">
-       <AlertDialogCancel disabled={actionLoading} className="btn btn--secondary flex-1">
-         Annuleren
-       </AlertDialogCancel>
-       <Button onClick={handleConfirmedAction} disabled={actionLoading} ...>
-         {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
-         {confirmAction && confirmDialogContent[confirmAction].actionLabel}
-       </Button>
-     </AlertDialogFooter>
-   </AlertDialogContent>
- </AlertDialog>
+ <AppAlertModal
+   open={confirmAction !== null}
+   onOpenChange={(open) => {
+     if (!open && !actionLoading) {
+       setConfirmAction(null);
+     }
+   }}
+   title={confirmAction ? confirmDialogContent[confirmAction].title : ''}
+   description={
+     <div className="text-center text-sm text-muted-foreground">
+       {confirmAction && confirmDialogContent[confirmAction].description}
+     </div>
+   }
+   confirmAction={{
+     label: confirmAction ? confirmDialogContent[confirmAction].actionLabel : '',
+     onClick: handleConfirmedAction,
+     variant: confirmAction === 'delete' ? 'destructive' : 'primary',
+     disabled: actionLoading,
+     loading: actionLoading,
+   }}
+   cancelAction={{
+     label: "Annuleren",
+     onClick: () => setConfirmAction(null),
+     disabled: actionLoading,
+   }}
+   size="sm"
+ />
```

---

### 4. Settings Modals (3 components - likely nested in settings pages)

#### 4.1 Settings Components
**Locations:**
- `src/components/pages/admin/settings/components/SeasonDataSettings.tsx`
- `src/components/pages/admin/settings/components/CompetitionDataSettings.tsx`
- `src/components/pages/admin/settings/components/VenuesSettings.tsx`
- `src/components/pages/admin/settings/components/TimeslotsSettings.tsx`
- `src/components/pages/admin/settings/components/VacationsSettings.tsx`

**Status:** These likely contain nested modals. Need to check each file for Dialog usage.

**Action Required:** Review each file for Dialog/AlertDialog usage and migrate accordingly.

---

## Common Issues Across All Modals

### Styling Issues
1. **Hardcoded classes:** All use `className="modal"` instead of AppModal classes
2. **Missing design tokens:**
   - `bg-white` → `bg-card`
   - `text-gray-*` → `text-muted-foreground`
   - `border-gray-*` → `border-border`
   - `shadow-xl` → `shadow-[var(--shadow-elevation-3)]`
3. **Custom z-index:** Some use `z-[1003]` instead of `z-modal`

### Accessibility Issues
1. **Missing ARIA attributes:** Some modals don't properly set `aria-labelledby`/`aria-describedby`
2. **Custom close buttons:** Some have custom close buttons instead of using AppModal's built-in close
3. **Focus trap:** Already handled by Radix, but should verify after migration

### Mobile Issues
1. **No bottom-sheet variant:** All modals use desktop-centered layout on mobile
2. **Fixed positioning:** Some use custom positioning that breaks on mobile
3. **Touch targets:** Some buttons may be too small (< 44px)

---

## Migration Priority

### High Priority (User-facing)
1. `ForgotPasswordModal.tsx` - Login flow
2. `TeamModal.tsx` - User team management
3. `MatchesPenaltyShootoutModal.tsx` - Match flow

### Medium Priority (Admin)
4. `FinancialSettingsModal.tsx`
5. `FinancialTeamDetailModal.tsx`
6. `TransactionEditModal.tsx`
7. `NotificationFormModal.tsx`
8. `AdminPlayoffPage.tsx` (AlertDialog)

### Low Priority (Internal/Complex)
9. `FinancialEnhancedSettingsModal.tsx`
10. `FinancialAffectedTransactionsModal.tsx`
11. `FinancialCostSettingsModal.tsx`
12. `FinancialMonthlyReportsModal.tsx`
13. Settings components (to be reviewed)

---

## Verification Checklist

After migration, verify each modal:

### Visual
- [ ] Modal opens/closes smoothly
- [ ] Mobile: Bottom-sheet variant appears on <640px
- [ ] Desktop: Centered modal with proper max-width
- [ ] Overlay has correct opacity and backdrop blur
- [ ] Animations respect `prefers-reduced-motion`

### Accessibility
- [ ] Focus trap works (Tab cycles within modal)
- [ ] ESC key closes modal
- [ ] Overlay click closes modal (unless persistent)
- [ ] Screen reader announces modal title
- [ ] `aria-labelledby` and `aria-describedby` are set

### Functionality
- [ ] Form submissions work correctly
- [ ] Loading states display properly
- [ ] Error messages appear correctly
- [ ] Nested modals stack correctly (z-index)
- [ ] Scrollable content works in modal body

### Design Tokens
- [ ] All colors use design tokens
- [ ] Shadows use `--shadow-elevation-3`
- [ ] Borders use `border-border`
- [ ] Transitions use `var(--transition-fast)` or `var(--transition-base)`

---

## Missing Token References

The following hardcoded values should be replaced with design tokens:

### Colors
- `bg-white` → `bg-card`
- `text-gray-600` → `text-muted-foreground`
- `text-gray-500` → `text-muted-foreground`
- `border-gray-300` → `border-border`
- `bg-gray-50` → `bg-muted`

### Shadows
- `shadow-xl` → `shadow-[var(--shadow-elevation-3)]`
- `shadow-lg` → `shadow-[var(--shadow-elevation-2)]`

### Z-Index
- `z-[1003]` → `z-modal` (1000)
- `z-50` → `z-modal` (for overlays)

---

## Next Steps

1. **Create migration branch:** `git checkout -b migrate-remaining-modals`
2. **Migrate high-priority modals first** (ForgotPasswordModal, TeamModal, MatchesPenaltyShootoutModal)
3. **Test each migration** in isolation
4. **Migrate medium-priority modals** (Financial modals, NotificationFormModal)
5. **Review settings components** for nested modals
6. **Run full test suite** to ensure no regressions
7. **Update documentation** with AppModal usage examples

---

## Notes

- `LoginModal.tsx` is content-only (wrapped by Dialog in Layout.tsx) - no migration needed
- Some modals have complex internal state - preserve this logic when migrating
- Large forms (NotificationFormModal) may benefit from keeping `variant="default"` instead of auto bottom-sheet
- Nested modals (e.g., TransactionEditModal inside FinancialTeamDetailModal) should be migrated together

---

**Report Generated:** $(date)  
**Total Modals Identified:** 15  
**Estimated Migration Time:** 4-6 hours

