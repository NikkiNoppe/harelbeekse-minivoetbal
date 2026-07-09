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

const sizeMap: Record<ModalSize, string> = {
  xs: "320px",
  sm: "384px",
  md: "448px",
  lg: "672px",
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(0, 0, 0, 0.8)",
  backdropFilter: "blur(4px)",
  animation: "fadeIn 200ms ease-out",
}

const panelStyle = (size: ModalSize): React.CSSProperties => ({
  background: "var(--color-100)",
  borderRadius: "1rem",
  maxWidth: `min(${sizeMap[size]}, calc(100vw - 2rem))`,
  width: `min(${sizeMap[size]}, calc(100vw - 2rem))`,
  maxHeight: "calc(100vh - 2rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
  position: "fixed",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: 1001,
  animation: "fadeIn 250ms ease-out",
})

const headerStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid var(--color-300)",
  background: "var(--color-100)",
  flexShrink: 0,
  borderTopLeftRadius: "1rem",
  borderTopRightRadius: "1rem",
}

const titleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "var(--color-700)",
  margin: 0,
  textAlign: "center",
  lineHeight: 1.35,
}

const bodyStyle: React.CSSProperties = {
  padding: "16px",
  overflowY: "auto",
  flex: "1 1 auto",
  minHeight: 0,
}

const descriptionStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.9375rem",
  lineHeight: 1.6,
  color: "var(--color-600)",
  textAlign: "center",
}

const footerStyle: React.CSSProperties = {
  padding: "12px",
  borderTop: "1px solid var(--color-200)",
  display: "flex",
  flexDirection: "column-reverse",
  gap: "0.875rem",
  flexShrink: 0,
  background: "var(--color-50)",
  borderBottomLeftRadius: "1rem",
  borderBottomRightRadius: "1rem",
}

const actionButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "48px",
  fontSize: "1rem",
  fontWeight: 500,
  borderRadius: "var(--radius)",
  transition: "all 150ms ease-in-out",
}

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
      size = "sm",
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      className,
    },
    ref,
  ) => {
    const titleId = React.useId()
    const descriptionId = React.useId()

    React.useEffect(() => {
      if (!open) return

      const originalOverflow = document.body.style.overflow
      const originalOverflowY = document.body.style.overflowY
      document.body.style.overflow = "hidden"
      document.body.style.overflowY = "hidden"

      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.overflowY = originalOverflowY
      }
    }, [open])

    return (
      <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <AlertDialogPrimitive.Portal>
          <AlertDialogPrimitive.Overlay
            style={overlayStyle}
            data-app-modal-overlay
          />
          <AlertDialogPrimitive.Content
            ref={ref}
            className={cn(className)}
            style={panelStyle(size)}
            aria-labelledby={ariaLabelledBy || titleId}
            aria-describedby={ariaDescribedBy || (description ? descriptionId : undefined)}
          >
            <AppAlertModalHeader style={headerStyle}>
              <AppAlertModalTitle id={titleId} style={titleStyle}>
                {title}
              </AppAlertModalTitle>
            </AppAlertModalHeader>

            {description && (
              <div style={bodyStyle}>
                <AppAlertModalDescription id={descriptionId} style={descriptionStyle}>
                  {description}
                </AppAlertModalDescription>
              </div>
            )}

            <AppAlertModalFooter style={footerStyle}>
              {cancelAction && (
                <AlertDialogPrimitive.Cancel asChild>
                  <button
                    type="button"
                    onClick={cancelAction.onClick}
                    disabled={cancelAction.disabled || cancelAction.loading}
                    className={cn(
                      "btn",
                      cancelAction.variant === "destructive" ? "btn--danger" : "btn--secondary",
                    )}
                    style={actionButtonStyle}
                  >
                    {cancelAction.loading ? "Laden..." : cancelAction.label}
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
                    confirmAction.variant === "destructive" ? "btn--danger" : "btn--primary",
                  )}
                  style={{
                    ...actionButtonStyle,
                    fontWeight: 600,
                  }}
                >
                  {confirmAction.loading ? "Laden..." : confirmAction.label}
                </button>
              </AlertDialogPrimitive.Action>
            </AppAlertModalFooter>

            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }

              @media (prefers-reduced-motion: reduce) {
                [data-app-modal-overlay],
                [role="alertdialog"] {
                  animation-duration: 0.01ms !important;
                  transition-duration: 0.01ms !important;
                }
              }
            `}</style>
          </AlertDialogPrimitive.Content>
        </AlertDialogPrimitive.Portal>
      </AlertDialogPrimitive.Root>
    )
  },
)
AppAlertModal.displayName = "AppAlertModal"

export const AppAlertModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} />
))
AppAlertModalHeader.displayName = "AppAlertModalHeader"

export const AppAlertModalTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn(className)} {...props} />
))
AppAlertModalTitle.displayName = "AppAlertModalTitle"

export const AppAlertModalDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={cn(className)} {...props} />
))
AppAlertModalDescription.displayName = "AppAlertModalDescription"

export const AppAlertModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(className)} {...props} />
))
AppAlertModalFooter.displayName = "AppAlertModalFooter"
