
import { supabase } from '@/integrations/supabase/client';
import { Player, Team } from './playerTypes';

export const fetchPlayersFromApi = async (teamId?: number) => {
  try {
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
    
    // If there's a teamId filter, only fetch that team's players
    if (teamId) {
      query = query.eq('team_id', teamId);
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
    
    return mappedPlayers;
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error;
  }
};

export const addPlayerToApi = async (newPlayer: Omit<Player, 'id'>) => {
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

    return {
      id: data![0].player_id,
      name: newPlayer.name,
      teamId: newPlayer.teamId,
      dateOfBirth: newPlayer.dateOfBirth,
      isActive: newPlayer.isActive,
    };
  } catch (error) {
    console.error('Error adding player:', error);
    throw error;
  }
};

export const updatePlayerInApi = async (updatedPlayer: Player) => {
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

    return updatedPlayer;
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
};

export const removePlayerFromApi = async (playerId: number) => {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('player_id', playerId);

    if (error) {
      throw error;
    }

    return playerId;
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
};
