import { supabase } from "@/integrations/supabase/client";
import { localDateTimeToISO, isoToLocalDateTime } from "@/lib/dateUtils";
import { updateMatchForm } from "@/components/pages/admin/matches/services/matchesFormService";
import { MatchFormData } from "@/components/pages/admin/matches/types";
import { scheduleBackgroundSideEffects } from "@/services/match/backgroundSideEffects";
import { withUserContext } from "@/lib/supabaseUtils";

interface MatchUpdateData {
  homeScore?: number | null;
  awayScore?: number | null;
  referee?: string;
  refereeNotes?: string;
  matchday?: string;
  location?: string;
  date?: string;
  time?: string;
  homePlayers?: any[];
  awayPlayers?: any[];
  isCompleted?: boolean;
  isLocked?: boolean;
}

interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const enhancedMatchService = {
  async updateMatch(matchId: number, updateData: MatchUpdateData, isAdmin: boolean = false, userRole?: string): Promise<ServiceResponse> {
    console.log('🟢 [enhancedMatchService] Starting updateMatch');
    console.log('🟢 [enhancedMatchService] Match ID:', matchId);
    console.log('🟢 [enhancedMatchService] Is Admin:', isAdmin);
    console.log('🟢 [enhancedMatchService] User Role:', userRole);
    console.log('🟢 [enhancedMatchService] Update Data:', JSON.stringify(updateData, null, 2));

    if (!matchId || isNaN(matchId)) {
      return {
        success: false,
        message: "Ongeldige wedstrijd ID"
      };
    }

    try {
      console.log('🟢 [enhancedMatchService] Fetching match info...');
      // Check if this might be a cup match that could use automatic advancement
      // For cup matches, we want to use the updateMatchForm that has auto-advance logic
      const { data: matchInfo, error: fetchError } = await supabase
        .from('matches')
        .select('is_cup_match, unique_number, home_team_id, away_team_id, match_date, speeldag, location, teams_home:teams!home_team_id(team_name), teams_away:teams!away_team_id(team_name)')
        .eq('match_id', matchId)
        .single();

      if (fetchError) {
        console.error('❌ [enhancedMatchService] Error fetching match info:', fetchError);
        // Continue with regular update if we can't fetch match info
      } else {
        console.log('✅ [enhancedMatchService] Match info fetched, is_cup_match:', matchInfo?.is_cup_match);
      }

      const isCupMatch = matchInfo?.is_cup_match;

      // For cup matches with scores (new completions or score changes), use the matchFormService with auto-advance
      if (isCupMatch && updateData.isCompleted && updateData.homeScore != null && updateData.awayScore != null) {
        console.log('🟢 [enhancedMatchService] This is a completed cup match with scores, using updateMatchForm');
        try {
          // Convert to MatchFormData format
          const { date: matchDate, time: matchTime } = isoToLocalDateTime(matchInfo.match_date);
          
          const matchFormData: MatchFormData = {
            matchId: matchId,
            uniqueNumber: matchInfo.unique_number || '',
            date: updateData.date || matchDate,
            time: updateData.time || matchTime,
            homeTeamId: matchInfo.home_team_id,
            homeTeamName: matchInfo.teams_home?.team_name || 'Onbekend',
            awayTeamId: matchInfo.away_team_id,
            awayTeamName: matchInfo.teams_away?.team_name || 'Onbekend',
            location: updateData.location || matchInfo.location || '',
            matchday: updateData.matchday || matchInfo.speeldag || '',
            isCompleted: updateData.isCompleted || false,
            isLocked: updateData.isLocked || false,
            homeScore: updateData.homeScore,
            awayScore: updateData.awayScore,
            referee: updateData.referee,
            refereeNotes: updateData.refereeNotes,
            homePlayers: updateData.homePlayers || [],
            awayPlayers: updateData.awayPlayers || []
          };

          const result = await updateMatchForm(matchFormData);
          console.log('✅ [enhancedMatchService] Cup match updateMatchForm succeeded');
          
          let successMessage = "Bekerwedstrijd succesvol bijgewerkt";
          if (result.advanceMessage) {
            if (result.advanceMessage.includes("ongewijzigd")) {
              successMessage += " (winnaar ongewijzigd)";
            } else {
              successMessage += ` - ${result.advanceMessage}`;
            }
          }

          return {
            success: true,
            message: successMessage
          };
        } catch (cupError) {
          console.error('❌ [enhancedMatchService] Error with cup match update:', cupError);
          // Fall back to regular update
        }
      }

      console.log('🟢 [enhancedMatchService] Using regular update logic');
      // Regular update logic for non-cup matches or when cup-specific logic fails
      
      // Check for late submission if this is a player_manager submission
      let isLateSubmission = false;
      if (userRole === "player_manager" && updateData.date && updateData.time) {
        const now = new Date();
        const matchDateTime = new Date(`${updateData.date}T${updateData.time}`);
        const fifteenMinutesBeforeMatch = new Date(matchDateTime.getTime() - 15 * 60 * 1000);
        const fiveMinutesBeforeMatch = new Date(matchDateTime.getTime() - 5 * 60 * 1000);
        isLateSubmission = now >= fifteenMinutesBeforeMatch && now < fiveMinutesBeforeMatch;
      }
      
      // Build update object with all provided values
      const updateObject: any = {};
      
      console.log('💾 [enhancedMatchService] Processing referee notes:', {
        matchId: matchId,
        refereeNotes: updateData.refereeNotes,
        refereeNotesType: typeof updateData.refereeNotes,
        refereeNotesLength: updateData.refereeNotes?.length || 0,
        isUndefined: updateData.refereeNotes === undefined,
        isNull: updateData.refereeNotes === null,
        isEmpty: updateData.refereeNotes === "",
        isLateSubmission: isLateSubmission
      });
      
      // Handle referee notes - add late submission penalty if applicable, otherwise use provided value
      if (isLateSubmission) {
        // Add penalty to existing notes
        updateObject.referee_notes = (updateData.refereeNotes || '') + 
          (updateData.refereeNotes ? '\n\n' : '') + 
          '⚠️ BOETE: Wedstrijdblad te laat ingevuld - €5.00';
        console.log('💾 [enhancedMatchService] Added late submission penalty:', {
          finalRefereeNotes: updateObject.referee_notes
        });
      } else if (updateData.refereeNotes !== undefined) {
        // Only set referee_notes if not already set by late submission penalty
        // Preserve empty strings, only convert undefined/null to null
        updateObject.referee_notes = updateData.refereeNotes !== null && updateData.refereeNotes !== undefined ? updateData.refereeNotes : null;
        console.log('💾 [enhancedMatchService] Set referee_notes:', {
          finalRefereeNotes: updateObject.referee_notes,
          finalType: typeof updateObject.referee_notes,
          finalLength: updateObject.referee_notes?.length || 0
        });
      } else {
        console.log('💾 [enhancedMatchService] refereeNotes is undefined, not setting');
      }

      // Handle scores - allow null values to clear scores
      if (updateData.homeScore !== undefined) updateObject.home_score = updateData.homeScore;
      if (updateData.awayScore !== undefined) updateObject.away_score = updateData.awayScore;
      if (updateData.referee !== undefined) updateObject.referee = updateData.referee;
      if (updateData.matchday !== undefined) updateObject.speeldag = updateData.matchday;
      if (updateData.location !== undefined) updateObject.location = updateData.location;
      if (updateData.date !== undefined && updateData.time !== undefined) {
        // Combine date and time into match_date timestamp with proper timezone handling
        updateObject.match_date = localDateTimeToISO(updateData.date, updateData.time);
      }
      if (updateData.homePlayers !== undefined) updateObject.home_players = updateData.homePlayers;
      if (updateData.awayPlayers !== undefined) updateObject.away_players = updateData.awayPlayers;
      if (updateData.isCompleted !== undefined) updateObject.is_submitted = updateData.isCompleted;
      if (updateData.isLocked !== undefined) updateObject.is_locked = updateData.isLocked;

      // Note: We don't add updated_at as it's not part of the matches table schema

      // If nothing to update, return success
      if (Object.keys(updateObject).length <= 1) {
        return {
          success: true,
          message: "Geen wijzigingen om bij te werken"
        };
      }
      
      // Get user ID from localStorage
      const authDataString = localStorage.getItem('auth_data');
      let userId: number | null = null;
      if (authDataString) {
        try {
          const authData = JSON.parse(authDataString);
          userId = authData?.user?.id;
        } catch (e) {
          console.warn('Could not parse auth_data');
        }
      }
      
      if (!userId) {
        return {
          success: false,
          message: "Niet ingelogd. Log opnieuw in om wijzigingen op te slaan."
        };
      }
      
      // Debug: Log what we're sending
      console.log('🟢 [enhancedMatchService] SENDING UPDATE via RPC:', { matchId, updateObject, userId });
      
      // Use SECURITY DEFINER RPC for atomic context + update
      const { data, error } = await supabase.rpc('update_match_with_context', {
        p_user_id: userId,
        p_match_id: matchId,
        p_update_data: updateObject
      });
        
      if (error) {
        console.error('❌ [enhancedMatchService] RPC ERROR:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error, null, 2)
        });
        throw new Error(`Database error (${error.code}): ${error.message}`);
      }
      
      // Check RPC result for success/failure
      const result = Array.isArray(data) ? data[0] : data;
      if (!result || !result.success) {
        console.error('❌ [enhancedMatchService] RPC returned failure:', result);
        return {
          success: false,
          message: result?.message || "Geen toegang om deze wedstrijd bij te werken."
        };
      }
      
      console.log('✅ [enhancedMatchService] UPDATE SUCCESS via RPC:', result);

      // Prepare success message immediately
      const successMessage = isLateSubmission 
        ? "⚠️ Spelerslijst bijgewerkt - LET OP: Te laat ingevuld!"
        : "Wedstrijd succesvol bijgewerkt";

      // FIRE-AND-FORGET: Schedule non-critical side effects without blocking
      // These run asynchronously after success response is returned
      // Uses hardened background processor with retry logic and failure tracking
      scheduleBackgroundSideEffects(matchId, updateData, matchInfo, isCupMatch);

      // Return SUCCESS immediately - critical path complete
      return {
        success: true,
        message: successMessage,
        data
      };

    } catch (error: any) {
      console.error('❌ [enhancedMatchService] FATAL ERROR in updateMatch:', error);
      console.error('❌ [enhancedMatchService] Error details:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Onbekende fout',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
        fullError: error
      });
      
      const errorMessage = error?.message || error?.code || 'Onbekende fout';
      const errorDetails = error?.details ? ` (Details: ${JSON.stringify(error.details)})` : '';
      const errorCode = error?.code ? ` [Code: ${error.code}]` : '';
      
      return {
        success: false,
        message: `Fout bij bijwerken wedstrijd${errorCode}: ${errorMessage}${errorDetails}`
      };
    }
  },

  async lockMatch(matchId: number): Promise<ServiceResponse> {

    if (!matchId || isNaN(matchId)) {
      return {
        success: false,
        message: "Ongeldige wedstrijd ID"
      };
    }

    try {
      const { data, error } = await withUserContext(async () => {
        return await supabase
          .from('matches')
          .update({ 
            is_locked: true
          })
          .eq('match_id', matchId)
          .select('match_id');
      });

      if (error) {
        return {
          success: false,
          message: `Fout bij vergrendelen wedstrijd: ${error.message}`
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          message: "Geen toegang om deze wedstrijd te vergrendelen."
        };
      }

      return {
        success: true,
        message: "Wedstrijd succesvol vergrendeld",
        data
      };

    } catch (error) {
      return {
        success: false,
        message: `Onverwachte fout bij vergrendelen: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      };
    }
  },

  async unlockMatch(matchId: number): Promise<ServiceResponse> {

    if (!matchId || isNaN(matchId)) {
      return {
        success: false,
        message: "Ongeldige wedstrijd ID"
      };
    }

    try {
      const { data, error } = await withUserContext(async () => {
        return await supabase
          .from('matches')
          .update({ 
            is_locked: false
          })
          .eq('match_id', matchId)
          .select('match_id');
      });

      if (error) {
        return {
          success: false,
          message: `Fout bij ontgrendelen wedstrijd: ${error.message}`
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          message: "Geen toegang om deze wedstrijd te ontgrendelen."
        };
      }

      return {
        success: true,
        message: "Wedstrijd succesvol ontgrendeld",
        data
      };

    } catch (error) {
      return {
        success: false,
        message: `Onverwachte fout bij ontgrendelen: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      };
    }
  },

  async getMatch(matchId: number): Promise<ServiceResponse> {

    if (!matchId || isNaN(matchId)) {
      return {
        success: false,
        message: "Ongeldige wedstrijd ID"
      };
    }

    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          teams_home:teams!home_team_id(team_name),
          teams_away:teams!away_team_id(team_name)
        `)
        .eq('match_id', matchId)
        .single();

      if (error) {
        return {
          success: false,
          message: `Fout bij ophalen wedstrijd: ${error.message}`
        };
      }

      return {
        success: true,
        message: "Wedstrijd succesvol opgehaald",
        data
      };

    } catch (error) {
      return {
        success: false,
        message: `Onverwachte fout bij ophalen wedstrijd: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      };
    }
  }
};
