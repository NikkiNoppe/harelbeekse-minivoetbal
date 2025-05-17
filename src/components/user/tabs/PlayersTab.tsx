
import React, { useState } from "react";
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
import { usePlayers, formatDate } from "../players/usePlayers";
import { useAuth } from "@/components/auth/AuthProvider";

const PlayersTab: React.FC = () => {
  const [editMode, setEditMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    dateOfBirth: ''
  });
  
  const { user } = useAuth();
  const { players, loading, removePlayer, addPlayer } = usePlayers();
  
  const handleAddPlayer = () => {
    addPlayer({
      name: newPlayer.name,
      dateOfBirth: newPlayer.dateOfBirth,
      teamId: user?.teamId,
      isActive: true
    });
    
    setDialogOpen(false);
    setNewPlayer({
      name: '',
      dateOfBirth: ''
    });
  };
  
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
          </div>
        </CardHeader>
        <CardContent>
          <PlayersList 
            players={players}
            loading={loading}
            editMode={editMode}
            onRemovePlayer={removePlayer}
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
