
import { supabase } from "@/integrations/supabase/client";

export interface Team {
  team_id: number;
  team_name: string;
  balance?: number;
}

export const teamService = {
  async getAllTeams(): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('team_id, team_name, balance')
      .order('team_name');
    
    if (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
    
    return data || [];
  },

  async getTeamById(teamId: number): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .select('team_id, team_name, balance')
      .eq('team_id', teamId)
      .single();
    
    if (error) {
      console.error('Error fetching team:', error);
      return null;
    }
    
    return data;
  },

  async createTeam(teamName: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .insert({ team_name: teamName, balance: 0 })
      .select('team_id, team_name, balance')
      .single();
    
    if (error) {
      console.error('Error creating team:', error);
      throw error;
    }
    
    return data;
  },

  async updateTeam(teamId: number, teamName: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .update({ team_name: teamName })
      .eq('team_id', teamId)
      .select('team_id, team_name, balance')
      .single();
    
    if (error) {
      console.error('Error updating team:', error);
      throw error;
    }
    
    return data;
  },

  async deleteTeam(teamId: number): Promise<boolean> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('team_id', teamId);
    
    if (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
    
    return true;
  }
};
