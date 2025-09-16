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
      <DialogContent className="modal w-[98vw] max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {match.homeTeamName} vs {match.awayTeamName}
          </DialogTitle>
          <DialogDescription>
            {match.date} - {match.time} | {match.location}
          </DialogDescription>
        </DialogHeader>
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
