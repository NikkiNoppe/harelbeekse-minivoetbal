import React, { useState } from "react";
import { Lock, Save } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import { toast } from "@shared/hooks/use-toast";
import { MatchFormData } from "./types";
import { 
  enhancedMatchService,
} from "@shared/services/enhancedMatchService";
import { Alert, AlertDescription } from "@shared/components/ui/alert";

interface ScoreEntryFormProps {
  match: MatchFormData;
  isSubmitting: boolean;
  canEdit: boolean;
  onSubmit: () => void;
  onScoreChange: (homeScore: number | null, awayScore: number | null) => void;
  onRefereeNotesChange: (notes: string) => void;
  isLocked: boolean;
  isAdmin: boolean;
}

export const ScoreEntryForm: React.FC<ScoreEntryFormProps> = ({
  match,
  isSubmitting,
  canEdit,
  onSubmit,
  onScoreChange,
  onRefereeNotesChange,
  isLocked,
  isAdmin
}) => {
  const [homeScore, setHomeScore] = useState<number | null>(match.homeScore !== undefined ? match.homeScore : null);
  const [awayScore, setAwayScore] = useState<number | null>(match.awayScore !== undefined ? match.awayScore : null);
  const [refereeNotes, setRefereeNotes] = useState(match.refereeNotes || "");
  const [showScoreAlert, setShowScoreAlert] = useState(false);

  const handleHomeScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
    setHomeScore(value);
    onScoreChange(value, awayScore);
  };

  const handleAwayScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
    setAwayScore(value);
    onScoreChange(homeScore, value);
  };

  const handleRefereeNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRefereeNotes(e.target.value);
    onRefereeNotesChange(e.target.value);
  };

  const toggleLock = async () => {
    if (!match.matchId) {
      toast({
        title: "Error",
        description: "Match ID is missing.",
        variant: "destructive",
      });
      return;
    }

    const serviceCall = isLocked ? enhancedMatchService.unlockMatch : enhancedMatchService.lockMatch;
    const result = await serviceCall(match.matchId);

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      onSubmit(); // Refresh the form
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="homeScore">Score Thuisteam</Label>
        <Input
          type="number"
          id="homeScore"
          value={homeScore === null ? '' : homeScore.toString()}
          onChange={handleHomeScoreChange}
          disabled={!canEdit}
          placeholder="Thuisteam score"
          className="w-24 text-center"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Label htmlFor="awayScore">Score Uitteam</Label>
        <Input
          type="number"
          id="awayScore"
          value={awayScore === null ? '' : awayScore.toString()}
          onChange={handleAwayScoreChange}
          disabled={!canEdit}
          placeholder="Uitteam score"
          className="w-24 text-center"
        />
      </div>
      <div>
        <Label htmlFor="refereeNotes">Notities scheidsrechter</Label>
        <Textarea
          id="refereeNotes"
          value={refereeNotes}
          onChange={handleRefereeNotesChange}
          disabled={!canEdit}
          placeholder="Bijzonderheden, opmerkingen..."
          rows={4}
        />
      </div>

      {showScoreAlert && (
        <Alert>
          <AlertDescription>
            Zeker de scores opslaan? Dit kan niet ongedaan gemaakt worden.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        {isAdmin && (
          <Button
            variant="outline"
            onClick={toggleLock}
            disabled={isSubmitting}
          >
            {isLocked ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Ontgrendel
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Vergrendel
              </>
            )}
          </Button>
        )}
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !canEdit}
          style={{
            background: "var(--main-color-dark)",
            color: "#fff",
            borderColor: "var(--main-color-dark)"
          }}
        >
          Opslaan
        </Button>
      </div>
    </div>
  );
};
