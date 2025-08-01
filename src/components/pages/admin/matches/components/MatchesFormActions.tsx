
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

interface MatchesFormActionsProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  canActuallyEdit: boolean;
  isAdmin: boolean;
}

const MatchesFormActions: React.FC<MatchesFormActionsProps> = ({
  onSubmit,
  isSubmitting,
  canActuallyEdit,
  isAdmin,
}) => {
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
    <div className="flex justify-end gap-4 mt-6">
      <Button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className="btn btn--primary flex items-center gap-2 px-8"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {submitButtonText}
      </Button>
    </div>
  );
};

export default React.memo(MatchesFormActions);
