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
        .select('*')
        .single();

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
    logTeamOperation('updateTeam - START', { teamId, updateData });
    
    try {
      // FASE 1: Pre-update existence and data verification
      const existingTeam = await this.getTeamById(teamId);
      if (!existingTeam) {
        logTeamOperation('updateTeam - TEAM NOT FOUND', { teamId });
        return { 
          success: false, 
          message: `Team met ID ${teamId} niet gevonden` 
        };
      }
      
      logTeamOperation('updateTeam - EXISTING TEAM DATA', { existingTeam });
      
      // FASE 2: Prepare update with proper data types
      const updateObject: any = {};
      if (updateData.team_name !== undefined) {
        updateObject.team_name = String(updateData.team_name).trim();
      }
      // Balance wordt automatisch berekend door database triggers, dus niet handmatig updaten
      if (updateData.balance !== undefined) {
        logTeamOperation('updateTeam - WARNING: Balance update ignored - automatically calculated by triggers', { balance: updateData.balance });
      }
      
      logTeamOperation('updateTeam - PREPARED UPDATE OBJECT', { updateObject });
      
      // FASE 3: Perform update with enhanced error detection
      const { data, error, count } = await supabase
        .from('teams')
        .update(updateObject)
        .eq('team_id', teamId)
        .select('*');

      logTeamOperation('updateTeam - RAW UPDATE RESULT', { 
        data, 
        error, 
        count,
        hasData: !!data,
        dataLength: data?.length || 0
      });

      if (error) {
        logTeamOperation('updateTeam - UPDATE ERROR DETECTED', { 
          error,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details
        });
        
        const errorMessage = error.message || 'Onbekende database fout';
        return { 
          success: false, 
          message: `Database fout bij bijwerken team: ${errorMessage}` 
        };
      }

      // FASE 4: Post-update verification (alleen voor team_name, balance wordt automatisch berekend)
      const verificationTeam = await this.getTeamById(teamId);
      logTeamOperation('updateTeam - POST-UPDATE VERIFICATION', { 
        verificationTeam,
        updateWasApplied: verificationTeam && 
          (updateData.team_name ? verificationTeam.team_name === updateObject.team_name : true)
      });

      if (!verificationTeam) {
        logTeamOperation('updateTeam - VERIFICATION FAILED - TEAM NOT FOUND');
        return { 
          success: false, 
          message: 'Update mislukt: Team niet meer gevonden na update' 
        };
      }

      // Check if team name changes were actually applied (balance wordt automatisch berekend door triggers)
      const changesApplied = 
        (updateData.team_name ? verificationTeam.team_name === updateObject.team_name : true);

      if (!changesApplied) {
        logTeamOperation('updateTeam - VERIFICATION FAILED - CHANGES NOT APPLIED', {
          expected: updateObject,
          actual: verificationTeam
        });
        return { 
          success: false, 
          message: 'Update mislukt: Teamnaam wijzigingen zijn niet doorgevoerd in de database' 
        };
      }

      logTeamOperation('updateTeam - SUCCESS WITH VERIFICATION', { 
        teamId, 
        updatedTeam: verificationTeam 
      });
      
      return { 
        success: true, 
        message: 'Team succesvol bijgewerkt',
        team: verificationTeam
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
    logTeamOperation('deleteTeam - START', { teamId });
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', teamId);

      logTeamOperation('deleteTeam - DELETE RESULT', { error, teamId });

      if (error) {
        logTeamOperation('deleteTeam - DELETE ERROR', { error, teamId });
        const errorMessage = error.message || JSON.stringify(error);
        return { 
          success: false, 
          message: `Fout bij verwijderen team: ${errorMessage}` 
        };
      }

      logTeamOperation('deleteTeam - SUCCESS', { teamId });
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
      const { error } = await supabase
        .from('team_users')
        .insert([{ team_id: teamId, user_id: userId }]);

      logTeamOperation('addUserToTeam - QUERY RESULT', { error, teamId, userId });

      if (error) {
        logTeamOperation('addUserToTeam - ERROR', { error, teamId, userId });
        const errorMessage = error.message || JSON.stringify(error);
        return { 
          success: false, 
          message: `Fout bij toevoegen gebruiker aan team: ${errorMessage}` 
        };
      }

      logTeamOperation('addUserToTeam - SUCCESS', { teamId, userId });
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
    logTeamOperation('removeUserFromTeam - START', { teamId, userId });
    try {
      const { error } = await supabase
        .from('team_users')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      logTeamOperation('removeUserFromTeam - QUERY RESULT', { error, teamId, userId });

      if (error) {
        logTeamOperation('removeUserFromTeam - ERROR', { error, teamId, userId });
        const errorMessage = error.message || JSON.stringify(error);
        return { 
          success: false, 
          message: `Fout bij verwijderen gebruiker uit team: ${errorMessage}` 
        };
      }

      logTeamOperation('removeUserFromTeam - SUCCESS', { teamId, userId });
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
