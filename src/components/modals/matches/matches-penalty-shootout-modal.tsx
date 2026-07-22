import React, { useState } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

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

  const resetForm = () => {
    setHomePenalties("");
    setAwayPenalties("");
    setPenaltyNotes("");
    setError("");
  };

  const handleSubmit = () => {
    const homeScore = parseInt(homePenalties);
    const awayScore = parseInt(awayPenalties);

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
    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Penalty shootout"
      size="lg"
      primaryAction={{
        label: "Winnaar bepalen",
        onClick: handleSubmit,
        variant: "primary",
      }}
      secondaryAction={{
        label: "Annuleren",
        onClick: handleCancel,
        variant: "secondary",
      }}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          De wedstrijd staat gelijk na reguliere speeltijd. In bekercompetitie moet er een winnaar zijn — bepaal deze via penalty&apos;s.
        </p>

        <Card className="border-primary/20 shadow-lg card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-brand-dark">
              <Target className="h-5 w-5 text-primary" />
              Penalty scores
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Vul het aantal gescoorde penalty&apos;s in voor elk team
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="home-penalties" className="text-sm font-semibold text-brand-dark">
                  {homeTeamName}
                </Label>
                <Input
                  id="home-penalties"
                  type="number"
                  min="0"
                  value={homePenalties}
                  onChange={(e) => setHomePenalties(e.target.value)}
                  placeholder="0"
                  className="text-center text-2xl min-h-[44px] h-14 font-bold border-primary/20 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="away-penalties" className="text-sm font-semibold text-brand-dark">
                  {awayTeamName}
                </Label>
                <Input
                  id="away-penalties"
                  type="number"
                  min="0"
                  value={awayPenalties}
                  onChange={(e) => setAwayPenalties(e.target.value)}
                  placeholder="0"
                  className="text-center text-2xl min-h-[44px] h-14 font-bold border-primary/20 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="penalty-notes" className="text-sm font-semibold text-brand-dark">
                Extra notities (optioneel)
              </Label>
              <Textarea
                id="penalty-notes"
                value={penaltyNotes}
                onChange={(e) => setPenaltyNotes(e.target.value)}
                placeholder="Bijv: Gemiste penalty's, bijzonderheden..."
                rows={4}
                className="border-primary/20 focus-visible:ring-primary resize-none"
              />
            </div>

            {error && (
              <div
                className="text-destructive text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20 font-medium"
                role="alert"
              >
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppModal>
  );
};
