import * as React from "react"
import ReactDOM from "react-dom"
import { X } from "lucide-react"

/**
 * AppModal - Lightweight Portal-based Modal
 * 
 * Vervangt de oude Radix-based implementatie met een pure React Portal.
 * Behoudt dezelfde API voor backward compatibility.
 */

// Types (behouden voor compatibility)
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

// Size mapping (voor width)
const sizeMap: Record<ModalSize, string> = {
  xs: "320px",
  sm: "384px",
  md: "448px",
  lg: "672px"
};

export const AppModal = React.forwardRef<HTMLDivElement, AppModalProps>(
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
      showCloseButton = true,
      onClose,
    },
    ref
  ) => {
    // Body scroll lock
    React.useEffect(() => {
      if (open) {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }, [open]);

    // Escape key handler
    React.useEffect(() => {
      if (!open || persistent) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose?.();
          onOpenChange(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, persistent, onOpenChange, onClose]);

    const handleOverlayClick = () => {
      if (!persistent) {
        onClose?.();
        onOpenChange(false);
      }
    };

    const handleCloseClick = () => {
      onClose?.();
      onOpenChange(false);
    };

    if (!open) return null;

    // Bepaal of modal klein genoeg is voor centrale positie op mobile
    const isSmallModal = size === 'xs' || size === 'sm';
    
    const modalContent = (
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: isSmallModal ? 'center' : 'flex-start',
          justifyContent: 'center',
          animation: 'fadeIn 200ms ease-out',
          padding: isSmallModal ? '1rem' : '0',
          paddingTop: isSmallModal ? '1rem' : 'env(safe-area-inset-top, 0)'
        }}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={subtitle ? 'modal-subtitle' : undefined}
        data-modal-size={size}
      >
        <div 
          ref={ref}
          style={{
            background: 'var(--color-100)',
            borderRadius: '1rem',
            maxWidth: `min(${sizeMap[size]}, calc(100vw - 2rem))`,
            width: isSmallModal ? `min(${sizeMap[size]}, calc(100vw - 2rem))` : 'calc(100vw - 2rem)',
            minWidth: 'auto',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            animation: isSmallModal ? 'fadeIn 250ms ease-out' : 'slideDown 250ms ease-out',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            marginTop: 0
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          {showCloseButton && !persistent && (
            <button
              onClick={handleCloseClick}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '1rem',
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'background 150ms'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              }}
              aria-label="Sluiten"
            >
              <X size={16} />
            </button>
          )}


          {/* Header */}
          {(title || subtitle) && (
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: 'none',
                flexShrink: 0,
                background: 'var(--color-100)'
              }}
            >
              {title && (
                <h2
                  id="modal-title"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--color-700)',
                    margin: 0,
                    marginBottom: subtitle ? '0.25rem' : 0,
                    minHeight: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingRight: showCloseButton && !persistent ? '3rem' : 0,
                    textAlign: 'center'
                  }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  id="modal-subtitle"
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-600)',
                    margin: 0,
                    marginTop: '0.75rem',
                    lineHeight: 1.5,
                    textAlign: 'center'
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Body - Scrollable */}
          <div
            style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
              background: 'var(--color-100)'
            }}
          >
            {children}
          </div>

          {/* Footer - Actions */}
          {(primaryAction || secondaryAction) && (
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderTop: '1px solid var(--color-200)',
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '0.875rem',
                flexShrink: 0,
                background: 'var(--color-50)'
              }}
            >
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled || secondaryAction.loading}
                  className="btn btn--secondary"
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    borderRadius: 'var(--radius)',
                    transition: 'all 150ms ease-in-out'
                  }}
                >
                  {secondaryAction.loading ? "Laden..." : secondaryAction.label}
                </button>
              )}
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || primaryAction.loading}
                  className={`btn ${primaryAction.variant === "destructive" ? "btn--danger" : "btn--primary"}`}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    borderRadius: 'var(--radius)',
                    transition: 'all 150ms ease-in-out'
                  }}
                >
                  {primaryAction.loading ? "Laden..." : primaryAction.label}
                </button>
              )}
            </div>
          )}

          {/* Animations & Responsive Styles */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            
            @keyframes slideDown {
              from { 
                opacity: 0;
                transform: translateY(-100%); 
              }
              to { 
                opacity: 1;
                transform: translateY(0); 
              }
            }

            /* Desktop: Altijd gecentreerd met ronde hoeken */
            @media (min-width: 640px) {
              [role="dialog"] {
                align-items: center !important;
                padding: 2rem !important;
              }
              [role="dialog"] > div {
                border-radius: 1rem !important;
                margin-top: 0 !important;
                width: ${sizeMap[size]} !important;
                max-width: ${sizeMap[size]} !important;
                min-width: auto !important;
              }
              /* Desktop: Buttons naast elkaar */
              [role="dialog"] > div > div:last-of-type {
                flex-direction: row !important;
                gap: 1rem !important;
              }
              [role="dialog"] > div > div:last-of-type button {
                flex: 1 !important;
                min-width: 120px !important;
              }
            }

            /* Mobile: Kleine modals (xs, sm) centraal */
            @media (max-width: 639px) {
              [role="dialog"][data-modal-size="xs"],
              [role="dialog"][data-modal-size="sm"] {
                align-items: center !important;
                padding: 1rem !important;
              }
              [role="dialog"][data-modal-size="xs"] > div,
              [role="dialog"][data-modal-size="sm"] > div {
                border-radius: 1rem !important;
                width: calc(100vw - 2rem) !important;
                min-width: auto !important;
                max-width: calc(100vw - 2rem) !important;
              }
            }

            /* Mobile: Grote modals (md, lg) bovenaan */
            @media (max-width: 639px) {
              [role="dialog"][data-modal-size="md"],
              [role="dialog"][data-modal-size="lg"] {
                align-items: flex-start !important;
                padding: 1rem !important;
                padding-top: max(env(safe-area-inset-top, 1rem), 1rem) !important;
              }
              [role="dialog"][data-modal-size="md"] > div,
              [role="dialog"][data-modal-size="lg"] > div {
                width: calc(100vw - 2rem) !important;
                max-width: calc(100vw - 2rem) !important;
                min-width: auto !important;
                border-radius: 1rem !important;
              }
            }

            /* Button hover states voor desktop */
            @media (hover: hover) and (pointer: fine) {
              [role="dialog"] button.btn:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(96, 54, 140, 0.2);
              }
            }

            /* Button active state */
            [role="dialog"] button.btn:active:not(:disabled) {
              transform: translateY(0);
            }

            /* Disabled button styling */
            [role="dialog"] button.btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }

            @media (prefers-reduced-motion: reduce) {
              * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
          `}</style>
        </div>
      </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
  }
);

AppModal.displayName = "AppModal";

// Export oude sub-components voor backward compatibility (nu als dummy)
export const AppModalHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />
);
AppModalHeader.displayName = "AppModalHeader";

export const AppModalTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />
);
AppModalTitle.displayName = "AppModalTitle";

export const AppModalSubtitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  (props, ref) => <p ref={ref} {...props} />
);
AppModalSubtitle.displayName = "AppModalSubtitle";

export const AppModalBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />
);
AppModalBody.displayName = "AppModalBody";

export const AppModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />
);
AppModalFooter.displayName = "AppModalFooter";

