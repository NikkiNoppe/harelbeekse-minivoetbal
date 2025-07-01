
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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
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
        .select('*')
        .order('team_name');
      
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
    if (!formData.name.trim()) {
      toast({
        title: "Naam ontbreekt",
        description: "Vul een teamnaam in",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate team names
    const existingTeam = teams.find(team => 
      team.team_name.toLowerCase() === formData.name.trim().toLowerCase() && 
      team.team_id !== editingTeam?.team_id
    );
    
    if (existingTeam) {
      toast({
        title: "Team bestaat al",
        description: "Er bestaat al een team met deze naam",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSaving(true);
      
      if (editingTeam) {
        // Update existing team
        const { error } = await supabase
          .from('teams')
          .update({ 
            team_name: formData.name.trim(), 
            balance: parseFloat(formData.balance) || 0
          })
          .eq('team_id', editingTeam.team_id);
        
        if (error) throw error;
        
        setTeams(teams.map(team => 
          team.team_id === editingTeam.team_id 
            ? { ...team, team_name: formData.name.trim(), balance: parseFloat(formData.balance) || 0 } 
            : team
        ));
        
        toast({
          title: "Team bijgewerkt",
          description: `${formData.name} is succesvol bijgewerkt`,
        });
      } else {
        // Add new team
        const { data, error } = await supabase
          .from('teams')
          .insert({ 
            team_name: formData.name.trim(), 
            balance: parseFloat(formData.balance) || 0
          })
          .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setTeams([...teams, data[0]]);
          
          toast({
            title: "Team toegevoegd",
            description: `${formData.name} is succesvol toegevoegd`,
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
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    try {
      setDeleting(true);
      
      // Check for related data before deleting
      const [playersResult, matchesResult, teamUsersResult] = await Promise.all([
        supabase.from('players').select('player_id').eq('team_id', teamId),
        supabase.from('matches').select('match_id').or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`),
        supabase.from('team_users').select('user_id').eq('team_id', teamId)
      ]);

      const hasPlayers = playersResult.data && playersResult.data.length > 0;
      const hasMatches = matchesResult.data && matchesResult.data.length > 0;
      const hasTeamUsers = teamUsersResult.data && teamUsersResult.data.length > 0;

      if (hasPlayers || hasMatches || hasTeamUsers) {
        const issues = [];
        if (hasPlayers) issues.push(`${playersResult.data!.length} speler(s)`);
        if (hasMatches) issues.push(`${matchesResult.data!.length} wedstrijd(en)`);
        if (hasTeamUsers) issues.push(`${teamUsersResult.data!.length} teamverantwoordelijke(n)`);
        
        toast({
          title: "Kan team niet verwijderen",
          description: `Dit team heeft nog ${issues.join(', ')} gekoppeld. Verwijder eerst deze relaties.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', teamId);
      
      if (error) throw error;
      
      setTeams(teams.filter(team => team.team_id !== teamId));
      
      toast({
        title: "Team verwijderd",
        description: "Het team is succesvol verwijderd uit de competitie",
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van het team.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
      setTeamToDelete(null);
    }
  };

  const confirmDelete = (team: Team) => {
    setTeamToDelete(team);
    setConfirmDeleteOpen(true);
  };

  return {
    teams,
    loading,
    saving,
    deleting,
    dialogOpen,
    setDialogOpen,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    teamToDelete,
    editingTeam,
    formData,
    handleAddNew,
    handleEditTeam,
    handleFormChange,
    handleSaveTeam,
    handleDeleteTeam,
    confirmDelete
  };
}
