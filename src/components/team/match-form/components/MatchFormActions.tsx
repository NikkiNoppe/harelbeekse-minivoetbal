
import React from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface MatchFormActionsProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  canEdit: boolean;
  isReferee: boolean;
  isTeamManager: boolean;
}

export const MatchFormActions: React.FC<MatchFormActionsProps> = ({
  onSubmit,
  isSubmitting,
  canEdit,
  isReferee,
  isTeamManager
}) => {
  return (
    <div className="flex justify-center">
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || !canEdit}
        className="flex items-center gap-2 px-8"
      >
        <Save className="h-4 w-4" />
        {isReferee ? "Bevestigen & Vergrendelen" : 
         isTeamManager ? "Spelers opslaan" : "Opslaan"}
      </Button>
    </div>
  );
};
