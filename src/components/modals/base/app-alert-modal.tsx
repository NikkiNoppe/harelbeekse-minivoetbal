import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { cn } from "@/lib/utils"
import type { ModalSize, AppModalAction } from "./app-modal"

export interface AppAlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmAction: AppModalAction
  cancelAction?: AppModalAction
  size?: ModalSize
  "aria-labelledby"?: string
  "aria-describedby"?: string
  className?: string
}

// Size mapping (same as AppModal)
const sizeClasses: Record<ModalSize, string> = {
  xs: "app-modal-xs",
  sm: "app-modal-sm",
  md: "app-modal-md",
  lg: "app-modal-lg",
}

// Overlay Component
const AppAlertModalOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn("app-modal-overlay", className)}
    {...props}
  />
))
AppAlertModalOverlay.displayName = "AppAlertModalOverlay"

// Main Alert Modal Component
export const AppAlertModal = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AppAlertModalProps
>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      confirmAction,
      cancelAction,
      size = "md",
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      className,
    },
    ref
  ) => {
    const titleId = React.useId()
    const descriptionId = React.useId()

    return (
      <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <AlertDialogPrimitive.Portal>
          <AppAlertModalOverlay />
          <AlertDialogPrimitive.Content
            ref={ref}
            className={cn(
              "app-modal",
              sizeClasses[size],
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              className
            )}
            aria-labelledby={ariaLabelledBy || titleId}
            aria-describedby={ariaDescribedBy || (description ? descriptionId : undefined)}
          >
            <AppAlertModalHeader>
              <AppAlertModalTitle id={titleId}>{title}</AppAlertModalTitle>
              {description && (
                <AppAlertModalDescription id={descriptionId}>
                  {description}
                </AppAlertModalDescription>
              )}
            </AppAlertModalHeader>

            <AppAlertModalFooter>
              {cancelAction && (
                <AlertDialogPrimitive.Cancel asChild>
                  <button
                    type="button"
                    onClick={cancelAction.onClick}
                    disabled={cancelAction.disabled || cancelAction.loading}
                    className={cn(
                      "btn",
                      cancelAction.variant === "destructive"
                        ? "btn--danger"
                        : "btn--secondary"
                    )}
                  >
                    {cancelAction.loading ? "Loading..." : cancelAction.label}
                  </button>
                </AlertDialogPrimitive.Cancel>
              )}
              <AlertDialogPrimitive.Action asChild>
                <button
                  type="button"
                  onClick={confirmAction.onClick}
                  disabled={confirmAction.disabled || confirmAction.loading}
                  className={cn(
                    "btn",
                    confirmAction.variant === "destructive"
                      ? "btn--danger"
                      : "btn--primary"
                  )}
                >
                  {confirmAction.loading ? "Loading..." : confirmAction.label}
                </button>
              </AlertDialogPrimitive.Action>
            </AppAlertModalFooter>
          </AlertDialogPrimitive.Content>
        </AlertDialogPrimitive.Portal>
      </AlertDialogPrimitive.Root>
    )
  }
)
AppAlertModal.displayName = "AppAlertModal"

// Sub-components
export const AppAlertModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("app-modal-header", className)}
    {...props}
  />
))
AppAlertModalHeader.displayName = "AppAlertModalHeader"

export const AppAlertModalTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("app-modal-header", className)}
    {...props}
  />
))
AppAlertModalTitle.displayName = "AppAlertModalTitle"

export const AppAlertModalDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("app-modal-subtitle", className)}
    {...props}
  />
))
AppAlertModalDescription.displayName = "AppAlertModalDescription"

export const AppAlertModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("app-modal-footer", className)}
    {...props}
  />
))
AppAlertModalFooter.displayName = "AppAlertModalFooter"





