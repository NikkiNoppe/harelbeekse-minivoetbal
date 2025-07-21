
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../MINIVOETBAL.UI/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../../MINIVOETBAL.UI/components/ui/card";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { X } from "lucide-react";
import CompactMatchForm from "./CompactMatchForm";
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
      <DialogContent className="w-full max-w-5xl mx-4 bg-background text-foreground border-border rounded-lg p-0 max-h-[95vh] overflow-hidden">
        <DialogTitle className="sr-only">
          Wedstrijdformulier - {match.homeTeamName} vs {match.awayTeamName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Beheer de wedstrijdgegevens, spelers en scores voor deze wedstrijd
        </DialogDescription>
        <Card className="w-full shadow-lg border-0 rounded-lg overflow-hidden">
          <CardHeader className="bg-purple-100 py-4">
            <CardTitle className="text-xl sm:text-2xl text-center text-purple-light">
              Wedstrijdformulier - {match.homeTeamName} vs {match.awayTeamName}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-purple-100 p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
            <CompactMatchForm
              match={match}
              onComplete={handleComplete}
              isAdmin={isAdmin}
              isReferee={isReferee}
              teamId={teamId}
            />
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default MatchFormDialog;
