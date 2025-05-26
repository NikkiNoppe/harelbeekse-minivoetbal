
import { MOCK_TEAM_PLAYERS } from "@/data/mockData";
import { PlayerSelection } from "../components/types";
import { MatchFormData } from "../types";
import { useMatchFormValidation } from "./useMatchFormValidation";

export const usePlayerSelectionHandler = (
  match: MatchFormData,
  homeTeamSelections: PlayerSelection[],
  setHomeTeamSelections: React.Dispatch<React.SetStateAction<PlayerSelection[]>>,
  awayTeamSelections: PlayerSelection[],
  setAwayTeamSelections: React.Dispatch<React.SetStateAction<PlayerSelection[]>>
) => {
  const { validatePlayerSelection } = useMatchFormValidation();

  const handlePlayerSelection = (
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
        const allPlayers = isHomeTeam ? 
          (MOCK_TEAM_PLAYERS[match.homeTeamId as keyof typeof MOCK_TEAM_PLAYERS] || []) :
          (MOCK_TEAM_PLAYERS[match.awayTeamId as keyof typeof MOCK_TEAM_PLAYERS] || []);
        const selectedPlayer = allPlayers.find((p: any) => p.player_id === value);
        if (selectedPlayer) {
          updated[index].playerName = selectedPlayer.player_name;
        }
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
