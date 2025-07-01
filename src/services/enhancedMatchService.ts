import { supabase } from "@/integrations/supabase/client";
import { MatchFormData } from "@/components/team/match-form/types";
import { PlayerSelection } from "@/components/team/match-form/components/types";
import { localDateTimeToISO, isoToLocalDateTime, getCurrentISO } from "@/lib/dateUtils";

// Enhanced logging utility
const logMatchOperation = (operation: string, data?: any, error?: any) => {
  const timestamp = getCurrentISO();
  console.log(`[${timestamp}] MatchService ${operation}:`, { data, error });
};

export const enhancedMatchService = {
  async updateMatch(matchId: number, updateData: Partial<MatchFormData>): Promise<{ success: boolean; message: string }> {
    logMatchOperation('updateMatch - START', { matchId, updateData });
    
    try {
      // FASE 1: Pre-update existence verification
      const existingMatch = await this.getMatch(matchId);
      if (!existingMatch) {
        logMatchOperation('updateMatch - MATCH NOT FOUND', { matchId });
        return { 
          success: false, 
          message: `Wedstrijd met ID ${matchId} niet gevonden` 
        };
      }
      
      logMatchOperation('updateMatch - EXISTING MATCH DATA', { 
        matchId: existingMatch.matchId,
        homeTeam: existingMatch.homeTeamName,
        awayTeam: existingMatch.awayTeamName,
        currentScores: `${existingMatch.homeScore} - ${existingMatch.awayScore}`
      });
      
      // FASE 2: Prepare the update object with proper validation and type conversion
      const updateObject: any = {};
      
      if (updateData.homeScore !== undefined) {
        updateObject.home_score = Number(updateData.homeScore);
      }
      
      if (updateData.awayScore !== undefined) {
        updateObject.away_score = Number(updateData.awayScore);
      }
      
      if (updateData.referee !== undefined) {
        updateObject.referee = String(updateData.referee);
      }
      
      if (updateData.refereeNotes !== undefined) {
        updateObject.referee_notes = String(updateData.refereeNotes);
      }
      
      if (updateData.matchday !== undefined) {
        updateObject.speeldag = String(updateData.matchday);
      }
      
      if (updateData.location !== undefined) {
        updateObject.location = String(updateData.location);
      }
      
      if (updateData.date !== undefined && updateData.time !== undefined) {
        updateObject.match_date = localDateTimeToISO(updateData.date, updateData.time);
      }
      
      if (updateData.homePlayers !== undefined) {
        updateObject.home_players = updateData.homePlayers;
      }
      
      if (updateData.awayPlayers !== undefined) {
        updateObject.away_players = updateData.awayPlayers;
      }
      
      if (updateData.isCompleted !== undefined) {
        updateObject.is_submitted = Boolean(updateData.isCompleted);
      }
      
      if (updateData.isLocked !== undefined) {
        updateObject.is_locked = Boolean(updateData.isLocked);
      }

      // Always update the updated_at timestamp
      updateObject.updated_at = getCurrentISO();

      // Verwijder alle undefined of lege string velden uit het updateObject
      Object.keys(updateObject).forEach(
        (key) => (updateObject[key] === undefined || updateObject[key] === "") && delete updateObject[key]
      );

      logMatchOperation('updateMatch - FILTERED UPDATE OBJECT', { 
        updateObject: JSON.stringify(updateObject),
        keys: Object.keys(updateObject),
        hasEmptyStrings: Object.values(updateObject).some(val => val === ""),
        hasUndefined: Object.values(updateObject).some(val => val === undefined),
        values: Object.entries(updateObject).map(([key, value]) => `${key}: ${typeof value} = ${JSON.stringify(value)}`)
      });

      // FASE 3: Perform update with enhanced error detection
      const { data, error, count } = await supabase
        .from('matches')
        .update(updateObject)
        .eq('match_id', matchId)
        .select('*');

      logMatchOperation('updateMatch - RAW UPDATE RESULT', { 
        data, 
        error, 
        count,
        hasData: !!data,
        dataLength: data?.length || 0
      });

      if (error) {
        logMatchOperation('updateMatch - UPDATE ERROR DETECTED', { 
          error: JSON.stringify(error),
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          updateObject: JSON.stringify(updateObject)
        });
        
        const errorMessage = error.message || 'Onbekende database fout';
        return { 
          success: false, 
          message: `Database fout bij bijwerken wedstrijd: ${errorMessage}` 
        };
      }

      // FASE 4: Post-update verification
      const verificationMatch = await this.getMatch(matchId);
      logMatchOperation('updateMatch - POST-UPDATE VERIFICATION', { 
        verificationMatch: verificationMatch ? {
          matchId: verificationMatch.matchId,
          homeScore: verificationMatch.homeScore,
          awayScore: verificationMatch.awayScore,
          referee: verificationMatch.referee,
          isCompleted: verificationMatch.isCompleted,
          isLocked: verificationMatch.isLocked
        } : null
      });

      if (!verificationMatch) {
        logMatchOperation('updateMatch - VERIFICATION FAILED - MATCH NOT FOUND');
        return { 
          success: false, 
          message: 'Update mislukt: Wedstrijd niet meer gevonden na update' 
        };
      }

      // Check if key changes were actually applied
      const changesApplied = 
        (updateData.homeScore !== undefined ? verificationMatch.homeScore === updateObject.home_score : true) &&
        (updateData.awayScore !== undefined ? verificationMatch.awayScore === updateObject.away_score : true) &&
        (updateData.referee !== undefined ? verificationMatch.referee === updateObject.referee : true) &&
        (updateData.isCompleted !== undefined ? verificationMatch.isCompleted === updateObject.is_submitted : true) &&
        (updateData.isLocked !== undefined ? verificationMatch.isLocked === updateObject.is_locked : true);

      if (!changesApplied) {
        logMatchOperation('updateMatch - VERIFICATION FAILED - CHANGES NOT APPLIED', {
          expected: {
            homeScore: updateObject.home_score,
            awayScore: updateObject.away_score,
            referee: updateObject.referee,
            isCompleted: updateObject.is_submitted,
            isLocked: updateObject.is_locked
          },
          actual: {
            homeScore: verificationMatch.homeScore,
            awayScore: verificationMatch.awayScore,
            referee: verificationMatch.referee,
            isCompleted: verificationMatch.isCompleted,
            isLocked: verificationMatch.isLocked
          }
        });
        return { 
          success: false, 
          message: 'Update mislukt: Wijzigingen zijn niet doorgevoerd in de database' 
        };
      }

      logMatchOperation('updateMatch - SUCCESS WITH VERIFICATION', { 
        matchId, 
        fieldsUpdated: Object.keys(updateObject),
        verificationPassed: true
      });
      
      return { success: true, message: 'Wedstrijd succesvol bijgewerkt' };
      
    } catch (error) {
      logMatchOperation('updateMatch - CATCH ERROR', { error, matchId });
      const errorMessage = error instanceof Error ? error.message : 
                          typeof error === 'object' ? JSON.stringify(error) : 
                          String(error);
      return { 
        success: false, 
        message: `Onverwachte fout bij bijwerken wedstrijd: ${errorMessage}` 
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
      const { date: dateStr, time: timeStr } = isoToLocalDateTime(data.match_date);

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
          updated_at: getCurrentISO()
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
          updated_at: getCurrentISO()
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
