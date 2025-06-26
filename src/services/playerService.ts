
import { supabase } from "@/integrations/supabase/client";

export interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
  is_active: boolean;
}

export const playerService = {
  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name, birth_date, team_id, is_active')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('first_name');
    
    if (error) {
      console.error('Error fetching players for team:', error);
      throw error;
    }
    
    return data || [];
  },

  async getAllPlayers(): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name, birth_date, team_id, is_active')
      .eq('is_active', true)
      .order('first_name');
    
    if (error) {
      console.error('Error fetching all players:', error);
      throw error;
    }
    
    return data || [];
  },

  async getPlayerById(playerId: number): Promise<Player | null> {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name, birth_date, team_id, is_active')
      .eq('player_id', playerId)
      .single();
    
    if (error) {
      console.error('Error fetching player:', error);
      return null;
    }
    
    return data;
  }
};
