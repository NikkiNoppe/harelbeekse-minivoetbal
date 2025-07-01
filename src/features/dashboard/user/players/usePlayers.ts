import { useState, useEffect } from "react";
import { useAuth } from "@features/auth/AuthProvider";
import { supabase } from "@shared/integrations/supabase/client";
import { useToast } from "@shared/hooks/use-toast";
import { MOCK_TEAM_PLAYERS } from "@shared/constants/mockData";

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState<{name: string, birthDate: string}>({
    name: "", 
    birthDate: ""
  });
  const [editingPlayer, setEditingPlayer] = useState<{player_id: number, name: string, birthDate: string} | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch teams - using mock data for now
  useEffect(() => {
    async function fetchTeams() {
      try {
        // Use mock data instead of Supabase for now
        const mockTeams = [
          { team_id: 1, team_name: "Garage Verbeke" },
          { team_id: 2, team_name: "Shakthar Truuk" },
          { team_id: 3, team_name: "De Dageraad" },
          { team_id: 4, team_name: "Cafe De Gilde" },
          { team_id: 5, team_name: "De Florre" },
          { team_id: 6, team_name: "Bemarmi Boys" }
        ];
        
        setTeams(mockTeams);
        
        // If user is player_manager, auto-select their team
        if (user && user.role === "player_manager") {
          setSelectedTeam(user.teamId);
        } else if (mockTeams && mockTeams.length > 0) {
          // For admin, select first team by default
          setSelectedTeam(mockTeams[0].team_id);
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
        
        // Use mock data instead of Supabase for now
        const teamPlayers = MOCK_TEAM_PLAYERS[selectedTeam as keyof typeof MOCK_TEAM_PLAYERS] || [];
        setPlayers(teamPlayers);
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
      // For now, just add to local state (mock functionality)
      const newPlayerId = Math.max(...players.map(p => p.player_id), 0) + 1;
      const playerToAdd: Player = {
        player_id: newPlayerId,
        player_name: newPlayer.name,
        birth_date: newPlayer.birthDate,
        team_id: selectedTeam,
        is_active: true
      };
      
      setPlayers([...players, playerToAdd]);
      setNewPlayer({name: "", birthDate: ""});
      setDialogOpen(false);
      
      toast({
        title: "Speler toegevoegd",
        description: `${newPlayer.name} is toegevoegd aan het team`,
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
        name: player.player_name,
        birthDate: player.birth_date
      });
      setEditDialogOpen(true);
    }
  };
  
  // Handle save edited player
  const handleSaveEditedPlayer = async () => {
    if (!editingPlayer) return;
    
    try {
      // For now, just update local state (mock functionality)
      setPlayers(players.map(player => 
        player.player_id === editingPlayer.player_id 
          ? { 
              ...player, 
              player_name: editingPlayer.name, 
              birth_date: editingPlayer.birthDate 
            } 
          : player
      ));
      
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
      // For now, just remove from local state (mock functionality)
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
    user
  };
};
