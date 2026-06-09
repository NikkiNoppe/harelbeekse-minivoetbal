
import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import { fetchPublicTeams } from "@/services/public/publicScheduleFetch";
import { fetchTeamForSession, fetchTeamsForSession } from "@/services/core/teamsSessionFetch";

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
  // Public-safe method - only returns basic team info (id and name only)
  async getPublicTeams(): Promise<Pick<Team, 'team_id' | 'team_name'>[]> {
    try {
      const teams = await fetchPublicTeams();
      return teams.map((t) => ({
        team_id: t.team_id,
        team_name: t.team_name,
      }));
    } catch (error) {
      console.error('Error fetching public teams:', error);
      throw error;
    }
  },

  /** team_id → team_name map voor publieke pagina's (competitie, playoff, beker). */
  async getPublicTeamMap(): Promise<Map<number, string>> {
    const teams = await teamService.getPublicTeams();
    return new Map(teams.map((t) => [t.team_id, t.team_name]));
  },

  // Full method for authenticated users - includes all team data including contact info
  async getAllTeams(): Promise<Team[]> {
    try {
      return await fetchTeamsForSession();
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  async getTeamById(teamId: number): Promise<Team | null> {
    try {
      return await fetchTeamForSession(teamId);
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

      const { data, error } = await supabase.rpc('insert_team_for_session', {
        ...getRpcSessionArgs(),
        p_team_data: insertData,
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.success || !result?.team_id) {
        throw new Error(result?.message || 'Kon team niet aanmaken');
      }

      return (await fetchTeamForSession(result.team_id)) ?? {
        team_id: result.team_id,
        team_name: teamData.team_name,
        ...teamData,
      } as Team;
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
      const updateData: Record<string, unknown> = {};
      if (teamData.team_name !== undefined) updateData.team_name = teamData.team_name;
      if (teamData.contact_person !== undefined) updateData.contact_person = teamData.contact_person;
      if (teamData.contact_phone !== undefined) updateData.contact_phone = teamData.contact_phone;
      if (teamData.contact_email !== undefined) updateData.contact_email = teamData.contact_email;
      if (teamData.club_colors !== undefined) updateData.club_colors = teamData.club_colors;
      if (teamData.preferred_play_moments !== undefined) {
        updateData.preferred_play_moments = teamData.preferred_play_moments;
      }

      const { data, error } = await supabase.rpc('update_team_for_session', {
        ...getRpcSessionArgs(),
        p_team_id: teamId,
        p_team_data: updateData,
      });

      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.success) {
        throw new Error(result?.message || 'Kon team niet bijwerken');
      }

      return (await fetchTeamForSession(teamId)) ?? {
        team_id: teamId,
        team_name: teamData.team_name || '',
        ...teamData,
      } as Team;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  async deleteTeam(teamId: number): Promise<boolean> {
    const { data, error } = await supabase.rpc('delete_team_for_session', {
      ...getRpcSessionArgs(),
      p_team_id: teamId,
    });

    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.success) {
      throw new Error(result?.message || 'Kon team niet verwijderen');
    }

    return true;
  }
};
