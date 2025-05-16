
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export const usePlayers = () => {
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
  
  return {
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
  };
};
