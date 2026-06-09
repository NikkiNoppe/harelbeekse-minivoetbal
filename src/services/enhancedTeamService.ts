import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import { fetchTeamForSession, fetchTeamsForSession } from "@/services/core/teamsSessionFetch";

export interface Team {
  team_id: number;
  team_name: string;
}

export interface TeamUser {
  user_id: number;
  username: string;
  email: string;
}

const logTeamOperation = (operation: string, data?: unknown, error?: unknown) => {
  if (operation.includes('ERROR') || operation.includes('FAILED')) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] TeamService ${operation}:`, { data, error });
  }
};

export const enhancedTeamService = {
  async getAllTeams(): Promise<Team[]> {
    try {
      const teams = await fetchTeamsForSession();
      return teams.map((t) => ({ team_id: t.team_id, team_name: t.team_name }));
    } catch (error) {
      logTeamOperation('getAllTeams - CATCH ERROR', { error });
      return [];
    }
  },

  async getTeamById(teamId: number): Promise<Team | null> {
    try {
      const team = await fetchTeamForSession(teamId);
      if (!team) return null;
      return { team_id: team.team_id, team_name: team.team_name };
    } catch (error) {
      logTeamOperation('getTeamById - CATCH ERROR', { error, teamId });
      return null;
    }
  },

  async createTeam(teamData: Omit<Team, 'team_id'>): Promise<{ success: boolean; message: string; team?: Team }> {
    try {
      const { data, error } = await supabase.rpc('insert_team_for_session', {
        ...getRpcSessionArgs(),
        p_team_data: teamData,
      });

      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const result = row as { team_id?: number; success?: boolean; message?: string };
      if (!result?.success || !result.team_id) {
        return { success: false, message: result?.message || 'Geen data geretourneerd bij aanmaken team' };
      }

      return {
        success: true,
        message: 'Team succesvol aangemaakt',
        team: { team_id: result.team_id, team_name: teamData.team_name },
      };
    } catch (error) {
      logTeamOperation('createTeam - CATCH ERROR', { error });
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Fout bij aanmaken team: ${errorMessage}` };
    }
  },

  async updateTeam(teamId: number, updateData: Partial<Omit<Team, 'team_id'>>): Promise<{ success: boolean; message: string; team?: Team }> {
    try {
      const existingTeam = await this.getTeamById(teamId);
      if (!existingTeam) {
        return { success: false, message: `Team met ID ${teamId} niet gevonden` };
      }

      const { data, error } = await supabase.rpc('update_team_for_session', {
        ...getRpcSessionArgs(),
        p_team_id: teamId,
        p_team_data: updateData,
      });

      if (error) {
        logTeamOperation('updateTeam - ERROR', { error, teamId });
        return { success: false, message: `Database fout bij bijwerken team: ${error.message}` };
      }

      const row = Array.isArray(data) ? data[0] : data;
      const result = row as { success?: boolean; message?: string };
      if (!result?.success) {
        return { success: false, message: result?.message || 'Update mislukt' };
      }

      const updated = await this.getTeamById(teamId);
      return { success: true, message: 'Team succesvol bijgewerkt', team: updated ?? existingTeam };
    } catch (error) {
      logTeamOperation('updateTeam - CATCH ERROR', { error, teamId });
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Onverwachte fout bij bijwerken team: ${errorMessage}` };
    }
  },

  async deleteTeam(teamId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('delete_team_for_session', {
        ...getRpcSessionArgs(),
        p_team_id: teamId,
      });

      if (error) {
        logTeamOperation('deleteTeam - ERROR', { error, teamId });
        return { success: false, message: `Fout bij verwijderen team: ${error.message}` };
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!(row as { success?: boolean })?.success) {
        return { success: false, message: (row as { message?: string })?.message || 'Verwijderen mislukt' };
      }

      return { success: true, message: 'Team succesvol verwijderd' };
    } catch (error) {
      logTeamOperation('deleteTeam - CATCH ERROR', { error, teamId });
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Fout bij verwijderen team: ${errorMessage}` };
    }
  },

  async getTeamUsers(teamId: number): Promise<TeamUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_users_for_admin', getRpcSessionArgs());
      if (error) throw error;

      const users = (data || []) as unknown as Array<{
        user_id: number;
        username: string;
        email?: string | null;
        team_users?: Array<{ team_id: number }>;
      }>;

      return users
        .filter((user) => user.team_users?.some((tu) => tu.team_id === teamId))
        .map((user) => ({
          user_id: user.user_id,
          username: user.username,
          email: user.email || '',
        }));
    } catch (error) {
      logTeamOperation('getTeamUsers - CATCH ERROR', { error, teamId });
      return [];
    }
  },

  async addUserToTeam(teamId: number, userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('manage_team_user_for_session', {
        ...getRpcSessionArgs(),
        p_operation: 'assign',
        p_user_id: userId,
        p_team_id: teamId,
      });

      if (error) {
        logTeamOperation('addUserToTeam - ERROR', { error, teamId, userId });
        return { success: false, message: `Fout bij toevoegen gebruiker aan team: ${error.message}` };
      }

      if (!(data as { success?: boolean })?.success) {
        return { success: false, message: (data as { error?: string })?.error || 'Toevoegen mislukt' };
      }

      return { success: true, message: 'Gebruiker succesvol toegevoegd aan team' };
    } catch (error) {
      logTeamOperation('addUserToTeam - CATCH ERROR', { error, teamId, userId });
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Fout bij toevoegen gebruiker aan team: ${errorMessage}` };
    }
  },

  async removeUserFromTeam(teamId: number, userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('manage_team_user_for_session', {
        ...getRpcSessionArgs(),
        p_operation: 'remove',
        p_user_id: userId,
      } as any);

      if (error) {
        logTeamOperation('removeUserFromTeam - ERROR', { error, teamId, userId });
        return { success: false, message: `Fout bij verwijderen gebruiker uit team: ${error.message}` };
      }

      if (!(data as { success?: boolean })?.success) {
        return { success: false, message: (data as { error?: string })?.error || 'Verwijderen mislukt' };
      }

      return { success: true, message: 'Gebruiker succesvol verwijderd uit team' };
    } catch (error) {
      logTeamOperation('removeUserFromTeam - CATCH ERROR', { error, teamId, userId });
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Fout bij verwijderen gebruiker uit team: ${errorMessage}` };
    }
  },
};
