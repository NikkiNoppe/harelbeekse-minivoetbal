
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MatchFormData } from "./types";
import { updateMatchForm, lockMatchForm } from "./matchFormService";
import { AlertTriangle, Lock, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScoreEntryFormProps {
  match: MatchFormData;
  onComplete: () => void;
  isAdmin: boolean;
  isReferee: boolean;
}

const ScoreEntryForm: React.FC<ScoreEntryFormProps> = ({
  match,
  onComplete,
  isAdmin,
  isReferee
}) => {
  const { toast } = useToast();
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() || "");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() || "");
  const [referee, setReferee] = useState(match.referee || "");
  const [refereeNotes, setRefereeNotes] = useState(match.refereeNotes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!homeScore || !awayScore) {
      toast({
        title: "Fout",
        description: "Vul beide scores in",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedMatch: MatchFormData = {
        ...match,
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        referee,
        refereeNotes,
        isCompleted: true
      };

      await updateMatchForm(updatedMatch);
      
      toast({
        title: isAdmin ? "Admin: Scores opgeslagen" : "Scores opgeslagen",
        description: "De wedstrijdscores zijn succesvol opgeslagen."
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLock = async () => {
    if (!homeScore || !awayScore) {
      toast({
        title: "Fout", 
        description: "Vul eerst beide scores in voordat je het formulier vergrendelt",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First save the data
      const updatedMatch: MatchFormData = {
        ...match,
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        referee,
        refereeNotes,
        isCompleted: true,
        isLocked: true
      };

      await updateMatchForm(updatedMatch);
      await lockMatchForm(match.matchId);
      
      toast({
        title: isAdmin ? "Admin: Formulier vergrendeld" : "Formulier vergrendeld",
        description: "Het wedstrijdformulier is definitief afgesloten en kan niet meer worden gewijzigd."
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het vergrendelen.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Score invoeren</h3>
        <p className="text-sm text-muted-foreground">
          {match.homeTeamName} vs {match.awayTeamName}
        </p>
        {isAdmin && (
          <p className="text-sm text-blue-600 font-medium">
            Admin modus: Je kunt altijd wijzigingen maken
          </p>
        )}
      </div>

      {match.isLocked && !isAdmin && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Deze wedstrijd is vergrendeld. Alleen een admin kan nog wijzigingen maken.
          </AlertDescription>
        </Alert>
      )}

      {match.isLocked && isAdmin && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Deze wedstrijd is vergrendeld, maar als admin kun je nog wijzigingen maken.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="homeScore">{match.homeTeamName}</Label>
          <Input
            id="homeScore"
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            disabled={match.isLocked && !isAdmin}
            className="text-center text-lg font-bold"
          />
        </div>
        
        <div className="flex justify-center items-center">
          <span className="text-2xl font-bold">-</span>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="awayScore">{match.awayTeamName}</Label>
          <Input
            id="awayScore"
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            disabled={match.isLocked && !isAdmin}
            className="text-center text-lg font-bold"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="referee">Scheidsrechter</Label>
        <Input
          id="referee"
          value={referee}
          onChange={(e) => setReferee(e.target.value)}
          disabled={match.isLocked && !isAdmin}
          placeholder="Naam scheidsrechter"
        />
      </div>

      {(isReferee || isAdmin) && (
        <div className="space-y-2">
          <Label htmlFor="refereeNotes">
            Notities scheidsrechter 
            <span className="text-sm text-muted-foreground ml-1">
              (alleen zichtbaar voor scheidsrechters en admins)
            </span>
          </Label>
          <Textarea
            id="refereeNotes"
            value={refereeNotes}
            onChange={(e) => setRefereeNotes(e.target.value)}
            disabled={match.isLocked && !isAdmin}
            placeholder="Bijzonderheden, kaarten, opmerkingen..."
            rows={4}
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onComplete}
        >
          Annuleren
        </Button>
        
        {(!match.isLocked || isAdmin) && (
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isAdmin ? "Admin: Opslaan" : "Opslaan"}
          </Button>
        )}
        
        {(isReferee || isAdmin) && (!match.isLocked || isAdmin) && (
          <Button
            onClick={handleLock}
            disabled={isSubmitting}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            {isAdmin ? "Admin: Bevestigen & Vergrendelen" : "Bevestigen & Vergrendelen"}
          </Button>
        )}
      </div>

      {(isReferee || isAdmin) && !match.isLocked && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Let op: Na bevestiging kan het formulier niet meer worden gewijzigd{isAdmin ? ", behalve door een admin" : ""}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ScoreEntryForm;
