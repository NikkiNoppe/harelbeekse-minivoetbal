import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

interface PlayerSelectionActionsProps {
  onSavePlayerSelection: () => void;
  isSubmittingPlayers: boolean;
  canEdit: boolean;
  isTeamManager: boolean;
}

const PlayerSelectionActions: React.FC<PlayerSelectionActionsProps> = ({
  onSavePlayerSelection,
  isSubmittingPlayers,
  canEdit,
  isTeamManager
}) => {
  if (!isTeamManager || !canEdit) return null;

  return (
    <div className="flex justify-center mt-4">
      <Button
        onClick={onSavePlayerSelection}
        disabled={isSubmittingPlayers}
        className="btn btn--primary flex items-center gap-2 px-6"
      >
        {isSubmittingPlayers ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Spelers opslaan...</span>
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            <span>Spelers opslaan</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default React.memo(PlayerSelectionActions);