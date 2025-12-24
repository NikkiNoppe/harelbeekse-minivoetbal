import React, { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import PlayersList from "./components/PlayersList";
import { PlayerModal } from "@/components/modals";
import PlayerRegulations from "./components/PlayerRegulations";
import { usePlayersUpdated } from "./hooks/usePlayersUpdated";
import { usePlayerListLock } from "./hooks/usePlayerListLock";
import { useAuth } from "@/hooks/useAuth";
import { formatDateShort } from "@/lib/dateUtils";

const PlayerPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const {
    players,
    teams,
    loading,
    selectedTeam,
    dialogOpen,
    editDialogOpen,
    newPlayer,
    editingPlayer,
    handleTeamChange,
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
  } = usePlayersUpdated();
  const { isLocked, lockDate, canEdit } = usePlayerListLock();
  
  // Memoized values to prevent unnecessary re-renders
  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser?.role]);
  const currentTeamName = useMemo(() => 
    isAdmin 
      ? teams.find(team => team.team_id === selectedTeam)?.team_name || ""
      : userTeamName
  , [isAdmin, teams, selectedTeam, userTeamName]);

  const hasTeams = useMemo(() => teams.length > 0, [teams.length]);
  const showLockMessage = useMemo(() => isLocked && !isAdmin, [isLocked, isAdmin]);
  const showAddButton = useMemo(() => canEdit, [canEdit]);
  const modalOpen = useMemo(() => dialogOpen || editDialogOpen, [dialogOpen, editDialogOpen]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleOpenAddDialog = useCallback(() => {
    setEditingPlayer(null);
    setEditDialogOpen(false);
    setNewPlayer({ firstName: "", lastName: "", birthDate: "" });
    setDialogOpen(true);
  }, [setEditingPlayer, setEditDialogOpen, setNewPlayer, setDialogOpen]);

  const handleModalClose = useCallback((open: boolean) => {
    if (!open) {
      setDialogOpen(false);
      setEditDialogOpen(false);
      setEditingPlayer(null);
      setNewPlayer({ firstName: "", lastName: "", birthDate: "" });
    }
  }, [setDialogOpen, setEditDialogOpen, setEditingPlayer, setNewPlayer]);

  const handleTeamSelectChange = useCallback((value: string) => {
    handleTeamChange(parseInt(value));
  }, [handleTeamChange]);

  // Memoized team options to prevent unnecessary re-renders
  const teamOptions = useMemo(() => 
    teams.map(team => (
      <SelectItem 
        key={team.team_id} 
        value={team.team_id.toString()} 
        className="dropdown-item-login-style"
      >
        {team.team_name}
      </SelectItem>
    ))
  , [teams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Spelerslijst
          </h1>
          {showLockMessage && (
            <p className="text-sm text-red-600 mt-1">
              Spelerslijst vergrendeld vanaf {formatDateShort(lockDate)}
            </p>
          )}
        </div>
      </div>

      {/* Team Selector and Add Button for Admin */}
      {isAdmin ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Select 
              value={selectedTeam?.toString() || ""} 
              onValueChange={handleTeamSelectChange}
            >
              <SelectTrigger className="dropdown-login-style min-w-[200px]">
                <SelectValue placeholder="Selecteer team" />
              </SelectTrigger>
              <SelectContent className="dropdown-content-login-style">
                {teamOptions}
              </SelectContent>
            </Select>
            {!hasTeams && (
              <span className="text-sm text-red-500 text-center">
                Geen teams gevonden
              </span>
            )}
          </div>
          {showAddButton && (
            <Button
              onClick={handleOpenAddDialog}
              className="btn btn--outline flex items-center justify-center gap-2 whitespace-nowrap min-h-[44px] px-4"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Speler toevoegen</span>
              <span className="sm:hidden">Toevoegen</span>
            </Button>
          )}
        </div>
      ) : (
        /* Add Button for non-admin users */
        showAddButton && (
          <div className="flex justify-end">
            <Button
              onClick={handleOpenAddDialog}
              className="btn btn--outline flex items-center justify-center gap-2 whitespace-nowrap min-h-[44px] px-4"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Speler toevoegen</span>
              <span className="sm:hidden">Toevoegen</span>
            </Button>
          </div>
        )
      )}

      {/* Players List */}
      <PlayersList 
        players={players}
        loading={loading}
        editMode={canEdit}
        onRemovePlayer={handleRemovePlayer}
        onEditPlayer={handleEditPlayer}
        formatDate={formatDate}
        getFullName={getFullName}
      />

      {/* Player Regulations */}
      <div className="mt-6">
        <PlayerRegulations />
      </div>

      <PlayerModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        newPlayer={newPlayer}
        onPlayerChange={setNewPlayer}
        onSave={handleAddPlayer}
        editingPlayer={editingPlayer}
        onEditPlayerChange={setEditingPlayer}
        onEditSave={handleSaveEditedPlayer}
      />
    </div>
  );
};

export default PlayerPage; 