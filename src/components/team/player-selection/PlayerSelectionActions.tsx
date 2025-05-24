
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

interface PlayerSelectionActionsProps {
  submitting: boolean;
  onComplete: () => void;
}

const PlayerSelectionActions: React.FC<PlayerSelectionActionsProps> = ({
  submitting,
  onComplete
}) => {
  return (
    <div className="flex justify-between mt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onComplete}
      >
        Annuleren
      </Button>
      <Button 
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Opslaan...</span>
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            <span>Formulier opslaan</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default PlayerSelectionActions;
