
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
  is_active: boolean;
}

interface Team {
  team_id: number;
  team_name: string;
}

export const usePlayersUpdated = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState<{firstName: string, lastName: string, birthDate: string}>({
    firstName: "", 
    lastName: "",
    birthDate: ""
  });
  const [editingPlayer, setEditingPlayer] = useState<{player_id: number, firstName: string, lastName: string, birthDate: string} | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch teams from Supabase
  useEffect(() => {
    async function fetchTeams() {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .order('team_name');
        
        if (error) throw error;
        
        setTeams(data || []);
        
        // If user is player_manager, auto-select their team
        if (user && user.role === "player_manager") {
          setSelectedTeam(user.teamId);
        } else if (data && data.length > 0) {
          // For admin, select first team by default
          setSelectedTeam(data[0].team_id);
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
        
        const { data, error } = await supabase
          .from('players')
          .select('player_id, first_name, last_name, birth_date, team_id, is_active')
          .eq('team_id', selectedTeam)
          .eq('is_active', true)
          .order('first_name');
        
        if (error) throw error;
        
        setPlayers(data || []);
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
    
    if (!newPlayer.firstName || !newPlayer.lastName || !newPlayer.birthDate) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle velden in",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('players')
        .insert({
          first_name: newPlayer.firstName,
          last_name: newPlayer.lastName,
          birth_date: newPlayer.birthDate,
          team_id: selectedTeam,
          is_active: true
        });
      
      if (error) throw error;
      
      // Refresh players list
      const { data, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, team_id, is_active')
        .eq('team_id', selectedTeam)
        .eq('is_active', true)
        .order('first_name');
      
      if (fetchError) throw fetchError;
      
      setPlayers(data || []);
      setNewPlayer({firstName: "", lastName: "", birthDate: ""});
      setDialogOpen(false);
      
      toast({
        title: "Speler toegevoegd",
        description: `${newPlayer.firstName} ${newPlayer.lastName} is toegevoegd aan het team`,
      });
    } catch (error) {
      console.error('Error adding player:', error);
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de speler.",
        variant: "destructive",
      });
    }
  };
  
  // Handle edit player
  const handleEditPlayer = (playerId: number) => {
    const player = players.find(p => p.player_id === playerId);
    if (player) {
      setEditingPlayer({
        player_id: player.player_id,
        firstName: player.first_name,
        lastName: player.last_name,
        birthDate: player.birth_date
      });
      setEditDialogOpen(true);
    }
  };
  
  // Handle save edited player
  const handleSaveEditedPlayer = async () => {
    if (!editingPlayer) return;
    
    try {
      const { error } = await supabase
        .from('players')
        .update({
          first_name: editingPlayer.firstName,
          last_name: editingPlayer.lastName,
          birth_date: editingPlayer.birthDate
        })
        .eq('player_id', editingPlayer.player_id);
      
      if (error) throw error;
      
      // Refresh players list
      const { data, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, team_id, is_active')
        .eq('team_id', selectedTeam)
        .eq('is_active', true)
        .order('first_name');
      
      if (fetchError) throw fetchError;
      
      setPlayers(data || []);
      setEditDialogOpen(false);
      setEditingPlayer(null);
      
      toast({
        title: "Speler bijgewerkt",
        description: "De gegevens van de speler zijn bijgewerkt",
      });
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van de speler.",
        variant: "destructive",
      });
    }
  };
  
  // Handle remove player
  const handleRemovePlayer = async (playerId: number) => {
    try {
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

  // Get full name
  const getFullName = (player: Player) => {
    return `${player.first_name} ${player.last_name}`.trim();
  };
  
  return {
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
    user
  };
};
