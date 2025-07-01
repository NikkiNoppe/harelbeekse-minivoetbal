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

// Enhanced logging utility (production mode - only errors)
const logTeamOperation = (operation: string, data?: any, error?: any) => {
  // Only log errors in production
  if (operation.includes('ERROR') || operation.includes('FAILED')) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] TeamService ${operation}:`, { data, error });
  }
};



export const enhancedTeamService = {
  async getAllTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');

      if (error) {
        logTeamOperation('getAllTeams - ERROR', { error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logTeamOperation('getAllTeams - CATCH ERROR', { error });
      return [];
    }
  },

  async getTeamById(teamId: number): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();

      if (error) {
        logTeamOperation('getTeamById - ERROR', { error, teamId });
        throw error;
      }

      return data;
    } catch (error) {
      logTeamOperation('getTeamById - CATCH ERROR', { error, teamId });
      return null;
    }
  },

  async createTeam(teamData: Omit<Team, 'team_id'>): Promise<{ success: boolean; message: string; team?: Team }> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([teamData])
        .select('*')
        .single();

      if (error) {
        logTeamOperation('createTeam - ERROR', { error });
        throw error;
      }

      if (!data) {
        return { 
          success: false, 
          message: 'Geen data geretourneerd bij aanmaken team' 
        };
      }

      return { 
        success: true, 
        message: 'Team succesvol aangemaakt',
        team: data
      };
    } catch (error) {
      logTeamOperation('createTeam - CATCH ERROR', { error });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error);
      return { 
        success: false, 
        message: `Fout bij aanmaken team: ${errorMessage}` 
      };
    }
  },

  async updateTeam(teamId: number, updateData: Partial<Omit<Team, 'team_id'>>): Promise<{ success: boolean; message: string; team?: Team }> {
    try {
      // Verify team exists
      const existingTeam = await this.getTeamById(teamId);
      if (!existingTeam) {
        return { 
          success: false, 
          message: `Team met ID ${teamId} niet gevonden` 
        };
      }
      
      // Prepare update with proper data types
      const updateObject: any = {};
      if (updateData.team_name !== undefined) {
        updateObject.team_name = String(updateData.team_name).trim();
      }
      if (updateData.balance !== undefined) {
        updateObject.balance = Number(updateData.balance);
      }
      
      // Perform update
      const { data, error } = await supabase
        .from('teams')
        .update(updateObject)
        .eq('team_id', teamId)
        .select('*');

      if (error) {
        logTeamOperation('updateTeam - ERROR', { error, teamId });
        const errorMessage = error.message || 'Onbekende database fout';
        return { 
          success: false, 
          message: `Database fout bij bijwerken team: ${errorMessage}` 
        };
      }

      if (!data || data.length === 0) {
        return { 
          success: false, 
          message: 'Geen data geretourneerd bij bijwerken team' 
        };
      }

      return { 
        success: true, 
        message: 'Team succesvol bijgewerkt',
        team: data[0]
      };
      
    } catch (error) {
      logTeamOperation('updateTeam - CATCH ERROR', { error, teamId });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error);
      return { 
        success: false, 
        message: `Onverwachte fout bij bijwerken team: ${errorMessage}` 
      };
    }
  },

  async deleteTeam(teamId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', teamId);

      if (error) {
        logTeamOperation('deleteTeam - ERROR', { error, teamId });
        const errorMessage = error.message || JSON.stringify(error);
        return { 
          success: false, 
          message: `Fout bij verwijderen team: ${errorMessage}` 
        };
      }

      return { 
        success: true, 
        message: 'Team succesvol verwijderd' 
      };
    } catch (error) {
      logTeamOperation('deleteTeam - CATCH ERROR', { error, teamId });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error);
      return { 
        success: false, 
        message: `Fout bij verwijderen team: ${errorMessage}` 
      };
    }
  },

  async getTeamUsers(teamId: number): Promise<TeamUser[]> {
    try {
      const { data, error } = await supabase
        .from('team_users')
        .select(`
          user_id,
          users!inner(username, email)
        `)
        .eq('team_id', teamId);

      if (error) {
        logTeamOperation('getTeamUsers - ERROR', { error, teamId });
        throw error;
      }

      const mappedUsers = (data || []).map(item => ({
        user_id: item.user_id,
        username: item.users.username,
        email: item.users.email
      }));

      return mappedUsers;
    } catch (error) {
      logTeamOperation('getTeamUsers - CATCH ERROR', { error, teamId });
      return [];
    }
  },

  async addUserToTeam(teamId: number, userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('team_users')
        .insert([{ team_id: teamId, user_id: userId }]);

      if (error) {
        logTeamOperation('addUserToTeam - ERROR', { error, teamId, userId });
        const errorMessage = error.message || JSON.stringify(error);
        return { 
          success: false, 
          message: `Fout bij toevoegen gebruiker aan team: ${errorMessage}` 
        };
      }

      return { 
        success: true, 
        message: 'Gebruiker succesvol toegevoegd aan team' 
      };
    } catch (error) {
      logTeamOperation('addUserToTeam - CATCH ERROR', { error, teamId, userId });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error);
      return { 
        success: false, 
        message: `Fout bij toevoegen gebruiker aan team: ${errorMessage}` 
      };
    }
  },

  async removeUserFromTeam(teamId: number, userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('team_users')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) {
        logTeamOperation('removeUserFromTeam - ERROR', { error, teamId, userId });
        const errorMessage = error.message || JSON.stringify(error);
        return { 
          success: false, 
          message: `Fout bij verwijderen gebruiker uit team: ${errorMessage}` 
        };
      }

      return { 
        success: true, 
        message: 'Gebruiker succesvol verwijderd uit team' 
      };
    } catch (error) {
      logTeamOperation('removeUserFromTeam - CATCH ERROR', { error, teamId, userId });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error);
      return { 
        success: false, 
        message: `Fout bij verwijderen gebruiker uit team: ${errorMessage}` 
      };
    }
  }
};
