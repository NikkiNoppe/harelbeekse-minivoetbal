import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Lock } from "lucide-react";
import PlayersList from "./PlayersList";
import PlayerDialog from "./PlayerDialog";
import PlayerRegulations from "./PlayerRegulations";
import { usePlayersUpdated } from "./usePlayersUpdated";
import { usePlayerListLock } from "@/components/user/players/hooks/usePlayerListLock";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatDateShort } from "@/lib/dateUtils";

const PlayerPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const {
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
  const currentTeamName = authUser?.role === "player_manager" 
    ? userTeamName 
    : teams.find(team => team.team_id === selectedTeam)?.team_name || "";
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          Spelerslijst
          {isLocked && authUser?.role !== "admin" && (
            <Lock className="h-4 w-4 text-red-500" />
          )}
        </h2>
      </div>
      <section>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">
                  {authUser?.role === "player_manager" && currentTeamName ? (
                    <>Spelers van {currentTeamName}</>
                  ) : (
                    <>Beheer de spelers in de competitie</>
                  )}
                </CardTitle>
                {isLocked && lockDate && authUser?.role !== "admin" && (
                  <p className="text-sm text-red-600 mt-1">
                    Spelerslijst vergrendeld vanaf {formatDateShort(lockDate)}
                  </p>
                )}
              </div>
              {authUser?.role === "admin" && (
                <div className="flex flex-col gap-2">
                  <Select value={selectedTeam?.toString() || ""} onValueChange={(value) => handleTeamChange(parseInt(value))}>
                    <SelectTrigger className="dropdown-login-style min-w-[200px]">
                      <SelectValue placeholder="Selecteer team" />
                    </SelectTrigger>
                    <SelectContent className="dropdown-content-login-style">
                      {teams.map(team => (
                        <SelectItem key={team.team_id} value={team.team_id.toString()} className="dropdown-item-login-style">
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentTeamName && (
                    <span className="text-sm text-muted-foreground text-center">
                      Geselecteerd: {currentTeamName}
                    </span>
                  )}
                  {teams.length === 0 && (
                    <span className="text-sm text-red-500 text-center">
                      Geen teams gevonden
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <PlayersList 
              players={players}
              loading={loading}
              editMode={canEdit}
              onRemovePlayer={handleRemovePlayer}
              onEditPlayer={handleEditPlayer}
              formatDate={formatDate}
              getFullName={getFullName}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            {canEdit && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Speler toevoegen
              </Button>
            )}
          </CardFooter>
        </Card>
      </section>
      <section>
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spelersreglement</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerRegulations />
            </CardContent>
          </Card>
        </div>
      </section>
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