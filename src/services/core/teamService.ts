
import { supabase } from "@/integrations/supabase/client";

export interface Team {
  team_id: number;
  team_name: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  club_colors?: string;
  preferred_play_moments?: {
    days?: string[];
    timeslots?: string[];
    venues?: number[];
    notes?: string;
  };
}

export const teamService = {
  async getAllTeams(): Promise<Team[]> {
    try {
      // First try with all new columns
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name, contact_person, contact_phone, contact_email, club_colors, preferred_play_moments')
        .order('team_name');
      
      if (error) {
        // If new columns don't exist, fall back to basic columns
        console.warn('New team columns not found, falling back to basic columns:', error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .order('team_name');
        
        if (fallbackError) {
          console.error('Error fetching teams:', fallbackError);
          throw fallbackError;
        }
        
        // Map fallback data to Team interface with undefined new fields
        return (fallbackData || []).map((team: any) => ({
          ...team,
          contact_person: undefined,
          contact_phone: undefined,
          contact_email: undefined,
          club_colors: undefined,
          preferred_play_moments: undefined
        }));
      }
      
      return (data || []) as unknown as Team[];
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  async getTeamById(teamId: number): Promise<Team | null> {
    try {
      // First try with all new columns
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name, contact_person, contact_phone, contact_email, club_colors, preferred_play_moments')
        .eq('team_id', teamId)
        .single();
      
      if (error) {
        // If new columns don't exist, fall back to basic columns
        console.warn('New team columns not found, falling back to basic columns:', error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .eq('team_id', teamId)
          .single();
        
        if (fallbackError) {
          console.error('Error fetching team:', fallbackError);
          return null;
        }
        
        // Map fallback data to Team interface with undefined new fields
        return fallbackData ? {
          ...fallbackData,
          contact_person: undefined,
          contact_phone: undefined,
          contact_email: undefined,
          club_colors: undefined,
          preferred_play_moments: undefined
        } as unknown as Team : null;
      }
      
      return data as unknown as Team | null;
    } catch (error) {
      console.error('Error fetching team:', error);
      return null;
    }
  },

  async createTeam(teamData: {
    team_name: string;
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    club_colors?: string;
    preferred_play_moments?: {
      days?: string[];
      timeslots?: string[];
      venues?: number[];
      notes?: string;
    };
  }): Promise<Team | null> {
    try {
      // Prepare insert data with only basic fields first
      const insertData: any = { 
        team_name: teamData.team_name
      };

      // Try to add new fields if they exist
      if (teamData.contact_person !== undefined) insertData.contact_person = teamData.contact_person;
      if (teamData.contact_phone !== undefined) insertData.contact_phone = teamData.contact_phone;
      if (teamData.contact_email !== undefined) insertData.contact_email = teamData.contact_email;
      if (teamData.club_colors !== undefined) insertData.club_colors = teamData.club_colors;
      if (teamData.preferred_play_moments !== undefined) insertData.preferred_play_moments = teamData.preferred_play_moments;

      const { data, error } = await supabase
        .from('teams')
        .insert(insertData)
        .select('team_id, team_name, contact_person, contact_phone, contact_email, club_colors, preferred_play_moments')
        .single();
      
      if (error) {
        // If new columns don't exist, fall back to basic insert
        console.warn('New team columns not found, falling back to basic insert:', error.message);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('teams')
          .insert({ 
            team_name: teamData.team_name
          })
          .select('team_id, team_name')
          .single();
        
        if (fallbackError) {
          console.error('Error creating team:', fallbackError);
          throw fallbackError;
        }
        
        // Map fallback data to Team interface with undefined new fields
        return fallbackData ? {
          ...fallbackData,
          contact_person: undefined,
          contact_phone: undefined,
          contact_email: undefined,
          club_colors: undefined,
          preferred_play_moments: undefined
        } as unknown as Team : null;
      }
      
      return data as unknown as Team | null;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  async updateTeam(teamId: number, teamData: {
    team_name?: string;
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    club_colors?: string;
    preferred_play_moments?: {
      days?: string[];
      timeslots?: string[];
      venues?: number[];
      notes?: string;
    };
  }): Promise<Team | null> {
    try {
      // Prepare update data with only basic fields first
      const updateData: any = {};

      // Add basic fields
      if (teamData.team_name !== undefined) updateData.team_name = teamData.team_name;

      // Try to add new fields if they exist
      if (teamData.contact_person !== undefined) updateData.contact_person = teamData.contact_person;
      if (teamData.contact_phone !== undefined) updateData.contact_phone = teamData.contact_phone;
      if (teamData.contact_email !== undefined) updateData.contact_email = teamData.contact_email;
      if (teamData.club_colors !== undefined) updateData.club_colors = teamData.club_colors;
      if (teamData.preferred_play_moments !== undefined) updateData.preferred_play_moments = teamData.preferred_play_moments;

      const { data, error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('team_id', teamId)
        .select('team_id, team_name, contact_person, contact_phone, contact_email, club_colors, preferred_play_moments')
        .single();
      
      if (error) {
        // If new columns don't exist, fall back to basic update
        console.warn('New team columns not found, falling back to basic update:', error.message);
        const basicUpdateData: any = {};
        if (teamData.team_name !== undefined) basicUpdateData.team_name = teamData.team_name;

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('teams')
          .update(basicUpdateData)
          .eq('team_id', teamId)
          .select('team_id, team_name')
          .single();
        
        if (fallbackError) {
          console.error('Error updating team:', fallbackError);
          throw fallbackError;
        }
        
        // Map fallback data to Team interface with undefined new fields
        return fallbackData ? {
          ...fallbackData,
          contact_person: undefined,
          contact_phone: undefined,
          contact_email: undefined,
          club_colors: undefined,
          preferred_play_moments: undefined
        } as unknown as Team : null;
      }
      
      return data as unknown as Team | null;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
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
