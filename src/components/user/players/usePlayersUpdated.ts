
import { usePlayersData } from "./hooks/usePlayersData";
import { usePlayerOperations } from "./hooks/usePlayerOperations";
import { usePlayerDialogs } from "./hooks/usePlayerDialogs";
import { formatDate, getFullName, handleTeamChange } from "./utils/playerUtils";
import { useAuth } from "@/components/auth/AuthProvider";

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
    handleAddPlayer,
    handleEditPlayer,
    handleSaveEditedPlayer,
    handleRemovePlayer,
    formatDate,
    getFullName,
    userTeamName
  };
};
