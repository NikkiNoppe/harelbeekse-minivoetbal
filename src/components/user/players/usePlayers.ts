
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Player {
  id: number;
  name: string;
  team?: string;
  teamId?: number;
  dateOfBirth?: string;
  isActive?: boolean;
}

export interface Team {
  team_id: number;
  team_name: string;
}

export const usePlayers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      
      // Different query based on user role
      let query = supabase.from('players').select(`
        player_id,
        player_name,
        birth_date,
        is_active,
        team_id,
        teams (
          team_name
        )
      `);
      
      // If user is a team manager, only fetch their team's players
      if (user?.role === "player_manager" && user?.teamId) {
        query = query.eq('team_id', user.teamId);
      }
      
      const { data, error } = await query.order('player_name');
      
      if (error) throw error;
      
      // Map the data to our Player interface
      const mappedPlayers: Player[] = (data || []).map(player => ({
        id: player.player_id,
        name: player.player_name,
        teamId: player.team_id,
        team: player.teams?.team_name,
        dateOfBirth: player.birth_date,
        isActive: player.is_active
      }));
      
      setPlayers(mappedPlayers);
      
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: 'Fout bij het laden van spelers',
        description: 'Er is een probleem opgetreden bij het ophalen van de spelersgegevens.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = async (newPlayer: Omit<Player, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([
          {
            player_name: newPlayer.name,
            team_id: newPlayer.teamId,
            birth_date: newPlayer.dateOfBirth,
            is_active: newPlayer.isActive,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      // Optimistically update the local state
      setPlayers(prevPlayers => [
        ...prevPlayers,
        {
          id: data![0].player_id,
          name: newPlayer.name,
          teamId: newPlayer.teamId,
          dateOfBirth: newPlayer.dateOfBirth,
          isActive: newPlayer.isActive,
        },
      ]);

      toast({
        title: 'Speler toegevoegd',
        description: `${newPlayer.name} is succesvol toegevoegd.`,
      });
    } catch (error) {
      console.error('Error adding player:', error);
      toast({
        title: 'Fout bij toevoegen',
        description: 'Er is een fout opgetreden bij het toevoegen van de speler.',
        variant: 'destructive',
      });
    }
  };

  const updatePlayer = async (updatedPlayer: Player) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          player_name: updatedPlayer.name,
          team_id: updatedPlayer.teamId,
          birth_date: updatedPlayer.dateOfBirth,
          is_active: updatedPlayer.isActive,
        })
        .eq('player_id', updatedPlayer.id);

      if (error) {
        throw error;
      }

      // Optimistically update the local state
      setPlayers(prevPlayers =>
        prevPlayers.map(player =>
          player.id === updatedPlayer.id ? updatedPlayer : player
        )
      );

      toast({
        title: 'Speler bijgewerkt',
        description: `${updatedPlayer.name} is succesvol bijgewerkt.`,
      });
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: 'Fout bij bijwerken',
        description: 'Er is een fout opgetreden bij het bijwerken van de speler.',
        variant: 'destructive',
      });
    }
  };

  const removePlayer = async (playerId: number) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('player_id', playerId);

      if (error) {
        throw error;
      }

      // Optimistically update the local state
      setPlayers(prevPlayers => prevPlayers.filter(player => player.id !== playerId));

      toast({
        title: 'Speler verwijderd',
        description: 'De speler is succesvol verwijderd.',
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: 'Fout bij verwijderen',
        description: 'Er is een fout opgetreden bij het verwijderen van de speler.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  useEffect(() => {
    fetchPlayers();
  }, [user?.teamId]);

  return {
    players,
    loading,
    fetchPlayers,
    addPlayer,
    updatePlayer,
    removePlayer,
    formatDate,
  };
};
