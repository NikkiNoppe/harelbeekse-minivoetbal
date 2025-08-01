
import { PlayerSelection, MatchFormData } from "../types";
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
    if (!validatePlayerSelection(currentSelections, index, field, value)) {
      return;
    }
    setSelections(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'isCaptain' && value === true) {
        updated.forEach((selection, i) => {
          if (i !== index) updated[i].isCaptain = false;
        });
      }
      if (field === 'playerId' && value) {
        (async () => {
          const teamId = isHomeTeam ? match.homeTeamId : match.awayTeamId;
          const players = await playerService.getPlayersByTeam(teamId);
          const selectedPlayer = players.find(p => p.player_id === value);
          if (selectedPlayer) {
            setSelections(current => {
              const newSelections = [...current];
              newSelections[index].playerName = `${selectedPlayer.first_name} ${selectedPlayer.last_name}`;
              return newSelections;
            });
          }
        })();
      }
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
