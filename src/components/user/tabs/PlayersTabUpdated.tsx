import React from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save, Plus } from "lucide-react";
import PlayersListUpdated from "../players/PlayersListUpdated";
import PlayerDialogUpdated from "../players/PlayerDialogUpdated";
import EditPlayerDialogUpdated from "../players/EditPlayerDialogUpdated";
import PlayerRegulations from "../players/PlayerRegulations";
import { usePlayersUpdated } from "../players/usePlayersUpdated";

const PlayersTabUpdated: React.FC = () => {
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
    user,
    userTeamName
  } = usePlayersUpdated();

  // Get the current team name for display
  const currentTeamName = user?.role === "player_manager" 
    ? userTeamName 
    : teams.find(team => team.team_id === selectedTeam)?.team_name || "";
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Spelerslijst</CardTitle>
              <CardDescription>
                {user?.role === "player_manager" && currentTeamName ? (
                  <>Spelers van {currentTeamName}</>
                ) : (
                  <>Beheer de spelers in de competitie</>
                )}
              </CardDescription>
            </div>
            
            {user?.role === "admin" && (
              <div className="flex flex-col gap-2">
                <select 
                  className="p-2 bg-white border border-gray-200 rounded-md text-gray-900"
                  value={selectedTeam || ""}
                  onChange={(e) => handleTeamChange(parseInt(e.target.value))}
                >
                  <option value="" disabled>Selecteer team</option>
                  {teams.map(team => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
                {currentTeamName && (
                  <span className="text-sm text-muted-foreground text-center">
                    Geselecteerd: {currentTeamName}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PlayersListUpdated 
            players={players}
            loading={loading}
            editMode={editMode}
            onRemovePlayer={handleRemovePlayer}
            onEditPlayer={handleEditPlayer}
            formatDate={formatDate}
            getFullName={getFullName}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-2"
          >
            {editMode ? (
              <>
                <Save size={16} />
                Klaar met bewerken
              </>
            ) : (
              <>
                <Edit size={16} />
                Lijst bewerken
              </>
            )}
          </Button>
          
          {editMode && (
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
      
      <PlayerRegulations />
      
      <PlayerDialogUpdated
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        newPlayer={newPlayer}
        onPlayerChange={setNewPlayer}
        onSave={handleAddPlayer}
      />
      
      <EditPlayerDialogUpdated
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        player={editingPlayer}
        onPlayerChange={setEditingPlayer}
        onSave={handleSaveEditedPlayer}
      />
    </div>
  );
};

export default PlayersTabUpdated;
