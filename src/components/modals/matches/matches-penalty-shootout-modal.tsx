import React, { useState } from "react";
import { AppModal, AppModalHeader, AppModalTitle, AppModalFooter } from "@/components/modals/base/app-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, X } from "lucide-react";

interface PenaltyShootoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeTeamName: string;
  awayTeamName: string;
  onPenaltyResult: (winner: 'home' | 'away', homePenalties: number, awayPenalties: number, notes: string) => void;
}

export const MatchesPenaltyShootoutModal: React.FC<PenaltyShootoutModalProps> = ({
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
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      className="sm:max-w-2xl min-h-[500px]"
    >
      <AppModalHeader>
        <AppModalTitle className="text-2xl font-bold flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          Penalty Shootout
        </AppModalTitle>
        <p className="app-modal-subtitle text-muted-foreground text-base mt-2">
          De wedstrijd staat gelijk na reguliere speeltijd. In bekercompetitie moet er een winnaar zijn - bepaal deze via penalty's.
        </p>
      </AppModalHeader>

        <div className="space-y-8 px-2">
          <Card className="border-2 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3 text-foreground">
                <Target className="h-5 w-5 text-primary" />
                Penalty Scores
              </CardTitle>
              <p className="text-muted-foreground">Vul het aantal gescoorde penalty's in voor elk team</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="home-penalties" className="text-base font-semibold text-foreground">
                    {homeTeamName}
                  </Label>
                  <Input
                    id="home-penalties"
                    type="number"
                    min="0"
                    value={homePenalties}
                    onChange={(e) => setHomePenalties(e.target.value)}
                    placeholder="0"
                    className="text-center text-2xl h-14 font-bold border-2 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="away-penalties" className="text-base font-semibold text-foreground">
                    {awayTeamName}
                  </Label>
                  <Input
                    id="away-penalties"
                    type="number"
                    min="0"
                    value={awayPenalties}
                    onChange={(e) => setAwayPenalties(e.target.value)}
                    placeholder="0"
                    className="text-center text-2xl h-14 font-bold border-2 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="penalty-notes" className="text-base font-semibold text-foreground">
                  Extra notities (optioneel)
                </Label>
                <Textarea
                  id="penalty-notes"
                  value={penaltyNotes}
                  onChange={(e) => setPenaltyNotes(e.target.value)}
                  placeholder="Bijv: Gemiste penalty's, bijzonderheden..."
                  rows={4}
                  className="border-2 focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {error && (
                <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20 font-medium">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          <AppModalFooter>
            <button 
              onClick={handleCancel} 
              className="btn btn--secondary flex-1 h-12 text-base font-medium"
            >
              Annuleren
            </button>
            <button 
              onClick={handleSubmit} 
              className="btn btn--primary flex-1 h-12 text-base font-medium"
            >
              Winnaar Bepalen
            </button>
          </AppModalFooter>
        </div>
    </AppModal>
  );
};



