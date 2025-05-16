
import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Player {
  player_id: number;
  player_name: string;
  birth_date: string;
  team_id: number;
  is_active: boolean;
}

interface Team {
  team_id: number;
  team_name: string;
}

const PlayersTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState<{name: string, birthDate: string}>({
    name: "", 
    birthDate: ""
  });
  const [loading, setLoading] = useState(true);
  
  // Fetch teams from Supabase
  useEffect(() => {
    async function fetchTeams() {
      try {
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .order('team_name');
        
        if (teamsError) throw teamsError;
        
        setTeams(teamsData || []);
        
        // If user is team manager, auto-select their team
        if (user?.role === "team" && user.teamId) {
          setSelectedTeam(user.teamId);
        } else if (teamsData && teamsData.length > 0) {
          // For admin, select first team by default
          setSelectedTeam(teamsData[0].team_id);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: "Fout bij laden",
          description: "Er is een fout opgetreden bij het laden van de teams.",
          variant: "destructive",
        });
      }
    }
    
    fetchTeams();
  }, [user, toast]);
  
  // Fetch players when selected team changes
  useEffect(() => {
    async function fetchPlayers() {
      if (!selectedTeam) return;
      
      try {
        setLoading(true);
        
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('team_id', selectedTeam)
          .eq('is_active', true)
          .order('player_name');
        
        if (playersError) throw playersError;
        
        setPlayers(playersData || []);
      } catch (error) {
        console.error('Error fetching players:', error);
        toast({
          title: "Fout bij laden",
          description: "Er is een fout opgetreden bij het laden van de spelers.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlayers();
  }, [selectedTeam, toast]);
  
  // Handle team selection (admins only)
  const handleTeamChange = (teamId: number) => {
    setSelectedTeam(teamId);
    setEditMode(false);
  };
  
  // Handle add new player
  const handleAddPlayer = async () => {
    if (!selectedTeam) {
      toast({
        title: "Geen team geselecteerd",
        description: "Selecteer eerst een team",
        variant: "destructive",
      });
      return;
    }
    
    if (!newPlayer.name || !newPlayer.birthDate) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('players')
        .insert({
          player_name: newPlayer.name,
          birth_date: newPlayer.birthDate,
          team_id: selectedTeam,
          is_active: true
        })
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPlayers([...players, data[0]]);
        setNewPlayer({name: "", birthDate: ""});
        setDialogOpen(false);
        
        toast({
          title: "Speler toegevoegd",
          description: `${newPlayer.name} is toegevoegd aan het team`,
        });
      }
    } catch (error) {
      console.error('Error adding player:', error);
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de speler.",
        variant: "destructive",
      });
    }
  };
  
  // Handle remove player
  const handleRemovePlayer = async (playerId: number) => {
    try {
      // Use soft delete by setting is_active to false
      const { error } = await supabase
        .from('players')
        .update({ is_active: false })
        .eq('player_id', playerId);
      
      if (error) throw error;
      
      setPlayers(players.filter(p => p.player_id !== playerId));
      
      toast({
        title: "Speler verwijderd",
        description: "De speler is verwijderd uit het team",
      });
    } catch (error) {
      console.error('Error removing player:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de speler.",
        variant: "destructive",
      });
    }
  };
  
  // Format date to display in DD-MM-YYYY format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL');
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
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Spelers laden...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Geboortedatum</TableHead>
                  {editMode && <TableHead className="w-20">Acties</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={editMode ? 3 : 2} className="text-center text-muted-foreground py-6">
                      Geen spelers gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map(player => (
                    <TableRow key={player.player_id}>
                      <TableCell>{player.player_name}</TableCell>
                      <TableCell>{formatDate(player.birth_date)}</TableCell>
                      {editMode && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePlayer(player.player_id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
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
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe speler toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe speler toe aan het team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label>Naam</label>
              <Input
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                placeholder="Naam van de speler"
              />
            </div>
            
            <div className="space-y-2">
              <label>Geboortedatum</label>
              <Input
                type="date"
                value={newPlayer.birthDate}
                onChange={(e) => setNewPlayer({...newPlayer, birthDate: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAddPlayer}>
              Speler toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayersTab;
