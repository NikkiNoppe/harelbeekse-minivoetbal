import { supabase } from "@/integrations/supabase/client";
import { localDateTimeToISO, isoToLocalDateTime } from "@/lib/dateUtils";
import { updateMatchForm } from "@/components/pages/admin/matches/services/matchesFormService";
import { MatchFormData } from "@/components/pages/admin/matches/types";
import { bekerService } from "@/services/match/cupService";

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
      
      // Add late submission penalty if applicable
      if (isLateSubmission) {
        updateObject.referee_notes = (updateData.refereeNotes || '') + 
          (updateData.refereeNotes ? '\n\n' : '') + 
          '⚠️ BOETE: Wedstrijdblad te laat ingevuld - €5.00';
      }

      // Handle scores - allow null values to clear scores
      if (updateData.homeScore !== undefined) updateObject.home_score = updateData.homeScore;
      if (updateData.awayScore !== undefined) updateObject.away_score = updateData.awayScore;
      if (updateData.referee !== undefined) updateObject.referee = updateData.referee;
      if (updateData.refereeNotes !== undefined) updateObject.referee_notes = updateData.refereeNotes;
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
      
      // Debug: Log what we're sending
      console.log('🟢 [enhancedMatchService] SENDING UPDATE:', { matchId, updateObject });
      
      // Direct database update
      const { data, error } = await supabase
        .from('matches')
        .update(updateObject)
        .eq('match_id', matchId)
        .select();
        
      if (error) {
        console.error('❌ [enhancedMatchService] DATABASE ERROR:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error, null, 2)
        });
        throw new Error(`Database error (${error.code}): ${error.message}. Details: ${JSON.stringify(error.details)}`);
      }
      
      console.log('✅ [enhancedMatchService] UPDATE SUCCESS:', data);

      // Fallback: If this is a cup match, re-evaluate advancement after successful update (using persisted values)
      try {
        if (isCupMatch) {
          const current = await bekerService.getCupMatchById(matchId);
          if (current) {
            const nextRound = bekerService.getNextRound(current.unique_number!);
            if (nextRound) {
              const hsNew = current.home_score;
              const asNew = current.away_score;
              if (hsNew == null || asNew == null || hsNew === asNew) {
                await bekerService.clearAdvancement(current.unique_number!, nextRound);
                await bekerService.clearAdvancementCascade(current.unique_number!);
              } else {
                const winnerTeamId = hsNew > asNew ? current.home_team_id! : current.away_team_id!;
                await bekerService.updateAdvancement(current.unique_number!, winnerTeamId, nextRound);
              }
            }
          }
        }
      } catch (advErr) {
        console.warn('Advancement recalculation failed (fallback path):', advErr);
      }


      // Sync card penalties whenever players data changes
      console.log('🟢 [enhancedMatchService] Checking if card penalties need sync...');
      try {
        if ((updateData.homePlayers !== undefined || updateData.awayPlayers !== undefined) && 
            matchInfo?.home_team_id && matchInfo?.away_team_id) {
          console.log('🟢 [enhancedMatchService] Syncing card penalties...');
          const matchDateISO = (data && Array.isArray(data) ? data[0]?.match_date : null) || null;
          const response = await supabase.functions.invoke('sync-card-penalties', {
            body: {
              matchId,
              matchDateISO,
              homeTeamId: matchInfo.home_team_id,
              awayTeamId: matchInfo.away_team_id,
              homePlayers: updateData.homePlayers || [],
              awayPlayers: updateData.awayPlayers || []
            }
          });
          
          if (response.error) {
            console.error('❌ [enhancedMatchService] Card penalty sync failed:', response.error);
          } else {
            console.log('✅ [enhancedMatchService] Card penalties synced successfully:', response.data);
          }
        } else {
          console.log('🟢 [enhancedMatchService] Skipping card penalty sync (no player changes or missing team IDs)');
        }
      } catch (cardErr) {
        console.error('❌ [enhancedMatchService] Error syncing card penalties:', cardErr);
      }

      console.log('✅ [enhancedMatchService] All operations completed successfully');
      return {
        success: true,
        message: isLateSubmission 
          ? "⚠️ Spelerslijst bijgewerkt - LET OP: Te laat ingevuld!"
          : "Wedstrijd succesvol bijgewerkt",
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
      const { data, error } = await supabase
        .from('matches')
        .update({ 
          is_locked: true
        })
        .eq('match_id', matchId)
        .select();

      if (error) {
        return {
          success: false,
          message: `Fout bij vergrendelen wedstrijd: ${error.message}`
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
      const { data, error } = await supabase
        .from('matches')
        .update({ 
          is_locked: false
        })
        .eq('match_id', matchId)
        .select();

      if (error) {
        return {
          success: false,
          message: `Fout bij ontgrendelen wedstrijd: ${error.message}`
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
