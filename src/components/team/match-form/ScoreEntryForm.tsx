
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MatchFormData } from "./types";
import { enhancedMatchService } from "@/services/enhancedMatchService";
import { refereeService, type Referee } from "@/services/refereeService";
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
  const [referees, setReferees] = useState<Referee[]>([]);
  const [loadingReferees, setLoadingReferees] = useState(true);

  // Load referees from database
  useEffect(() => {
    const loadReferees = async () => {
      try {
        setLoadingReferees(true);
        const refereesData = await refereeService.getReferees();
        setReferees(refereesData);
      } catch (error) {
        console.error('Error loading referees:', error);
      } finally {
        setLoadingReferees(false);
      }
    };

    loadReferees();
  }, []);

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
      const result = await enhancedMatchService.updateMatch(match.matchId, {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        referee,
        refereeNotes,
        isCompleted: true
      });

      if (result.success) {
        toast({
          title: isAdmin ? "Admin: Scores opgeslagen" : "Scores opgeslagen",
          description: "De wedstrijdscores zijn succesvol opgeslagen."
        });
        onComplete();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Fout",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het opslaan.",
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
      const updateResult = await enhancedMatchService.updateMatch(match.matchId, {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        referee,
        refereeNotes,
        isCompleted: true
      });

      if (!updateResult.success) {
        throw new Error(updateResult.message);
      }

      // Then lock the match
      const lockResult = await enhancedMatchService.lockMatch(match.matchId);
      
      if (!lockResult.success) {
        throw new Error(lockResult.message);
      }
      
      toast({
        title: isAdmin ? "Admin: Formulier vergrendeld" : "Formulier vergrendeld",
        description: "Het wedstrijdformulier is definitief afgesloten en kan niet meer worden gewijzigd."
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Fout",
        description: error instanceof Error ? error.message : "Er is een fout opgetreden bij het vergrendelen.",
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
        <Select
          value={referee}
          onValueChange={setReferee}
          disabled={match.isLocked && !isAdmin}
        >
          <SelectTrigger id="referee" className="dropdown-login-style">
            <SelectValue placeholder="Selecteer scheidsrechter" />
          </SelectTrigger>
          <SelectContent className="dropdown-content-login-style">
            {loadingReferees ? (
              <SelectItem value="loading" disabled className="dropdown-item-login-style">
                Laden...
              </SelectItem>
            ) : referees.length === 0 ? (
              <SelectItem value="no-referees" disabled className="dropdown-item-login-style">
                Geen scheidsrechters beschikbaar
              </SelectItem>
            ) : (
              <>
                <SelectItem value="" className="dropdown-item-login-style">
                  Geen scheidsrechter
                </SelectItem>
                {referees.map((referee) => (
                  <SelectItem
                    key={referee.user_id}
                    value={referee.username}
                    className="dropdown-item-login-style"
                  >
                    {referee.username}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
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
          className="bg-white text-purple-dark border-purple-dark hover:bg-purple-dark hover:text-white"
        >
          Annuleren
        </Button>
        
        {(!match.isLocked || isAdmin) && (
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-white text-purple-dark border-purple-dark hover:bg-purple-dark hover:text-white"
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
