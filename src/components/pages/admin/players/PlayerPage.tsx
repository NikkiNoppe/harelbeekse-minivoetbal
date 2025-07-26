import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import PlayersList from "./components/PlayersList";
import PlayerDialog from "./components/PlayerDialog";
import PlayerRegulations from "./components/PlayerRegulations";
import { usePlayersUpdated } from "./hooks/usePlayersUpdated";
import { usePlayerListLock } from "@/components/user/players/hooks/usePlayerListLock";
import { useAuth } from "@/components/login/AuthProvider";
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
  const isAdmin = authUser?.role === "admin";
  const currentTeamName = isAdmin 
    ? teams.find(team => team.team_id === selectedTeam)?.team_name || ""
    : userTeamName;

  const handleOpenAddDialog = () => setDialogOpen(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Spelerslijst
          </h1>
          {isLocked && !isAdmin && (
            <p className="text-sm text-red-600 mt-1">
              Spelerslijst vergrendeld vanaf {formatDateShort(lockDate)}
            </p>
          )}
        </div>
      </div>

      {/* Team Selector and Add Button for Admin */}
      {isAdmin ? (
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Select 
              value={selectedTeam?.toString() || ""} 
              onValueChange={(value) => handleTeamChange(parseInt(value))}
            >
              <SelectTrigger className="dropdown-login-style min-w-[200px]">
                <SelectValue placeholder="Selecteer team" />
              </SelectTrigger>
              <SelectContent className="dropdown-content-login-style">
                {teams.map(team => (
                  <SelectItem 
                    key={team.team_id} 
                    value={team.team_id.toString()} 
                    className="dropdown-item-login-style"
                  >
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {teams.length === 0 && (
              <span className="text-sm text-red-500 text-center">
                Geen teams gevonden
              </span>
            )}
          </div>
          {canEdit && (
            <Button
              onClick={handleOpenAddDialog}
              className="btn btn--outline flex items-center gap-2"
            >
              <Plus size={16} />
              Speler toevoegen
            </Button>
          )}
        </div>
      ) : (
        /* Add Button for non-admin users */
        canEdit && (
          <div className="flex justify-end">
            <Button
              onClick={handleOpenAddDialog}
              className="btn btn--outline flex items-center gap-2"
            >
              <Plus size={16} />
              Speler toevoegen
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

      <PlayerDialog
        open={dialogOpen || editDialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          setEditDialogOpen(open);
        }}
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