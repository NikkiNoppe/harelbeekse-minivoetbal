import React, { useCallback, useMemo } from "react";
import { usePlayersData } from "@/components/user/players/hooks/usePlayersData";
import { usePlayerOperations } from "@/components/user/players/hooks/usePlayerOperations";
import { usePlayerDialogs } from "@/components/user/players/hooks/usePlayerDialogs";
import { formatDate, getFullName, handleTeamChange } from "@/components/user/players/utils/playerUtils";
import { useAuth } from "@/hooks/useAuth";

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
  } = usePlayersData(authUser);

  const {
    dialogOpen,
    setDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    editMode,
    setEditMode,
    handleEditPlayer: handleEditPlayerDialog
  } = usePlayerDialogs();

  const {
    newPlayer,
    setNewPlayer,
    editingPlayer,
    setEditingPlayer,
    handleAddPlayer,
    handleSaveEditedPlayer,
    handleRemovePlayer
  } = usePlayerOperations(selectedTeam, refreshPlayers, setEditDialogOpen);

  // Memoized handlers to prevent unnecessary re-renders
  const handleTeamChangeWrapper = useCallback((teamId: number) => {
    console.log('🔄 Team change requested:', teamId);
    handleTeamChange(teamId, setSelectedTeam, setEditMode);
  }, [setSelectedTeam, setEditMode]);

  const handleEditPlayer = useCallback((playerId: number) => {
    handleEditPlayerDialog(playerId, players, setEditingPlayer);
  }, [handleEditPlayerDialog, players, setEditingPlayer]);

  // Memoized add player handler with dialog management
  const handleAddPlayerAndMaybeCloseDialog = useCallback(async (): Promise<boolean> => {
    const success = await handleAddPlayer();
    if (success) {
      setDialogOpen(false);
      setEditDialogOpen(false);
      setNewPlayer({ firstName: "", lastName: "", birthDate: "" });
      return true;
    }
    return false;
  }, [handleAddPlayer, setDialogOpen, setEditDialogOpen, setNewPlayer]);

  // Memoized utility functions
  const memoizedFormatDate = useCallback(formatDate, []);
  const memoizedGetFullName = useCallback(getFullName, []);

  // Memoized state setters to prevent unnecessary re-renders
  const memoizedSetDialogOpen = useCallback(setDialogOpen, [setDialogOpen]);
  const memoizedSetEditDialogOpen = useCallback(setEditDialogOpen, [setEditDialogOpen]);
  const memoizedSetNewPlayer = useCallback(setNewPlayer, [setNewPlayer]);
  const memoizedSetEditingPlayer = useCallback(setEditingPlayer, [setEditingPlayer]);

  // No extra mount refresh; initial load happens once in usePlayersData.initializeData

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
    setDialogOpen: memoizedSetDialogOpen,
    setEditDialogOpen: memoizedSetEditDialogOpen,
    setNewPlayer: memoizedSetNewPlayer,
    setEditingPlayer: memoizedSetEditingPlayer,
    handleAddPlayer: handleAddPlayerAndMaybeCloseDialog,
    handleEditPlayer,
    handleSaveEditedPlayer,
    handleRemovePlayer,
    formatDate: memoizedFormatDate,
    getFullName: memoizedGetFullName,
    userTeamName
  };
};
