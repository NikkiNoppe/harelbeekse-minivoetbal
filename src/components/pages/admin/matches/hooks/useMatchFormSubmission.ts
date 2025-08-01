
import { useToast } from "@/hooks/use-toast";
import { updateMatchForm, lockMatchForm } from "../MatchesFormService";
import { MatchFormData } from "../types";
import { PlayerSelection } from "../components/types";
import { useMatchFormValidation } from "./useMatchFormValidation";

export const useMatchFormSubmission = (
  match: MatchFormData,
  teamId: number,
  onComplete: () => void
) => {
  const { toast } = useToast();
  const { validateTeamManagerSubmission, validateMatchData } = useMatchFormValidation();

  const handleSubmit = async (
    homeScore: string,
    awayScore: string,
    selectedReferee: string,
    refereeNotes: string,
    homeTeamSelections: PlayerSelection[],
    awayTeamSelections: PlayerSelection[],
    setIsSubmitting: (value: boolean) => void,
    isTeamManager: boolean,
    canEditMatchData: boolean,
    isReferee: boolean
  ) => {
    // Validation logic based on user role
    if (isTeamManager) {
      const userSelections = teamId === match.homeTeamId ? homeTeamSelections : awayTeamSelections;
      if (!validateTeamManagerSubmission(userSelections)) {
        return;
      }
    }

    if (canEditMatchData && !validateMatchData(homeScore, awayScore)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedMatch: MatchFormData = {
        ...match,
        homeScore: canEditMatchData ? parseInt(homeScore) : match.homeScore,
        awayScore: canEditMatchData ? parseInt(awayScore) : match.awayScore,
        referee: selectedReferee,
        refereeNotes,
        isCompleted: canEditMatchData ? true : match.isCompleted,
        homePlayers: homeTeamSelections,
        awayPlayers: awayTeamSelections
      };

      await updateMatchForm({
        ...updatedMatch,
        matchId: match.matchId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId
      });

      if (isReferee && !match.isLocked) {
        await lockMatchForm(match.matchId);
        updatedMatch.isLocked = true;
      }
      
      toast({
        title: isReferee ? "Formulier vergrendeld" : "Opgeslagen",
        description: isReferee 
          ? "Het wedstrijdformulier is definitief afgesloten."
          : isTeamManager 
            ? "De spelersselectie is opgeslagen."
            : "De wijzigingen zijn opgeslagen."
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

  return { handleSubmit };
};
