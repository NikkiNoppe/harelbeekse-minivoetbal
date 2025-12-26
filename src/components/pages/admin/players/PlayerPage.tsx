import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Loader2 } from "lucide-react";
import PlayersList from "./components/PlayersList";
import { PlayerModal } from "@/components/modals";
import PlayerRegulations from "./components/PlayerRegulations";
import { usePlayersUpdated } from "./hooks/usePlayersUpdated";
import { usePlayerListLock } from "./hooks/usePlayerListLock";
import { useAuth } from "@/hooks/useAuth";
import { formatDateShort } from "@/lib/dateUtils";
import { PageHeader } from "@/components/layout";
import { cn } from "@/lib/utils";

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

  const [isTeamChanging, setIsTeamChanging] = useState(false);

  const handleTeamSelectChange = useCallback((value: string) => {
    setIsTeamChanging(true);
    if (value === "all" || value === "") {
      handleTeamChange(null);
    } else {
      handleTeamChange(parseInt(value));
    }
    // Reset loading state after a short delay to allow the actual loading to take over
    setTimeout(() => {
      setIsTeamChanging(false);
    }, 100);
  }, [handleTeamChange]);

  // Memoized team options to prevent unnecessary re-renders
  const teamOptions = useMemo(() => [
    <SelectItem 
      key="all" 
      value="all" 
      className="dropdown-item-login-style"
    >
      Alle teams
    </SelectItem>,
    ...teams.map(team => (
      <SelectItem 
        key={team.team_id} 
        value={team.team_id.toString()} 
        className="dropdown-item-login-style"
      >
        {team.team_name}
      </SelectItem>
    ))
  ], [teams]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <PageHeader 
        title="Spelerslijst"
        subtitle={showLockMessage ? `Vergrendeld vanaf ${formatDateShort(lockDate)}` : currentTeamName || undefined}
      />

      {/* Team Selector and Add Button for Admin */}
      {isAdmin ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Select 
                value={selectedTeam?.toString() || "all"} 
                onValueChange={handleTeamSelectChange}
                disabled={loading || isTeamChanging}
              >
                <SelectTrigger className={cn(
                  "dropdown-login-style w-full sm:min-w-[200px] sm:w-auto",
                  (loading || isTeamChanging) && "opacity-70 cursor-not-allowed"
                )}>
                  <SelectValue placeholder="Alle teams" />
                </SelectTrigger>
                <SelectContent className="dropdown-content-login-style">
                  {teamOptions}
                </SelectContent>
              </Select>
              {(loading || isTeamChanging) && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            {(loading || isTeamChanging) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Spelers worden geladen...
              </p>
            )}
            {!hasTeams && !loading && (
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

      {/* Players Count */}
      {!loading && players.length > 0 && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className="text-sm font-semibold">
            {players.length} {players.length === 1 ? 'speler' : 'spelers'}
          </Badge>
        </div>
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