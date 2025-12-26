import React from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import MatchesCompactForm from "@/components/pages/admin/matches/MatchesCompactForm";
import { MatchFormData } from "@/components/pages/admin/matches/types";

interface MatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchFormData;
  isAdmin: boolean;
  isReferee: boolean;
  teamId: number;
  onComplete?: () => void;
}

export const MatchesFormModal: React.FC<MatchFormDialogProps> = ({
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
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Wedstrijdformulier"
      subtitle={`${match.homeTeamName} vs ${match.awayTeamName}`}
      size="lg"
      aria-describedby="match-form-description"
      showCloseButton={true}
    >
      <div id="match-form-description" className="sr-only">
        Vul scores, spelers en details van de wedstrijd in
      </div>
      <div className="space-y-6">
        <MatchesCompactForm match={match} onComplete={handleComplete} isAdmin={isAdmin} isReferee={isReferee} teamId={teamId} />
      </div>
    </AppModal>
  );
};

