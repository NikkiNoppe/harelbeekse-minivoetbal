# Modal and Button Migration Guide

This guide provides step-by-step instructions for migrating legacy modals and buttons to the standardized system.

## Modal Migration Patterns

### Pattern 1: Dialog → AppModal

#### Before (Legacy Dialog)

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="modal">
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      {/* Form content */}
    </div>
    <DialogFooter>
      <Button className="btn btn--secondary" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
      <Button className="btn btn--primary" onClick={handleSave}>
        Save
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### After (AppModal)

```tsx
import { AppModal } from "@/components/ui/app-modal";

<AppModal
  open={open}
  onOpenChange={onOpenChange}
  title="Settings"
  primaryAction={{
    label: "Save",
    onClick: handleSave,
    variant: "primary"
  }}
  secondaryAction={{
    label: "Cancel",
    onClick: () => onOpenChange(false),
    variant: "secondary"
  }}
>
  <div className="space-y-4">
    {/* Form content */}
  </div>
</AppModal>
```

### Pattern 2: AlertDialog → AppAlertModal

#### Before (Legacy AlertDialog)

```tsx
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

<AlertDialog open={open} onOpenChange={onOpenChange}>
  <AlertDialogContent className="modal">
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Item</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete this item? This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel className="btn btn--secondary">
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction className="btn btn--danger" onClick={handleDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### After (AppAlertModal)

```tsx
import { AppAlertModal } from "@/components/ui/app-alert-modal";

<AppAlertModal
  open={open}
  onOpenChange={onOpenChange}
  title="Delete Item"
  description="Are you sure you want to delete this item? This action cannot be undone."
  confirmAction={{
    label: "Delete",
    onClick: handleDelete,
    variant: "destructive"
  }}
  cancelAction={{
    label: "Cancel",
    onClick: () => onOpenChange(false),
    variant: "secondary"
  }}
/>
```

### Pattern 3: Dialog with Custom Footer

#### Before

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="modal bg-purple-100">
    <DialogHeader>
      <DialogTitle>Custom Modal</DialogTitle>
    </DialogHeader>
    <div>Content</div>
    <div className="flex justify-end gap-2 mt-4">
      <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded" onClick={handleCancel}>
        Cancel
      </button>
      <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={handleSave}>
        Save
      </button>
    </div>
  </DialogContent>
</Dialog>
```

#### After

```tsx
import { AppModal, AppModalFooter } from "@/components/ui/app-modal";

<AppModal
  open={open}
  onOpenChange={onOpenChange}
  title="Custom Modal"
>
  <div>Content</div>
  <AppModalFooter>
    <button className="btn btn--secondary" onClick={handleCancel}>
      Cancel
    </button>
    <button className="btn btn--primary" onClick={handleSave}>
      Save
    </button>
  </AppModalFooter>
</AppModal>
```

## Button Migration Patterns

### Pattern 1: Hardcoded Colors → Standard Variants

#### Before

```tsx
<button className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded">
  Save
</button>

<button className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded">
  Delete
</button>

<button className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded">
  Cancel
</button>
```

#### After

```tsx
<button className="btn btn--primary">
  Save
</button>

<button className="btn btn--danger">
  Delete
</button>

<button className="btn btn--secondary">
  Cancel
</button>
```

### Pattern 2: Button Component → CSS Classes

#### Before

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" onClick={handleSave}>Save</Button>
<Button variant="destructive" onClick={handleDelete}>Delete</Button>
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>
```

#### After

```tsx
<button className="btn btn--primary" onClick={handleSave}>Save</button>
<button className="btn btn--danger" onClick={handleDelete}>Delete</button>
<button className="btn btn--secondary" onClick={handleCancel}>Cancel</button>
```

### Pattern 3: Mixed Button Styles

#### Before

```tsx
<div className="flex gap-2">
  <button className="btn-dark">Primary</button>
  <button className="bg-white text-purple-600 border border-purple-600">Secondary</button>
  <button className="text-red-600 border border-red-600 hover:bg-red-50">Danger</button>
</div>
```

#### After

```tsx
<div className="flex gap-2">
  <button className="btn btn--primary">Primary</button>
  <button className="btn btn--secondary">Secondary</button>
  <button className="btn btn--danger">Danger</button>
</div>
```

## Step-by-Step Migration Process

### For Each Modal:

1. **Identify the modal type**
   - Is it a `Dialog` or `AlertDialog`?
   - Does it need confirmation (use `AppAlertModal`) or form/content (use `AppModal`)?

2. **Update imports**
   ```tsx
   // Remove
   import { Dialog, DialogContent, ... } from "@/components/ui/dialog";
   
   // Add
   import { AppModal } from "@/components/ui/app-modal";
   // or
   import { AppAlertModal } from "@/components/ui/app-alert-modal";
   ```

3. **Replace modal structure**
   - Move `title` to `AppModal`/`AppAlertModal` prop
   - Move content to children
   - Convert footer buttons to `primaryAction`/`secondaryAction` props

4. **Remove hardcoded styles**
   - Remove `className="modal"` (handled by AppModal)
   - Remove hardcoded colors like `bg-purple-100`
   - Remove custom shadow classes

5. **Standardize buttons**
   - Replace hardcoded button colors with `btn btn--primary/secondary/danger`
   - Use action props if possible, otherwise use standard classes in footer

6. **Test**
   - Verify modal opens/closes correctly
   - Check mobile bottom-sheet behavior
   - Verify button hover/active states
   - Test keyboard navigation (ESC to close, Tab navigation)

### For Each Button:

1. **Identify button purpose**
   - Primary action → `btn btn--primary`
   - Cancel/secondary → `btn btn--secondary`
   - Delete/destructive → `btn btn--danger`

2. **Replace classes**
   - Remove all hardcoded color classes
   - Add `btn` base class
   - Add appropriate variant class (`btn--primary`, `btn--secondary`, or `btn--danger`)

3. **Remove Button component** (if used)
   - Replace `<Button variant="...">` with `<button className="btn btn--...">`
   - Keep all event handlers and props

4. **Test**
   - Verify button appearance
   - Check hover/active states
   - Verify disabled state (if applicable)

## Common Issues and Solutions

### Issue: Modal has custom header styling

**Solution**: Use `AppModalHeader` and `AppModalTitle` sub-components for custom styling:

```tsx
<AppModal open={open} onOpenChange={onOpenChange}>
  <AppModalHeader className="custom-header-class">
    <AppModalTitle>Custom Title</AppModalTitle>
  </AppModalHeader>
  <AppModalBody>
    {/* Content */}
  </AppModalBody>
</AppModal>
```

### Issue: Modal needs persistent behavior (can't close)

**Solution**: Use `persistent` prop:

```tsx
<AppModal
  open={open}
  onOpenChange={onOpenChange}
  persistent={true}
  // ... other props
/>
```

### Issue: Button has loading state

**Solution**: Use `loading` prop in action or add loading indicator manually:

```tsx
<AppModal
  primaryAction={{
    label: "Save",
    onClick: handleSave,
    variant: "primary",
    loading: isSaving
  }}
/>

// Or manually
<button className="btn btn--primary" disabled={isSaving}>
  {isSaving ? "Saving..." : "Save"}
</button>
```

### Issue: Modal has complex footer with multiple buttons

**Solution**: Use `AppModalFooter` with manual buttons:

```tsx
<AppModal open={open} onOpenChange={onOpenChange} title="Title">
  <AppModalBody>
    {/* Content */}
  </AppModalBody>
  <AppModalFooter>
    <button className="btn btn--secondary" onClick={handleCancel}>
      Cancel
    </button>
    <button className="btn btn--outline" onClick={handlePreview}>
      Preview
    </button>
    <button className="btn btn--primary" onClick={handleSave}>
      Save
    </button>
  </AppModalFooter>
</AppModal>
```

## Migration Priority

1. **High Priority** (User-facing modals):
   - Financial modals (FinancialSettingsModal, FinancialMonthlyReportsModal, etc.)
   - User modals (TeamModal, ForgotPasswordModal)
   - Settings modals (VenuesSettings, TimeslotsSettings, VacationsSettings)

2. **Medium Priority** (Admin modals):
   - AdminPlayoffPage inline modals
   - Notification modals
   - Player modals (if not already migrated)

3. **Low Priority** (Internal/utility modals):
   - Command palette
   - Dialog primitives (if used directly)

## Validation

After migration, verify:

- [ ] Modal uses `bg-card` (check via browser inspector)
- [ ] No hardcoded colors in modal or buttons
- [ ] Buttons use standard variants (`btn--primary/secondary/danger`)
- [ ] Mobile bottom-sheet works (if applicable)
- [ ] Keyboard navigation works (ESC, Tab)
- [ ] Accessibility (ARIA labels present)
- [ ] Visual appearance matches design system

