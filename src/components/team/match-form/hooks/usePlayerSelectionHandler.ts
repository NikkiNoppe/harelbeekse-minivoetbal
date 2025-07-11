
import { PlayerSelection } from "../components/types";
import { MatchFormData } from "../types";
import { useMatchFormValidation } from "./useMatchFormValidation";
import { playerService } from "@/services/core";

export const usePlayerSelectionHandler = (
  match: MatchFormData,
  homeTeamSelections: PlayerSelection[],
  setHomeTeamSelections: React.Dispatch<React.SetStateAction<PlayerSelection[]>>,
  awayTeamSelections: PlayerSelection[],
  setAwayTeamSelections: React.Dispatch<React.SetStateAction<PlayerSelection[]>>
) => {
  const { validatePlayerSelection } = useMatchFormValidation();

  const handlePlayerSelection = async (
    index: number, 
    field: keyof PlayerSelection, 
    value: any, 
    isHomeTeam: boolean
  ) => {
    const setSelections = isHomeTeam ? setHomeTeamSelections : setAwayTeamSelections;
    const currentSelections = isHomeTeam ? homeTeamSelections : awayTeamSelections;
    
    // Validate the selection
    if (!validatePlayerSelection(currentSelections, index, field, value)) {
      return;
    }

    setSelections(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If setting captain to true, unset all other captains in this team
      if (field === 'isCaptain' && value === true) {
        updated.forEach((selection, i) => {
          if (i !== index) {
            updated[i].isCaptain = false;
          }
        });
      }
      
      // If selecting a player, auto-fill the name
      if (field === 'playerId' && value) {
        const teamId = isHomeTeam ? match.homeTeamId : match.awayTeamId;
        playerService.getPlayersByTeam(teamId).then(players => {
          const selectedPlayer = players.find(p => p.player_id === value);
          if (selectedPlayer) {
            setSelections(current => {
              const newSelections = [...current];
              newSelections[index].playerName = `${selectedPlayer.first_name} ${selectedPlayer.last_name}`;
              return newSelections;
            });
          }
        });
      }
      
      // If deselecting a player, clear related fields
      if (field === 'playerId' && value === null) {
        updated[index].playerName = "";
        updated[index].jerseyNumber = "";
        updated[index].isCaptain = false;
      }
      
      return updated;
    });
  };

  const handleCardChange = (playerId: number, cardType: string) => {
    // This will be handled by the parent component
  };

  return {
    handlePlayerSelection,
    handleCardChange
  };
};
