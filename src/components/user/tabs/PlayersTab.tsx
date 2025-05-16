
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
import PlayersList from "../players/PlayersList";
import PlayerDialog from "../players/PlayerDialog";
import { usePlayers } from "../players/usePlayers";

const PlayersTab: React.FC = () => {
  const {
    players,
    teams,
    loading,
    editMode,
    selectedTeam,
    dialogOpen,
    newPlayer,
    setEditMode,
    handleTeamChange,
    setDialogOpen,
    setNewPlayer,
    handleAddPlayer,
    handleRemovePlayer,
    formatDate,
    user
  } = usePlayers();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Spelerslijst</CardTitle>
              <CardDescription>
                Beheer de spelers in de competitie
              </CardDescription>
            </div>
            
            {user?.role === "admin" && (
              <select 
                className="p-2 bg-slate-800 border border-slate-700 rounded-md"
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
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PlayersList 
            players={players}
            loading={loading}
            editMode={editMode}
            onRemovePlayer={handleRemovePlayer}
            formatDate={formatDate}
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
      
      <PlayerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        newPlayer={newPlayer}
        onPlayerChange={setNewPlayer}
        onSave={handleAddPlayer}
      />
    </div>
  );
};

export default PlayersTab;
