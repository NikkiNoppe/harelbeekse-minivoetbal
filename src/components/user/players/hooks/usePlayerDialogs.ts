
import { useState } from "react";
import { Player, EditingPlayerData } from "../types";

export const usePlayerDialogs = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleEditPlayer = (
    playerId: number, 
    players: Player[], 
    setEditingPlayer: (player: EditingPlayerData | null) => void
  ) => {
    console.log('🎯 handleEditPlayer called for player ID:', playerId);
    
    const player = players.find(p => p.player_id === playerId);
    if (!player) {
      console.error('❌ Player not found with ID:', playerId);
      return;
    }

    console.log('📝 Found player data from database:', player);
    
    // Transform from database snake_case to UI camelCase
    const editingPlayerData: EditingPlayerData = {
      player_id: player.player_id,
      firstName: player.first_name,  // Transform snake_case to camelCase
      lastName: player.last_name,    // Transform snake_case to camelCase
      birthDate: player.birth_date   // Transform snake_case to camelCase
    };
    
    console.log('📝 Transformed player data for UI:', editingPlayerData);
    
    setEditingPlayer(editingPlayerData);
    setEditDialogOpen(true);
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
