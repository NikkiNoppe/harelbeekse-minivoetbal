
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Player } from './playerTypes';
import { formatDate } from './playerUtils';
import { 
  fetchPlayersFromApi, 
  addPlayerToApi, 
  updatePlayerInApi, 
  removePlayerFromApi 
} from './playerService';

export { Player } from './playerTypes';
export { formatDate } from './playerUtils';

export const usePlayers = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      
      // If user is a team manager, only fetch their team's players
      const teamFilter = user?.role === "player_manager" ? user?.teamId : undefined;
      
      const fetchedPlayers = await fetchPlayersFromApi(teamFilter);
      setPlayers(fetchedPlayers);
      
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
      const addedPlayer = await addPlayerToApi(newPlayer);

      // Optimistically update the local state
      setPlayers(prevPlayers => [...prevPlayers, addedPlayer]);

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
      await updatePlayerInApi(updatedPlayer);

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
      await removePlayerFromApi(playerId);

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
