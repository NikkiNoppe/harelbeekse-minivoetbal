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

    const modalContent = (
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          animation: 'fadeIn 200ms ease-out'
        }}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={subtitle ? 'modal-subtitle' : undefined}
      >
        <div 
          ref={ref}
          style={{
            background: 'white',
            borderRadius: '1rem 1rem 0 0',
            maxWidth: sizeMap[size],
            width: '90%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 250ms ease-out',
            boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.2)',
            position: 'relative'
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

          {/* Drag Handle */}
          <div
            style={{
              width: '2.5rem',
              height: '4px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '2px',
              margin: '0.75rem auto 0.5rem',
              flexShrink: 0
            }}
            aria-hidden="true"
          />

          {/* Header */}
          {(title || subtitle) && (
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                flexShrink: 0
              }}
            >
              {title && (
                <h2
                  id="modal-title"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#4a2a6b',
                    margin: 0,
                    marginBottom: subtitle ? '0.25rem' : 0
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
                    color: '#666',
                    margin: 0
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
              minHeight: 0
            }}
          >
            {children}
          </div>

          {/* Footer - Actions */}
          {(primaryAction || secondaryAction) && (
            <div
              style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '0.75rem',
                flexShrink: 0
              }}
            >
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled || secondaryAction.loading}
                  className="btn btn--secondary w-full"
                  style={{
                    minHeight: '48px'
                  }}
                >
                  {secondaryAction.loading ? "Loading..." : secondaryAction.label}
                </button>
              )}
              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || primaryAction.loading}
                  className={`btn ${primaryAction.variant === "destructive" ? "btn--danger" : "btn--primary"} w-full`}
                  style={{
                    minHeight: '48px'
                  }}
                >
                  {primaryAction.loading ? "Loading..." : primaryAction.label}
                </button>
              )}
            </div>
          )}

          {/* Animations */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(100%); 
              }
              to { 
                opacity: 1;
                transform: translateY(0); 
              }
            }

            @media (prefers-reduced-motion: reduce) {
              * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
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

