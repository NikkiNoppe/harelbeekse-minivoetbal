import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import MatchesCompactForm from "./MatchesCompactForm";
import { MatchFormData } from "./types";

interface MatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchFormData;
  isAdmin: boolean;
  isReferee: boolean;
  teamId: number;
  onComplete?: () => void;
}

const MatchFormDialog: React.FC<MatchFormDialogProps> = ({
  open,
  onOpenChange,
  match,
  isAdmin,
  isReferee,
  teamId,
  onComplete
}) => {
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal w-[95vw] max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <MatchesCompactForm
            match={match}
            onComplete={handleComplete}
            isAdmin={isAdmin}
            isReferee={isReferee}
            teamId={teamId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchFormDialog;
