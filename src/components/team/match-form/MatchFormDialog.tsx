import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <DialogContent className="w-full max-w-5xl mx-4 sm:mx-auto bg-background text-foreground border-border rounded-lg">
        <div className="rounded-b-lg">
          <Card className="w-full mx-auto shadow-lg border-purple-light">
            <CardHeader className="bg-purple-100">
              <CardTitle className="text-2xl text-center text-purple-light">
                Wedstrijdformulier - {match.homeTeamName} vs {match.awayTeamName}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-purple-100 max-h-[80vh] overflow-y-auto">
              <CompactMatchForm
                match={match}
                onComplete={handleComplete}
                isAdmin={isAdmin}
                isReferee={isReferee}
                teamId={teamId}
              />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchFormDialog; 