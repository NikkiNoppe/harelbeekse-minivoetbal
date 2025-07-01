
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import { toast } from "@shared/hooks/use-toast";
import { MatchFormData } from "./types";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@shared/components/ui/alert";

interface ScoreEntryFormProps {
  match: MatchFormData;
  onScoreSubmit: (homeScore: number, awayScore: number, refereeNotes: string) => void;
  isReferee?: boolean;
}

const ScoreEntryForm: React.FC<ScoreEntryFormProps> = ({ 
  match, 
  onScoreSubmit, 
  isReferee = false 
}) => {
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() || "");
  const [refereeNotes, setRefereeNotes] = useState(match.refereeNotes || "");

  const handleSubmit = () => {
    if (!homeScore || !awayScore) {
      toast({
        title: "Please enter both team scores",
        variant: "destructive",
      });
      return;
    }

    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      toast({
        title: "Please enter valid scores (0 or higher)",
        variant: "destructive",
      });
      return;
    }

    onScoreSubmit(homeScoreNum, awayScoreNum, refereeNotes);
  };

  if (match.isLocked && !isReferee) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This match has been locked by the referee and can no longer be edited.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="homeScore">{match.homeTeamName} Score</Label>
            <Input
              id="homeScore"
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={match.isLocked && !isReferee}
            />
          </div>
          <div>
            <Label htmlFor="awayScore">{match.awayTeamName} Score</Label>
            <Input
              id="awayScore"
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={match.isLocked && !isReferee}
            />
          </div>
        </div>

        {isReferee && (
          <div>
            <Label htmlFor="refereeNotes">Referee Notes</Label>
            <Textarea
              id="refereeNotes"
              value={refereeNotes}
              onChange={(e) => setRefereeNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes about the match..."
            />
          </div>
        )}

        <Button 
          onClick={handleSubmit}
          disabled={match.isLocked && !isReferee}
          className="w-full"
        >
          Submit Score
        </Button>
      </CardContent>
    </Card>
  );
};

export default ScoreEntryForm;
