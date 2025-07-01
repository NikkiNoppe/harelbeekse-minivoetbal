import { supabase } from "@/integrations/supabase/client";

export interface Team {
  team_id: number;
  team_name: string;
  balance: number;
}

export interface TeamUser {
  user_id: number;
  username: string;
  email: string;
}

// Enhanced logging utility
const logTeamOperation = (operation: string, data?: any, error?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] TeamService ${operation}:`, { data, error });
};

export const enhancedTeamService = {
  async getAllTeams(): Promise<Team[]> {
    logTeamOperation('getAllTeams - START');
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');

      logTeamOperation('getAllTeams - QUERY RESULT', { data, error });

      if (error) {
        logTeamOperation('getAllTeams - ERROR', { error });
        throw error;
      }

      logTeamOperation('getAllTeams - SUCCESS', { count: data?.length || 0 });
      return data || [];
    } catch (error) {
      logTeamOperation('getAllTeams - CATCH ERROR', { error });
      return [];
    }
  },

  async getTeamById(teamId: number): Promise<Team | null> {
    logTeamOperation('getTeamById - START', { teamId });
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();

      logTeamOperation('getTeamById - QUERY RESULT', { data, error, teamId });

      if (error) {
        logTeamOperation('getTeamById - ERROR', { error, teamId });
        throw error;
      }

      logTeamOperation('getTeamById - SUCCESS', { teamId, found: !!data });
      return data;
    } catch (error) {
      logTeamOperation('getTeamById - CATCH ERROR', { error, teamId });
      return null;
    }
  },

  async createTeam(teamData: Omit<Team, 'team_id'>): Promise<{ success: boolean; message: string; team?: Team }> {
    logTeamOperation('createTeam - START', { teamData });
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([teamData])
        .select()
        .maybeSingle();

      logTeamOperation('createTeam - QUERY RESULT', { data, error });

      if (error) {
        logTeamOperation('createTeam - ERROR', { error });
        throw error;
      }

      if (!data) {
        logTeamOperation('createTeam - NO DATA RETURNED');
        return { 
          success: false, 
          message: 'Geen data geretourneerd bij aanmaken team' 
        };
      }

      logTeamOperation('createTeam - SUCCESS', { createdTeam: data });
      return { 
        success: true, 
        message: 'Team succesvol aangemaakt',
        team: data
      };
    } catch (error) {
      logTeamOperation('createTeam - CATCH ERROR', { error });
      return { 
        success: false, 
        message: `Fout bij aanmaken team: ${error instanceof Error ? error.message : error}` 
      };
    }
  },

  async updateTeam(teamId: number, updateData: Partial<Omit<Team, 'team_id'>>): Promise<{ success: boolean; message: string; team?: Team }> {
    logTeamOperation('updateTeam - START', { teamId, updateData });
    try {
      // FIRST: Check if team exists using the exact same pattern as match service
      logTeamOperation('updateTeam - Checking if team exists', { teamId });
      const { data: existingTeam, error: checkError } = await supabase
        .from('teams')
        .select('team_id, team_name, balance')
        .eq('team_id', teamId)
        .maybeSingle();

      logTeamOperation('updateTeam - Existence check result', { existingTeam, checkError, teamId });

      if (checkError) {
        logTeamOperation('updateTeam - Existence check ERROR', { checkError, teamId });
        throw checkError;
      }

      if (!existingTeam) {
        logTeamOperation('updateTeam - TEAM NOT FOUND', { teamId });
        return { 
          success: false, 
          message: `Team met ID ${teamId} niet gevonden in database` 
        };
      }

      logTeamOperation('updateTeam - Team exists, proceeding with update', { teamId, existingTeam });

      // PERFORM THE UPDATE with consistent query pattern
      const { data, error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('team_id', teamId)
        .select()
        .maybeSingle();

      logTeamOperation('updateTeam - UPDATE QUERY RESULT', { data, error, teamId });

      if (error) {
        logTeamOperation('updateTeam - UPDATE ERROR', { error, teamId });
        throw error;
      }

      if (!data) {
        logTeamOperation('updateTeam - NO DATA RETURNED AFTER UPDATE', { teamId });
        return { 
          success: false, 
          message: `Update uitgevoerd maar geen data geretourneerd voor team ${teamId}` 
        };
      }

      logTeamOperation('updateTeam - SUCCESS', { teamId, updatedTeam: data });
      return { 
        success: true, 
        message: 'Team succesvol bijgewerkt',
        team: data
      };
    } catch (error) {
      logTeamOperation('updateTeam - CATCH ERROR', { error, teamId });
      return { 
        success: false, 
        message: `Fout bij bijwerken team: ${error instanceof Error ? error.message : error}` 
      };
    }
  },

  async deleteTeam(teamId: number): Promise<{ success: boolean; message: string }> {
    logTeamOperation('deleteTeam - START', { teamId });
    try {
      // Check if team exists first with the same pattern
      logTeamOperation('deleteTeam - Checking if team exists', { teamId });
      const { data: existingTeam, error: checkError } = await supabase
        .from('teams')
        .select('team_id')
        .eq('team_id', teamId)
        .maybeSingle();

      logTeamOperation('deleteTeam - Existence check result', { existingTeam, checkError, teamId });

      if (checkError) {
        logTeamOperation('deleteTeam - Existence check ERROR', { checkError, teamId });
        throw checkError;
      }

      if (!existingTeam) {
        logTeamOperation('deleteTeam - TEAM NOT FOUND', { teamId });
        return { 
          success: false, 
          message: `Team met ID ${teamId} niet gevonden in database` 
        };
      }

      const { data, error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', teamId)
        .select();

      logTeamOperation('deleteTeam - DELETE QUERY RESULT', { data, error, teamId });

      if (error) {
        logTeamOperation('deleteTeam - DELETE ERROR', { error, teamId });
        throw error;
      }

      logTeamOperation('deleteTeam - SUCCESS', { teamId, deletedData: data });
      return { 
        success: true, 
        message: 'Team succesvol verwijderd' 
      };
    } catch (error) {
      logTeamOperation('deleteTeam - CATCH ERROR', { error, teamId });
      return { 
        success: false, 
        message: `Fout bij verwijderen team: ${error instanceof Error ? error.message : error}` 
      };
    }
  },

  async getTeamUsers(teamId: number): Promise<TeamUser[]> {
    logTeamOperation('getTeamUsers - START', { teamId });
    try {
      const { data, error } = await supabase
        .from('team_users')
        .select(`
          user_id,
          users!inner(username, email)
        `)
        .eq('team_id', teamId);

      logTeamOperation('getTeamUsers - QUERY RESULT', { data, error, teamId });

      if (error) {
        logTeamOperation('getTeamUsers - ERROR', { error, teamId });
        throw error;
      }

      const mappedUsers = (data || []).map(item => ({
        user_id: item.user_id,
        username: item.users.username,
        email: item.users.email
      }));

      logTeamOperation('getTeamUsers - SUCCESS', { teamId, count: mappedUsers.length });
      return mappedUsers;
    } catch (error) {
      logTeamOperation('getTeamUsers - CATCH ERROR', { error, teamId });
      return [];
    }
  },

  async addUserToTeam(teamId: number, userId: number): Promise<{ success: boolean; message: string }> {
    logTeamOperation('addUserToTeam - START', { teamId, userId });
    try {
      const { data, error } = await supabase
        .from('team_users')
        .insert([{ team_id: teamId, user_id: userId }])
        .select();

      logTeamOperation('addUserToTeam - QUERY RESULT', { data, error, teamId, userId });

      if (error) {
        logTeamOperation('addUserToTeam - ERROR', { error, teamId, userId });
        throw error;
      }

      logTeamOperation('addUserToTeam - SUCCESS', { teamId, userId, insertedData: data });
      return { 
        success: true, 
        message: 'Gebruiker succesvol toegevoegd aan team' 
      };
    } catch (error) {
      logTeamOperation('addUserToTeam - CATCH ERROR', { error, teamId, userId });
      return { 
        success: false, 
        message: `Fout bij toevoegen gebruiker aan team: ${error instanceof Error ? error.message : error}` 
      };
    }
  },

  async removeUserFromTeam(teamId: number, userId: number): Promise<{ success: boolean; message: string }> {
    logTeamOperation('removeUserFromTeam - START', { teamId, userId });
    try {
      const { data, error } = await supabase
        .from('team_users')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .select();

      logTeamOperation('removeUserFromTeam - QUERY RESULT', { data, error, teamId, userId });

      if (error) {
        logTeamOperation('removeUserFromTeam - ERROR', { error, teamId, userId });
        throw error;
      }

      logTeamOperation('removeUserFromTeam - SUCCESS', { teamId, userId, deletedData: data });
      return { 
        success: true, 
        message: 'Gebruiker succesvol verwijderd uit team' 
      };
    } catch (error) {
      logTeamOperation('removeUserFromTeam - CATCH ERROR', { error, teamId, userId });
      return { 
        success: false, 
        message: `Fout bij verwijderen gebruiker uit team: ${error instanceof Error ? error.message : error}` 
      };
    }
  }
};
