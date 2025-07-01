
import { supabase } from "@/integrations/supabase/client";

export interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
  email?: string;
  phone?: string;
}

export const playerService = {
  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name, birth_date, team_id')
      .eq('team_id', teamId)
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
      .select('player_id, first_name, last_name, birth_date, team_id')
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
      .select('player_id, first_name, last_name, birth_date, team_id')
      .eq('player_id', playerId)
      .single();
    
    if (error) {
      console.error('Error fetching player:', error);
      return null;
    }
    
    return data;
  },

  async addPlayer(playerData: {
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    birth_date?: string | null;
    team_id: number;
  }): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .insert([playerData])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding player:', error);
      throw error;
    }
    
    return data;
  },

  async removePlayer(playerId: number): Promise<void> {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('player_id', playerId);
    
    if (error) {
      console.error('Error removing player:', error);
      throw error;
    }
  }
};
