
import React, { useMemo, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

interface MatchesFormActionsProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  canActuallyEdit: boolean;
  isAdmin: boolean;
}

const MatchesFormActions = forwardRef<HTMLButtonElement, MatchesFormActionsProps>(({
  onSubmit,
  isSubmitting,
  canActuallyEdit,
  isAdmin,
}, ref) => {
  // Memoize the submit button text to prevent unnecessary re-renders
  const submitButtonText = useMemo(() => {
    if (isSubmitting) return "Bezig...";
    return "Opslaan";
  }, [isSubmitting]);

  // Memoize the submit button disabled state
  const isSubmitDisabled = useMemo(() => {
    return isSubmitting || (!canActuallyEdit && !isAdmin);
  }, [isSubmitting, canActuallyEdit, isAdmin]);

  return (
    <div 
      className="sticky bottom-0 left-0 right-0 z-10 bg-[var(--color-100)] border-t border-[var(--color-300)] shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
      style={{
        marginLeft: '0px',
        marginRight: '0px',
        marginTop: '0px',
        marginBottom: '0px',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        paddingTop: '11px',
        paddingBottom: '0px',
        borderTopWidth: '1px',
        width: '100%',
        height: '98px',
      }}
    >
      <Button
        ref={ref}
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className="btn btn--primary flex items-center justify-center gap-2 w-full"
        style={{ 
          minHeight: '52px', 
          fontSize: '1rem', 
          fontWeight: '600', 
          borderRadius: 'var(--radius)', 
          transition: 'all 150ms ease-in-out' 
        }}
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Save className="h-5 w-5" />
        )}
        {submitButtonText}
      </Button>
    </div>
  );
});

MatchesFormActions.displayName = "MatchesFormActions";

export default React.memo(MatchesFormActions);
