
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Edit, Plus, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Team, TeamPreference } from "../../types-advanced";

interface TeamSelectionCardProps {
  selectedTeams: number[];
  setSelectedTeams: (teams: number[]) => void;
  teamPreferences: TeamPreference[];
  setTeamPreferences: (preferences: TeamPreference[]) => void;
}

const TeamSelectionCard: React.FC<TeamSelectionCardProps> = ({
  selectedTeams,
  setSelectedTeams,
  teamPreferences,
  setTeamPreferences
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({ team_name: '' });

  // Fetch teams
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (error) throw error;
      return data as Team[];
    }
  });

  const handleTeamToggle = (teamId: number, checked: boolean) => {
    if (checked) {
      setSelectedTeams([...selectedTeams, teamId]);
      setTeamPreferences([
        ...teamPreferences,
        { team_id: teamId }
      ]);
    } else {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
      setTeamPreferences(teamPreferences.filter(pref => pref.team_id !== teamId));
    }
  };

  const selectAllTeams = () => {
    const allTeamIds = teams.map(team => team.team_id);
    setSelectedTeams(allTeamIds);
    setTeamPreferences(allTeamIds.map(id => ({ team_id: id })));
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({ team_name: team.team_name });
    setIsAddingNew(false);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTeam(null);
    setFormData({ team_name: '' });
    setIsAddingNew(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.team_name.trim()) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul de teamnaam in",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isAddingNew) {
        const { error } = await supabase
          .from('teams')
          .insert({
            team_name: formData.team_name.trim(),
            balance: 0.00
          });
        
        if (error) throw error;
        
        toast({
          title: "Team toegevoegd",
          description: `${formData.team_name} is succesvol toegevoegd`,
        });
      } else {
        const { error } = await supabase
          .from('teams')
          .update({
            team_name: formData.team_name.trim()
          })
          .eq('team_id', editingTeam.team_id);
        
        if (error) throw error;
        
        toast({
          title: "Team bijgewerkt",
          description: `${formData.team_name} is succesvol bijgewerkt`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving team:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van het team.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (team: Team) => {
    if (!confirm(`Weet je zeker dat je ${team.team_name} wilt verwijderen?`)) {
      return;
    }

    try {
      // Check if team has players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('player_id')
        .eq('team_id', team.team_id)
        .eq('is_active', true);

      if (playersError) throw playersError;

      if (players && players.length > 0) {
        toast({
          title: "Kan team niet verwijderen",
          description: `${team.team_name} heeft nog ${players.length} actieve speler(s). Verwijder eerst alle spelers.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', team.team_id);
      
      if (error) throw error;
      
      // Remove from selected teams if it was selected
      setSelectedTeams(selectedTeams.filter(id => id !== team.team_id));
      setTeamPreferences(teamPreferences.filter(pref => pref.team_id !== team.team_id));
      
      toast({
        title: "Team verwijderd",
        description: `${team.team_name} is succesvol verwijderd`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['teams'] });
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Selectie
            </CardTitle>
            <CardDescription>
              Selecteer de teams die deelnemen aan deze competitie
            </CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nieuw team
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <Button variant="outline" onClick={selectAllTeams} size="sm">
            Alles selecteren
          </Button>
          <span className="text-sm text-muted-foreground">
            Geselecteerd: {selectedTeams.length} teams
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {teams.map((team) => (
            <div key={team.team_id} className="flex items-center space-x-2 p-2 border rounded-lg group">
              <Checkbox
                id={`team-${team.team_id}`}
                checked={selectedTeams.includes(team.team_id)}
                onCheckedChange={(checked) => 
                  handleTeamToggle(team.team_id, checked as boolean)
                }
              />
              <Label htmlFor={`team-${team.team_id}`} className="flex-1">
                {team.team_name}
              </Label>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(team)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(team)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isAddingNew ? 'Nieuw team toevoegen' : 'Team bewerken'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team naam</Label>
                <Input
                  id="team-name"
                  value={formData.team_name}
                  onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                  placeholder="Bijv. FC Voorbeeld"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleSave}>
                  {isAddingNew ? 'Toevoegen' : 'Opslaan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TeamSelectionCard;
