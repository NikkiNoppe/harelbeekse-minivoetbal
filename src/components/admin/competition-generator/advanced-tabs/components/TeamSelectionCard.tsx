
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, Users, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AutoFitText from "@/components/ui/auto-fit-text";

interface Team {
  team_id: number;
  team_name: string;
}

interface TeamPreference {
  team_id: number;
  preferred_venue?: string;
  preferred_day?: number;
  avoid_venue?: string;
  avoid_day?: number;
}

interface TeamSelectionCardProps {
  selectedTeams: number[];
  setSelectedTeams: (teams: number[]) => void;
  teamPreferences: TeamPreference[];
  setTeamPreferences: (prefs: TeamPreference[]) => void;
}

const TeamSelectionCard: React.FC<TeamSelectionCardProps> = ({
  selectedTeams,
  setSelectedTeams,
  teamPreferences,
  setTeamPreferences
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({ team_name: '' });

  // Fetch teams
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (error) throw error;
      return data || [];
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
        title: "Fout",
        description: "Team naam is verplicht",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isAddingNew) {
        const { error } = await supabase
          .from('teams')
          .insert([{ team_name: formData.team_name.trim() }]);
        
        if (error) throw error;
        
        toast({
          title: "Succes",
          description: "Team toegevoegd"
        });
      } else if (editingTeam) {
        const { error } = await supabase
          .from('teams')
          .update({ team_name: formData.team_name.trim() })
          .eq('team_id', editingTeam.team_id);
        
        if (error) throw error;
        
        toast({
          title: "Succes",
          description: "Team bijgewerkt"
        });
      }
      
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsDialogOpen(false);
      setFormData({ team_name: '' });
      setEditingTeam(null);
    } catch (error) {
      console.error('Error saving team:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (team: Team) => {
    if (!confirm(`Weet je zeker dat je "${team.team_name}" wilt verwijderen?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', team.team_id);
      
      if (error) throw error;
      
      // Remove from selected teams if it was selected
      setSelectedTeams(selectedTeams.filter(id => id !== team.team_id));
      setTeamPreferences(teamPreferences.filter(pref => pref.team_id !== team.team_id));
      
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      
      toast({
        title: "Succes",
        description: "Team verwijderd"
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Selectie
            </CardTitle>
            <CardDescription>
              Selecteer de teams die deelnemen aan deze competitie
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={selectAllTeams}
            >
              Alles selecteren
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4 mr-1" />
              Team toevoegen
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Geselecteerd: {selectedTeams.length} teams
        </p>
        
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
              <Label htmlFor={`team-${team.team_id}`} className="flex-1 team-name-container" style={{ minWidth: 0 }}>
                <AutoFitText 
                  text={team.team_name}
                  maxFontSize={14}
                  minFontSize={7}
                  className="text-responsive-team"
                />
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
