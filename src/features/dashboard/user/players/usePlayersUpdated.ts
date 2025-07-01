
import React from "react";
import { usePlayersData } from "./hooks/usePlayersData";
import { usePlayerOperations } from "./hooks/usePlayerOperations";
import { usePlayerDialogs } from "./hooks/usePlayerDialogs";
import { formatDate, getFullName, handleTeamChange } from "./utils/playerUtils";
import { useAuth } from "@features/auth/AuthProvider";

export const usePlayersUpdated = () => {
  // Use main AuthProvider instead of separate auth
  const { user: authUser } = useAuth();
  
  const {
    players,
    teams,
    loading,
    selectedTeam,
    setSelectedTeam,
    refreshPlayers,
    userTeamName
  } = usePlayersData(authUser); // Pass authUser to usePlayersData

  const {
    newPlayer,
    setNewPlayer,
    editingPlayer,
    setEditingPlayer,
    handleAddPlayer,
    handleSaveEditedPlayer,
    handleRemovePlayer
  } = usePlayerOperations(selectedTeam, refreshPlayers);

  const {
    dialogOpen,
    setDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    editMode,
    setEditMode,
    handleEditPlayer: handleEditPlayerDialog
  } = usePlayerDialogs();

  const handleTeamChangeWrapper = (teamId: number) => {
    console.log('🔄 Team change requested:', teamId);
    handleTeamChange(teamId, setSelectedTeam, setEditMode);
  };

  const handleEditPlayer = (playerId: number) => {
    handleEditPlayerDialog(playerId, players, setEditingPlayer);
  };

  // Corrected: will return Promise<boolean> and only close dialog on success
  const handleAddPlayerAndMaybeCloseDialog = async (): Promise<boolean> => {
    const success = await handleAddPlayer();
    if (success) {
      setDialogOpen(false);
      setNewPlayer({ firstName: "", lastName: "", birthDate: "" });
      return true;
    }
    // If failure, keep dialog open and do not clear input
    return false;
  };

  return {
    players,
    teams,
    loading,
    editMode,
    selectedTeam,
    dialogOpen,
    editDialogOpen,
    newPlayer,
    editingPlayer,
    setEditMode,
    handleTeamChange: handleTeamChangeWrapper,
    setDialogOpen,
    setEditDialogOpen,
    setNewPlayer,
    setEditingPlayer,
    handleAddPlayer: handleAddPlayerAndMaybeCloseDialog, // returns Promise<boolean>
    handleEditPlayer,
    handleSaveEditedPlayer,
    handleRemovePlayer,
    formatDate,
    getFullName,
    userTeamName
  };
};
