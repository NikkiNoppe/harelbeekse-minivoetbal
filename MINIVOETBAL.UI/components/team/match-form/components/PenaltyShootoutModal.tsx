import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../MINIVOETBAL.UI/components/ui/dialog";
import { Button } from "../../../MINIVOETBAL.UI/components/ui/button";
import { Input } from "../../../MINIVOETBAL.UI/components/ui/input";
import { Label } from "../../../MINIVOETBAL.UI/components/ui/label";
import { Textarea } from "../../../MINIVOETBAL.UI/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../../MINIVOETBAL.UI/components/ui/card";
import { Trophy, Target } from "lucide-react";

interface PenaltyShootoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeamName: string;
  awayTeamName: string;
  onPenaltyResult: (winner: 'home' | 'away', homePenalties: number, awayPenalties: number, notes: string) => void;
}

const PenaltyShootoutModal: React.FC<PenaltyShootoutModalProps> = ({
  open,
  onOpenChange,
  homeTeamName,
  awayTeamName,
  onPenaltyResult
}) => {
  const [homePenalties, setHomePenalties] = useState<string>("");
  const [awayPenalties, setAwayPenalties] = useState<string>("");
  const [penaltyNotes, setPenaltyNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = () => {
    const homeScore = parseInt(homePenalties);
    const awayScore = parseInt(awayPenalties);

    // Validatie
    if (isNaN(homeScore) || isNaN(awayScore)) {
      setError("Vul geldige penalty scores in voor beide teams");
      return;
    }

    if (homeScore < 0 || awayScore < 0) {
      setError("Penalty scores kunnen niet negatief zijn");
      return;
    }

    if (homeScore === awayScore) {
      setError("Penalty's moeten een winnaar opleveren - geen gelijkspel mogelijk");
      return;
    }

    const winner = homeScore > awayScore ? 'home' : 'away';
    const winnerName = winner === 'home' ? homeTeamName : awayTeamName;
    const notes = `🥅 PENALTY SHOOTOUT RESULTAAT:
${homeTeamName} ${homeScore} - ${awayScore} ${awayTeamName}
🏆 Winnaar: ${winnerName}${penaltyNotes ? `\n\nExtra notities:\n${penaltyNotes}` : ''}`;
    
    onPenaltyResult(winner, homeScore, awayScore, notes);
    
    // Reset form
    setHomePenalties("");
    setAwayPenalties("");
    setPenaltyNotes("");
    setError("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setHomePenalties("");
    setAwayPenalties("");
    setPenaltyNotes("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md mx-4 bg-background text-foreground border-border rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5" />
            Penalty Shootout
          </DialogTitle>
          <DialogDescription>
            De wedstrijd staat gelijk na reguliere speeltijd. In bekercompetitie moet er een winnaar zijn - bepaal deze via penalty's.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-4 w-4" />
                Penalty Scores
              </CardTitle>
              <p className="text-sm text-gray-600">Vul het aantal gescoorde penalty's in voor elk team</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="home-penalties" className="text-sm font-medium">
                    {homeTeamName}
                  </Label>
                  <Input
                    id="home-penalties"
                    type="number"
                    min="0"
                    value={homePenalties}
                    onChange={(e) => setHomePenalties(e.target.value)}
                    placeholder="0"
                    className="text-center text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="away-penalties" className="text-sm font-medium">
                    {awayTeamName}
                  </Label>
                  <Input
                    id="away-penalties"
                    type="number"
                    min="0"
                    value={awayPenalties}
                    onChange={(e) => setAwayPenalties(e.target.value)}
                    placeholder="0"
                    className="text-center text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="penalty-notes" className="text-sm font-medium">
                  Extra notities (optioneel)
                </Label>
                <Textarea
                  id="penalty-notes"
                  value={penaltyNotes}
                  onChange={(e) => setPenaltyNotes(e.target.value)}
                  placeholder="Bijv: Gemiste penalty's, bijzonderheden..."
                  rows={3}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button 
              onClick={handleCancel} 
              variant="outline" 
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Winnaar Bepalen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PenaltyShootoutModal; 