
import { useToast } from "@/hooks/use-toast";
import { PlayerSelection } from "../components/types";

export const useMatchFormValidation = () => {
  const { toast } = useToast();

  const validateTeamManagerSubmission = (
    userSelections: PlayerSelection[]
  ): boolean => {
    const selectedCount = userSelections.filter(p => p.playerId !== null).length;
    
    if (selectedCount === 0) {
      toast({
        title: "Geen spelers geselecteerd",
        description: "Selecteer ten minste één speler voor het formulier.",
        variant: "destructive"
      });
      return false;
    }
    
    if (selectedCount > 8) {
      toast({
        title: "Te veel spelers",
        description: "Er kunnen maximaal 8 spelers geselecteerd worden.",
        variant: "destructive"
      });
      return false;
    }

    const invalidPlayers = userSelections.filter(p => 
      p.playerId !== null && (!p.jerseyNumber || p.jerseyNumber.trim() === "")
    );
    
    if (invalidPlayers.length > 0) {
      toast({
        title: "Rugnummers ontbreken",
        description: "Alle geselecteerde spelers moeten een rugnummer hebben.",
        variant: "destructive"
      });
      return false;
    }

    const hasCaptain = userSelections.some(p => p.playerId !== null && p.isCaptain);
    if (selectedCount > 0 && !hasCaptain) {
      toast({
        title: "Kapitein ontbreekt",
        description: "Selecteer een kapitein voor je team.",
        variant: "destructive"
      });
      return false;
    }
    
    // Additional validation for duplicate jersey numbers
    const jerseyNumbers = userSelections
      .filter(p => p.playerId !== null && p.jerseyNumber.trim() !== "")
      .map(p => p.jerseyNumber);
    const uniqueJerseyNumbers = new Set(jerseyNumbers);
    
    if (jerseyNumbers.length !== uniqueJerseyNumbers.size) {
      toast({
        title: "Dubbele rugnummers",
        description: "Elk rugnummer kan maar één keer gebruikt worden.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateMatchData = (homeScore: string, awayScore: string): boolean => {
    if (!homeScore || !awayScore) {
      toast({
        title: "Fout",
        description: "Vul beide scores in",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validatePlayerSelection = (
    currentSelections: PlayerSelection[],
    index: number,
    field: keyof PlayerSelection,
    value: any
  ): boolean => {
    // Check for duplicate player selection
    if (field === 'playerId' && value !== null) {
      const isPlayerAlreadySelected = currentSelections.some((selection, i) => 
        i !== index && selection.playerId === value
      );
      
      if (isPlayerAlreadySelected) {
        toast({
          title: "Speler al geselecteerd",
          description: "Deze speler is al geselecteerd voor dit team.",
          variant: "destructive"
        });
        return false;
      }
    }
    
    // Check for duplicate jersey number
    if (field === 'jerseyNumber' && value.trim() !== "") {
      const isJerseyAlreadyUsed = currentSelections.some((selection, i) => 
        i !== index && selection.jerseyNumber === value && selection.playerId !== null
      );
      
      if (isJerseyAlreadyUsed) {
        toast({
          title: "Rugnummer al in gebruik",
          description: "Dit rugnummer wordt al gebruikt door een andere speler in dit team.",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  return {
    validateTeamManagerSubmission,
    validateMatchData,
    validatePlayerSelection
  };
};
