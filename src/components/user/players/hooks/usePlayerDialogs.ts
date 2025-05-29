
import { useState } from "react";
import { Player } from "../types";

export const usePlayerDialogs = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleEditPlayer = (playerId: number, players: Player[], setEditingPlayer: (player: any) => void) => {
    const player = players.find(p => p.player_id === playerId);
    if (player) {
      setEditingPlayer({
        player_id: player.player_id,
        firstName: player.first_name,
        lastName: player.last_name,
        birthDate: player.birth_date
      });
      setEditDialogOpen(true);
    }
  };

  return {
    dialogOpen,
    setDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    editMode,
    setEditMode,
    handleEditPlayer
  };
};
