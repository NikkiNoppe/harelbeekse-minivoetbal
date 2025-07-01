import { supabase } from "@/integrations/supabase/client";
import { MatchFormData } from "@/components/team/match-form/types";
import { PlayerSelection } from "@/components/team/match-form/components/types";

// Enhanced logging utility
const logMatchOperation = (operation: string, data?: any, error?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] MatchService ${operation}:`, { data, error });
};

export const enhancedMatchService = {
  async updateMatch(matchId: number, updateData: Partial<MatchFormData>): Promise<{ success: boolean; message: string }> {
    logMatchOperation('updateMatch - START', { matchId, updateData });
    
    try {
      // Prepare the update object with proper validation
      const updateObject: any = {};
      
      if (updateData.homeScore !== undefined) {
        updateObject.home_score = updateData.homeScore;
        logMatchOperation('updateMatch - Adding home_score', { value: updateData.homeScore });
      }
      
      if (updateData.awayScore !== undefined) {
        updateObject.away_score = updateData.awayScore;
        logMatchOperation('updateMatch - Adding away_score', { value: updateData.awayScore });
      }
      
      if (updateData.referee !== undefined) {
        updateObject.referee = updateData.referee;
        logMatchOperation('updateMatch - Adding referee', { value: updateData.referee });
      }
      
      if (updateData.refereeNotes !== undefined) {
        updateObject.referee_notes = updateData.refereeNotes;
        logMatchOperation('updateMatch - Adding referee_notes', { value: updateData.refereeNotes });
      }
      
      if (updateData.matchday !== undefined) {
        updateObject.speeldag = updateData.matchday;
        logMatchOperation('updateMatch - Adding speeldag', { value: updateData.matchday });
      }
      
      if (updateData.location !== undefined) {
        updateObject.location = updateData.location;
        logMatchOperation('updateMatch - Adding location', { value: updateData.location });
      }
      
      if (updateData.date !== undefined && updateData.time !== undefined) {
        // Combine date and time into match_date timestamp
        const matchDateTime = new Date(`${updateData.date}T${updateData.time}`);
        updateObject.match_date = matchDateTime.toISOString();
        logMatchOperation('updateMatch - Adding match_date', { value: matchDateTime.toISOString() });
      }
      
      if (updateData.homePlayers !== undefined) {
        updateObject.home_players = updateData.homePlayers;
        logMatchOperation('updateMatch - Adding home_players', { count: updateData.homePlayers?.length });
      }
      
      if (updateData.awayPlayers !== undefined) {
        updateObject.away_players = updateData.awayPlayers;
        logMatchOperation('updateMatch - Adding away_players', { count: updateData.awayPlayers?.length });
      }
      
      if (updateData.isCompleted !== undefined) {
        updateObject.is_submitted = updateData.isCompleted;
        logMatchOperation('updateMatch - Adding is_submitted', { value: updateData.isCompleted });
      }
      
      if (updateData.isLocked !== undefined) {
        updateObject.is_locked = updateData.isLocked;
        logMatchOperation('updateMatch - Adding is_locked', { value: updateData.isLocked });
      }

      // Always update the updated_at timestamp
      updateObject.updated_at = new Date().toISOString();
      
      logMatchOperation('updateMatch - Final update object', { updateObject });

      // SIMPLIFIED: Follow user service pattern - just update without complex .select() chains
      const { error } = await supabase
        .from('matches')
        .update(updateObject)
        .eq('match_id', matchId);

      logMatchOperation('updateMatch - UPDATE RESULT', { error, matchId });

      if (error) {
        logMatchOperation('updateMatch - UPDATE ERROR', { error, matchId });
        const errorMessage = error.message || JSON.stringify(error);
        return { 
          success: false, 
          message: `Fout bij bijwerken wedstrijd: ${errorMessage}` 
        };
      }

      logMatchOperation('updateMatch - SUCCESS', { 
        matchId, 
        fieldsUpdated: Object.keys(updateObject)
      });
      
      return { success: true, message: 'Wedstrijd succesvol bijgewerkt' };
    } catch (error) {
      logMatchOperation('updateMatch - CATCH ERROR', { error, matchId });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error);
      return { 
        success: false, 
        message: `Fout bij bijwerken wedstrijd: ${errorMessage}` 
      };
    }
  },

  async getMatch(matchId: number): Promise<MatchFormData | null> {
    logMatchOperation('getMatch - START', { matchId });
    
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(team_id, team_name),
          away_team:teams!matches_away_team_id_fkey(team_id, team_name)
        `)
        .eq('match_id', matchId)
        .maybeSingle();

      logMatchOperation('getMatch - QUERY RESULT', { data, error, matchId });

      if (error) {
        logMatchOperation('getMatch - ERROR', { error, matchId });
        throw error;
      }

      if (!data) {
        logMatchOperation('getMatch - NO MATCH FOUND', { matchId });
        return null;
      }

      // Parse the match_date timestamp to separate date and time
      const matchDate = new Date(data.match_date);
      const dateStr = matchDate.toISOString().split('T')[0];
      const timeStr = matchDate.toTimeString().split(' ')[0].substring(0, 5);

      // Safely parse players arrays from JSONB
      const parsePlayersArray = (playersData: any): PlayerSelection[] => {
        if (!playersData) return [];
        if (Array.isArray(playersData)) return playersData as PlayerSelection[];
        if (typeof playersData === 'string') {
          try {
            return JSON.parse(playersData) as PlayerSelection[];
          } catch {
            return [];
          }
        }
        return [];
      };

      const matchData: MatchFormData = {
        matchId: data.match_id,
        homeTeamId: data.home_team_id,
        awayTeamId: data.away_team_id,
        homeTeamName: data.home_team?.team_name || 'Onbekend',
        awayTeamName: data.away_team?.team_name || 'Onbekend',
        date: dateStr,
        time: timeStr,
        location: data.location,
        matchday: data.speeldag || '',
        uniqueNumber: data.unique_number,
        homeScore: data.home_score,
        awayScore: data.away_score,
        referee: data.referee,
        refereeNotes: data.referee_notes,
        homePlayers: parsePlayersArray(data.home_players),
        awayPlayers: parsePlayersArray(data.away_players),
        isCompleted: data.is_submitted || false,
        isLocked: data.is_locked || false
      };

      logMatchOperation('getMatch - SUCCESS', { 
        matchId, 
        matchData: {
          ...matchData,
          homePlayers: `${matchData.homePlayers?.length || 0} players`,
          awayPlayers: `${matchData.awayPlayers?.length || 0} players`
        }
      });

      return matchData;
    } catch (error) {
      logMatchOperation('getMatch - CATCH ERROR', { error, matchId });
      return null;
    }
  },

  async lockMatch(matchId: number): Promise<{ success: boolean; message: string }> {
    logMatchOperation('lockMatch - START', { matchId });
    
    try {
      const { error } = await supabase
        .from('matches')
        .update({ 
          is_locked: true,
          updated_at: new Date().toISOString()
        })
        .eq('match_id', matchId);

      logMatchOperation('lockMatch - UPDATE RESULT', { error, matchId });

      if (error) {
        logMatchOperation('lockMatch - ERROR', { error, matchId });
        const errorMessage = error.message || JSON.stringify(error);
        return { 
          success: false, 
          message: `Fout bij vergrendelen wedstrijd: ${errorMessage}` 
        };
      }

      logMatchOperation('lockMatch - SUCCESS', { matchId });
      return { success: true, message: 'Wedstrijd succesvol vergrendeld' };
    } catch (error) {
      logMatchOperation('lockMatch - CATCH ERROR', { error, matchId });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error);
      return { 
        success: false, 
        message: `Fout bij vergrendelen wedstrijd: ${errorMessage}` 
      };
    }
  },

  async unlockMatch(matchId: number): Promise<{ success: boolean; message: string }> {
    logMatchOperation('unlockMatch - START', { matchId });
    
    try {
      const { error } = await supabase
        .from('matches')
        .update({ 
          is_locked: false,
          updated_at: new Date().toISOString()
        })
        .eq('match_id', matchId);

      logMatchOperation('unlockMatch - UPDATE RESULT', { error, matchId });

      if (error) {
        logMatchOperation('unlockMatch - ERROR', { error, matchId });
        const errorMessage = error.message || JSON.stringify(error);
        return { 
          success: false, 
          message: `Fout bij ontgrendelen wedstrijd: ${errorMessage}` 
        };
      }

      logMatchOperation('unlockMatch - SUCCESS', { matchId });
      return { success: true, message: 'Wedstrijd succesvol ontgrendeld' };
    } catch (error) {
      logMatchOperation('unlockMatch - CATCH ERROR', { error, matchId });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error);
      return { 
        success: false, 
        message: `Fout bij ontgrendelen wedstrijd: ${errorMessage}` 
      };
    }
  }
};
