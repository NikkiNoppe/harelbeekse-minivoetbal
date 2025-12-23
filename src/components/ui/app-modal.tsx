import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

// Types
export type ModalSize = "xs" | "sm" | "md" | "lg"
export type ModalVariant = "default" | "bottom-sheet" | "fullscreen"

export interface AppModalAction {
  label: string
  onClick: () => void | Promise<void>
  variant?: "primary" | "secondary" | "destructive"
  disabled?: boolean
  loading?: boolean
}

export interface AppModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  primaryAction?: AppModalAction
  secondaryAction?: AppModalAction
  persistent?: boolean
  size?: ModalSize
  variant?: ModalVariant
  "aria-labelledby"?: string
  "aria-describedby"?: string
  className?: string
  showCloseButton?: boolean
  onClose?: () => void
}

// Size mapping
const sizeClasses: Record<ModalSize, string> = {
  xs: "app-modal-xs",
  sm: "app-modal-sm",
  md: "app-modal-md",
  lg: "app-modal-lg",
}

// SSR-safe mobile detection hook using matchMedia
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(() => {
    // SSR-safe initial check
    if (typeof window === "undefined") return false
    return window.matchMedia("(max-width: 639px)").matches
  })

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)")
    
    // Set initial value
    setIsMobile(mediaQuery.matches)
    
    // Listen for changes
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mediaQuery.addEventListener("change", handler)
    
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return isMobile
}

// Determine effective variant based on size and device
const getEffectiveVariant = (
  variant: ModalVariant | undefined,
  size: ModalSize,
  isMobile: boolean
): ModalVariant => {
  // If explicitly set, respect it
  if (variant) return variant
  
  // Desktop: always default (centered)
  if (!isMobile) return "default"
  
  // Mobile: large modals become fullscreen, others become bottom-sheet
  if (size === "lg") return "fullscreen"
  return "bottom-sheet"
}

// Overlay Component
const AppModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("app-modal-overlay", className)}
    {...props}
  />
))
AppModalOverlay.displayName = "AppModalOverlay"

// Main Modal Component
export const AppModal = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AppModalProps
>(
  (
    {
      open,
      onOpenChange,
      title,
      subtitle,
      children,
      primaryAction,
      secondaryAction,
      persistent = false,
      size = "md",
      variant,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      className,
      showCloseButton = true,
      onClose,
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const effectiveVariant = getEffectiveVariant(variant, size, isMobile)
    
    const isBottomSheet = effectiveVariant === "bottom-sheet"
    const isFullscreen = effectiveVariant === "fullscreen"
    const isDefault = effectiveVariant === "default"

    const handleOpenChange = (newOpen: boolean) => {
      if (!newOpen && onClose) {
        onClose()
      }
      onOpenChange(newOpen)
    }

    const handleClose = () => {
      if (onClose) onClose()
      onOpenChange(false)
    }

    const titleId = React.useId()
    const subtitleId = React.useId()

    return (
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <DialogPrimitive.Portal>
          <AppModalOverlay />
          <DialogPrimitive.Content
            ref={ref}
            className={cn(
              "app-modal",
              sizeClasses[size],
              isBottomSheet && "app-modal-bottom-sheet",
              isFullscreen && "app-modal-fullscreen",
              isDefault && "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              className
            )}
            aria-labelledby={ariaLabelledBy || (title ? titleId : undefined)}
            aria-describedby={ariaDescribedBy || (subtitle ? subtitleId : undefined)}
            onPointerDownOutside={(e) => {
              if (persistent) {
                e.preventDefault()
              }
            }}
            onEscapeKeyDown={(e) => {
              if (persistent) {
                e.preventDefault()
              }
            }}
            {...(persistent && { onInteractOutside: (e) => e.preventDefault() })}
          >
            {/* Modal Wrapper - Flex column for proper scrolling */}
            <div className="app-modal-wrapper">
              {/* Close Button - X for default/bottom-sheet, Back arrow for fullscreen */}
              {showCloseButton && !persistent && (
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    className="app-modal-close"
                    aria-label="Close"
                    onClick={handleClose}
                  >
                    {isFullscreen ? (
                      <ArrowLeft className="h-5 w-5" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="sr-only">Close</span>
                  </button>
                </DialogPrimitive.Close>
              )}

              {/* Drag Handle - Bottom sheet only */}
              {isBottomSheet && (
                <div className="app-modal-drag-handle" aria-hidden="true" />
              )}

              {/* Header - Fixed, no scroll */}
              {(title || subtitle) && (
                <AppModalHeader className={isFullscreen ? "pl-12" : undefined}>
                  {title && (
                    <AppModalTitle id={titleId}>{title}</AppModalTitle>
                  )}
                  {subtitle && (
                    <AppModalSubtitle id={subtitleId}>{subtitle}</AppModalSubtitle>
                  )}
                </AppModalHeader>
              )}

              {/* Body - Scrollable content */}
              <AppModalBody>{children}</AppModalBody>

              {/* Footer - Fixed, no scroll */}
              {(primaryAction || secondaryAction) && (
                <AppModalFooter>
                  {secondaryAction && (
                    <button
                      type="button"
                      onClick={secondaryAction.onClick}
                      disabled={secondaryAction.disabled || secondaryAction.loading}
                      className={cn(
                        "btn",
                        secondaryAction.variant === "destructive"
                          ? "btn--danger"
                          : "btn--secondary"
                      )}
                    >
                      {secondaryAction.loading ? "Loading..." : secondaryAction.label}
                    </button>
                  )}
                  {primaryAction && (
                    <button
                      type="button"
                      onClick={primaryAction.onClick}
                      disabled={primaryAction.disabled || primaryAction.loading}
                      className={cn(
                        "btn",
                        primaryAction.variant === "destructive"
                          ? "btn--danger"
                          : "btn--primary"
                      )}
                    >
                      {primaryAction.loading ? "Loading..." : primaryAction.label}
                    </button>
                  )}
                </AppModalFooter>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  }
)
AppModal.displayName = "AppModal"

// Sub-components for composition pattern
export const AppModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("app-modal-header", className)}
    {...props}
  />
))
AppModalHeader.displayName = "AppModalHeader"

export const AppModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("app-modal-title", className)}
    {...props}
  />
))
AppModalTitle.displayName = "AppModalTitle"

export const AppModalSubtitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("app-modal-subtitle", className)}
    {...props}
  />
))
AppModalSubtitle.displayName = "AppModalSubtitle"

export const AppModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("app-modal-body", className)}
    {...props}
  />
))
AppModalBody.displayName = "AppModalBody"

export const AppModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("app-modal-footer", className)}
    {...props}
  />
))
AppModalFooter.displayName = "AppModalFooter"

// Export Dialog primitives for advanced use cases
export {
  DialogPrimitive as DialogPrimitives,
}

