
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Team {
  team_id: number;
  team_name: string;
  balance: number;
  player_manager_id?: number | null;
}

interface TeamFormData {
  name: string;
  balance: string;
}

export function useTeams() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    balance: "0"
  });

  const fetchTeams = async () => {
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
  };
  
  useEffect(() => {
    fetchTeams();
  }, [toast]);

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.team_name,
      balance: team.balance.toString()
    });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingTeam(null);
    setFormData({
      name: "",
      balance: "0"
    });
    setDialogOpen(true);
  };

  const handleFormChange = (field: keyof TeamFormData, value: string) => {
    setFormData({...formData, [field]: value});
  };

  const handleSaveTeam = async () => {
    if (!formData.name) {
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
            team_name: formData.name, 
            balance: parseFloat(formData.balance) 
          })
          .eq('team_id', editingTeam.team_id);
        
        if (error) throw error;
        
        setTeams(teams.map(team => 
          team.team_id === editingTeam.team_id 
            ? { ...team, team_name: formData.name, balance: parseFloat(formData.balance) } 
            : team
        ));
        
        toast({
          title: "Team bijgewerkt",
          description: `${formData.name} is bijgewerkt`,
        });
      } else {
        // Add new team
        const { data, error } = await supabase
          .from('teams')
          .insert({ 
            team_name: formData.name, 
            balance: parseFloat(formData.balance) 
          })
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setTeams([...teams, data[0]]);
          
          toast({
            title: "Team toegevoegd",
            description: `${formData.name} is toegevoegd`,
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

  return {
    teams,
    loading,
    dialogOpen,
    setDialogOpen,
    editingTeam,
    formData,
    handleAddNew,
    handleEditTeam,
    handleFormChange,
    handleSaveTeam,
    handleDeleteTeam
  };
}
