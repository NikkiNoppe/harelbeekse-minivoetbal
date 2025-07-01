
import React from "react";
import { Button } from "@shared/components/ui/button";
import { Save } from "lucide-react";

interface PlayerSelectionActionsProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  hasSelectedPlayers: boolean;
}

const PlayerSelectionActions: React.FC<PlayerSelectionActionsProps> = ({
  onSubmit,
  isSubmitting,
  hasSelectedPlayers
}) => {
  return (
    <div className="flex justify-center pt-6 border-t">
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || !hasSelectedPlayers}
        className="flex items-center gap-2 px-8"
        size="lg"
      >
        <Save className="h-4 w-4" />
        {isSubmitting ? "Opslaan..." : "Selectie Opslaan"}
      </Button>
    </div>
  );
};

export default PlayerSelectionActions;
