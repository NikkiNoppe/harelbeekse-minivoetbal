# Modal and Button Standards

This document defines the standards for modal and button components across the codebase.

## Modal Standards

### Token-Based Styling

All modals must use the following design tokens:

#### Required Tokens

1. **Background**: `bg-card`
   - Applied via the `app-modal` CSS class (defined in `src/styles/components/modal.css`)
   - Legacy modals must explicitly add `bg-card` to `DialogContent`/`AlertDialogContent`

2. **Text Color**: `text-card-foreground`
   - Applied automatically via `app-modal` class
   - Legacy modals should add this where text color is explicitly set

3. **Shadow**: `shadow-[var(--shadow-elevation-3)]`
   - Applied via `app-modal` class
   - Legacy modals should use this shadow token

4. **Overlay**: `app-modal-overlay`
   - Applied automatically by AppModal/AppAlertModal components
   - Legacy modals using Dialog/AlertDialog should use this class

### Forbidden Patterns

❌ **Do NOT use:**
- Hardcoded background colors: `bg-purple-100`, `bg-red-50`, `bg-white`, etc.
- Hardcoded text colors: `text-gray-700`, `text-black`, etc.
- Hardcoded shadows: `shadow-lg`, `shadow-xl` (use token instead)

✅ **Do use:**
- `bg-card` for modal backgrounds
- `text-card-foreground` for text
- `shadow-[var(--shadow-elevation-3)]` for shadows
- `app-modal-overlay` for overlay

### Modal Components

#### AppModal (Preferred)

Use `AppModal` for standard modals with forms, content, etc.

```tsx
import { AppModal } from "@/components/ui/app-modal";

<AppModal
  open={open}
  onOpenChange={onOpenChange}
  title="Modal Title"
  subtitle="Optional subtitle"
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
  {/* Modal content */}
</AppModal>
```

#### AppAlertModal (Preferred)

Use `AppAlertModal` for confirmation dialogs and alerts.

```tsx
import { AppAlertModal } from "@/components/ui/app-alert-modal";

<AppAlertModal
  open={open}
  onOpenChange={onOpenChange}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
  confirmAction={{
    label: "Confirm",
    onClick: handleConfirm,
    variant: "destructive" // or "primary"
  }}
  cancelAction={{
    label: "Cancel",
    onClick: () => onOpenChange(false),
    variant: "secondary"
  }}
/>
```

#### Legacy Dialog (Deprecated)

Legacy `Dialog` components should be migrated to `AppModal`. If temporarily using Dialog:

```tsx
<DialogContent className="bg-card text-card-foreground shadow-[var(--shadow-elevation-3)]">
  {/* Content */}
</DialogContent>
```

## Button Standards

### Standard Variants

All buttons must use one of these three standard variants:

#### 1. Primary Button (`btn btn--primary`)

Use for:
- Primary/confirm actions
- Save/Submit buttons
- Default actions

```tsx
<button className="btn btn--primary" onClick={handleSave}>
  Save
</button>
```

#### 2. Secondary Button (`btn btn--secondary`)

Use for:
- Cancel actions
- Neutral/secondary actions
- Alternative options

```tsx
<button className="btn btn--secondary" onClick={handleCancel}>
  Cancel
</button>
```

#### 3. Danger Button (`btn btn--danger`)

Use for:
- Delete actions
- Destructive operations
- Warning actions

```tsx
<button className="btn btn--danger" onClick={handleDelete}>
  Delete
</button>
```

### Forbidden Patterns

❌ **Do NOT use:**
- Hardcoded colors: `bg-purple-600 text-white`, `bg-red-500 text-white`
- Button component variants: `variant="default"`, `variant="destructive"` (migrate to CSS classes)
- Custom button classes: `btn-dark`, `btn-custom`, etc.

✅ **Do use:**
- `btn btn--primary` for primary actions
- `btn btn--secondary` for secondary/cancel actions
- `btn btn--danger` for destructive actions

### Button Component Migration

If using the `Button` component from `@/components/ui/button`, migrate to native buttons with CSS classes:

```tsx
// Before (Button component)
<Button variant="default" onClick={handleSave}>Save</Button>
<Button variant="destructive" onClick={handleDelete}>Delete</Button>
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>

// After (CSS classes)
<button className="btn btn--primary" onClick={handleSave}>Save</button>
<button className="btn btn--danger" onClick={handleDelete}>Delete</button>
<button className="btn btn--secondary" onClick={handleCancel}>Cancel</button>
```

### Modal Footer Buttons

Modal footers should follow this pattern:

```tsx
// AppModal with action props (preferred)
<AppModal
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
/>

// Or manual footer
<AppModalFooter>
  <button className="btn btn--secondary" onClick={handleCancel}>
    Cancel
  </button>
  <button className="btn btn--primary" onClick={handleSave}>
    Save
  </button>
</AppModalFooter>
```

## Reference Files

- **Modal CSS**: `src/styles/components/modal.css`
- **AppModal Component**: `src/components/ui/app-modal.tsx`
- **AppAlertModal Component**: `src/components/ui/app-alert-modal.tsx`
- **Button CSS**: `src/index.css` (lines 388-458)

## Migration Checklist

When migrating a modal:

- [ ] Replace `Dialog`/`AlertDialog` with `AppModal`/`AppAlertModal`
- [ ] Remove hardcoded background colors (`bg-purple-100`, etc.)
- [ ] Ensure `bg-card` is applied (automatic with AppModal)
- [ ] Replace hardcoded button colors with standard variants
- [ ] Use `primaryAction`/`secondaryAction` props or standard button classes
- [ ] Verify shadow uses token (`shadow-[var(--shadow-elevation-3)]`)
- [ ] Test on mobile (bottom-sheet behavior)
- [ ] Verify accessibility (ARIA labels, keyboard navigation)

