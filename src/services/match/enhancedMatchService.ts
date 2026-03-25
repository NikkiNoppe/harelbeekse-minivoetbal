import { supabase } from "@/integrations/supabase/client";
import { localDateTimeToISO, isoToLocalDateTime } from "@/lib/dateUtils";
import { updateMatchForm } from "@/components/pages/admin/matches/services/matchesFormService";
import { MatchFormData } from "@/components/pages/admin/matches/types";
import { scheduleBackgroundSideEffects } from "@/services/match/backgroundSideEffects";
import { withUserContext } from "@/lib/supabaseUtils";
import { MATCH_FORM_DEFAULTS, type MatchFormSettings } from "@/hooks/useMatchFormSettings";

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
  forceLatePenaltyTeamIds?: number[];
}

interface ServiceResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const enhancedMatchService = {
  async updateMatch(matchId: number, updateData: MatchUpdateData, isAdmin: boolean = false, userRole?: string, matchFormSettings?: MatchFormSettings): Promise<ServiceResponse> {
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
            homePlayers: updateData.homePlayers as any,
            awayPlayers: updateData.awayPlayers as any
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
      
      // Use configurable settings or defaults
      const settings = matchFormSettings || MATCH_FORM_DEFAULTS;
      
      // Check for late submission
      let isLateSubmission = false;
      if (updateData.date && updateData.time) {
        const now = new Date();
        const matchDateTime = new Date(`${updateData.date}T${updateData.time}`);
        const lockThreshold = new Date(matchDateTime.getTime() - settings.lock_minutes_before * 60 * 1000);
        
        if (userRole === "player_manager") {
          isLateSubmission = now >= lockThreshold && settings.allow_late_submission;
        } else if (isAdmin && updateData.forceLatePenaltyTeamIds && updateData.forceLatePenaltyTeamIds.length > 0) {
          isLateSubmission = true;
        }
      }

      // --- CHANGED-ONLY PAYLOAD ---
      // Fetch current DB state to only send fields that actually changed.
      // This prevents DB triggers (process_match_financial_costs) from
      // re-creating costs when scores/is_submitted haven't changed.
      const { data: currentMatch, error: currentMatchError } = await supabase
        .from('matches')
        .select('home_score, away_score, is_submitted, is_locked, referee, referee_notes, speeldag, location, match_date, home_players, away_players')
        .eq('match_id', matchId)
        .single();

      if (currentMatchError) {
        console.warn('⚠️ [enhancedMatchService] Could not fetch current match state, sending full payload');
      }

      const updateObject: any = {};
      const cur = currentMatch as any; // may be null

      // Helper: only add field if value differs from current DB state
      const addIfChanged = (dbField: string, newValue: any) => {
        if (!cur || JSON.stringify(cur[dbField]) !== JSON.stringify(newValue)) {
          updateObject[dbField] = newValue;
        }
      };

      // Handle referee notes
      if (updateData.refereeNotes !== undefined) {
        const newNotes = updateData.refereeNotes !== null && updateData.refereeNotes !== undefined ? updateData.refereeNotes : null;
        addIfChanged('referee_notes', newNotes);
      }

      // Handle scores
      if (updateData.homeScore !== undefined) addIfChanged('home_score', updateData.homeScore);
      if (updateData.awayScore !== undefined) addIfChanged('away_score', updateData.awayScore);
      if (updateData.referee !== undefined) addIfChanged('referee', updateData.referee || null);
      if (updateData.matchday !== undefined) addIfChanged('speeldag', updateData.matchday);
      if (updateData.location !== undefined) addIfChanged('location', updateData.location);
      if (updateData.date !== undefined && updateData.time !== undefined) {
        const newMatchDate = localDateTimeToISO(updateData.date, updateData.time);
        addIfChanged('match_date', newMatchDate);
      }
      if (updateData.homePlayers !== undefined) addIfChanged('home_players', updateData.homePlayers);
      if (updateData.awayPlayers !== undefined) addIfChanged('away_players', updateData.awayPlayers);
      if (updateData.isCompleted !== undefined) addIfChanged('is_submitted', updateData.isCompleted);
      if (updateData.isLocked !== undefined) addIfChanged('is_locked', updateData.isLocked);

      console.log('🟢 [enhancedMatchService] Changed-only payload keys:', Object.keys(updateObject));

      // Note: We don't add updated_at as it's not part of the matches table schema

      // If nothing to update, return success
      if (Object.keys(updateObject).length === 0) {
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
      // Detect submission transition: only trigger cost/penalty sync when is_submitted goes false→true
      const submissionTransition = !!(cur && cur.is_submitted === false && updateData.isCompleted === true);
      const sideEffectData = {
        ...updateData,
        _submissionTransition: submissionTransition
      };
      scheduleBackgroundSideEffects(matchId, sideEffectData, matchInfo, isCupMatch, isLateSubmission, updateData.forceLatePenaltyTeamIds);

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
