
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent
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
import { Edit, Save, Plus, Trash2, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
  player_manager_id?: number | null;
}

const TeamsTab: React.FC = () => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState<{name: string, balance: string}>({
    name: "", 
    balance: "0"
  });
  
  // Fetch teams from Supabase
  useEffect(() => {
    async function fetchTeams() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('teams')
          .select('*');
        
        if (error) {
          throw error;
        }
        
        setTeams(data || []);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: "Fout bij laden",
          description: "Er is een fout opgetreden bij het laden van de teams.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchTeams();
  }, [toast]);
  
  // Handle opening edit dialog
  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setNewTeam({name: team.team_name, balance: team.balance.toString()});
    setDialogOpen(true);
  };
  
  // Handle opening add dialog
  const handleAddNew = () => {
    setEditingTeam(null);
    setNewTeam({name: "", balance: "0"});
    setDialogOpen(true);
  };
  
  // Handle save team
  const handleSaveTeam = async () => {
    if (!newTeam.name) {
      toast({
        title: "Naam ontbreekt",
        description: "Vul een teamnaam in",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (editingTeam) {
        // Update existing team
        const { error } = await supabase
          .from('teams')
          .update({ 
            team_name: newTeam.name, 
            balance: parseFloat(newTeam.balance) 
          })
          .eq('team_id', editingTeam.team_id);
        
        if (error) throw error;
        
        setTeams(teams.map(team => 
          team.team_id === editingTeam.team_id 
            ? { ...team, team_name: newTeam.name, balance: parseFloat(newTeam.balance) } 
            : team
        ));
        
        toast({
          title: "Team bijgewerkt",
          description: `${newTeam.name} is bijgewerkt`,
        });
      } else {
        // Add new team
        const { data, error } = await supabase
          .from('teams')
          .insert({ 
            team_name: newTeam.name, 
            balance: parseFloat(newTeam.balance) 
          })
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setTeams([...teams, data[0]]);
          
          toast({
            title: "Team toegevoegd",
            description: `${newTeam.name} is toegevoegd`,
          });
        }
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving team:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van het team.",
        variant: "destructive",
      });
    }
  };
  
  // Handle delete team
  const handleDeleteTeam = async (teamId: number) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', teamId);
      
      if (error) throw error;
      
      setTeams(teams.filter(team => team.team_id !== teamId));
      
      toast({
        title: "Team verwijderd",
        description: "Het team is verwijderd uit de competitie",
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van het team.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                Beheer de teams in de competitie
              </CardDescription>
            </div>
            
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus size={16} />
              Nieuw team
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Teams laden...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Balans</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      Geen teams gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  teams.map(team => (
                    <TableRow key={team.team_id}>
                      <TableCell className="font-medium">{team.team_name}</TableCell>
                      <TableCell>€ {team.balance.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTeam(team)}
                            className="text-purple-500 hover:text-purple-700 hover:bg-purple-100/10"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTeam(team.team_id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Team Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? "Team bewerken" : "Nieuw team toevoegen"}
            </DialogTitle>
            <DialogDescription>
              {editingTeam 
                ? "Bewerk de gegevens van dit team" 
                : "Voeg een nieuw team toe aan de competitie"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label>Teamnaam</label>
              <Input
                value={newTeam.name}
                onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                placeholder="Naam van het team"
              />
            </div>
            
            <div className="space-y-2">
              <label>Balans</label>
              <Input
                type="number"
                step="0.01"
                value={newTeam.balance}
                onChange={(e) => setNewTeam({...newTeam, balance: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveTeam}>
              {editingTeam ? "Bijwerken" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsTab;
