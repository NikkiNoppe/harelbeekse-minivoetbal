import { useState } from "react";
import { PlayerSelection } from "../components/types";
import { TeamPlayer } from "../components/useTeamPlayers";
import { toast } from "@shared/hooks/use-toast";
import { playerService } from "@shared/services/playerService";

export const usePlayerSelectionHandler = () => {
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerSelection[]>([]);

  const handlePlayerSelect = (player: TeamPlayer): void => {
    const newPlayer: PlayerSelection = {
      playerId: player.player_id,
      playerName: `${player.first_name} ${player.last_name}`,
      jerseyNumber: "",
      isCaptain: false,
      yellowCards: 0,
      redCards: 0,
    };
    setSelectedPlayers([...selectedPlayers, newPlayer]);
  };

  const handlePlayerRemove = (playerId: number): void => {
    setSelectedPlayers(selectedPlayers.filter((player) => player.playerId !== playerId));
  };

  const handleJerseyNumberChange = (playerId: number, jerseyNumber: string): void => {
    setSelectedPlayers(
      selectedPlayers.map((player) =>
        player.playerId === playerId ? { ...player, jerseyNumber } : player
      )
    );
  };

  const handleCaptainSelect = (playerId: number): void => {
    setSelectedPlayers(
      selectedPlayers.map((player) => ({
        ...player,
        isCaptain: player.playerId === playerId,
      }))
    );
  };

  return {
    selectedPlayers,
    handlePlayerSelect,
    handlePlayerRemove,
    handleJerseyNumberChange,
    handleCaptainSelect,
  };
};
