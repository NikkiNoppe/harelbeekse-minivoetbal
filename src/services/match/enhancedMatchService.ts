import { supabase } from "@/integrations/supabase/client";
import { localDateTimeToISO, isoToLocalDateTime } from "@/lib/dateUtils";
import { updateMatchForm } from "@/components/pages/admin/matches/services/matchesFormService";
import { MatchFormData } from "@/components/pages/admin/matches/types/matchesFormTypes";

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

    if (!matchId || isNaN(matchId)) {
      return {
        success: false,
        message: "Ongeldige wedstrijd ID"
      };
    }

    try {
      // Check if this might be a cup match that could use automatic advancement
      // For cup matches, we want to use the updateMatchForm that has auto-advance logic
      const { data: matchInfo, error: fetchError } = await supabase
        .from('matches')
        .select('is_cup_match, unique_number, home_team_id, away_team_id, match_date, speeldag, location, teams_home:teams!home_team_id(team_name), teams_away:teams!away_team_id(team_name)')
        .eq('match_id', matchId)
        .single();

      if (fetchError) {
        console.error('Error fetching match info:', fetchError);
        // Continue with regular update if we can't fetch match info
      }

      const isCupMatch = matchInfo?.is_cup_match;

      // For cup matches with scores (new completions or score changes), use the matchFormService with auto-advance
      if (isCupMatch && updateData.isCompleted && updateData.homeScore !== undefined && updateData.awayScore !== undefined) {
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
          console.error('Error with cup match update:', cupError);
          // Fall back to regular update
        }
      }

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
      console.log('SENDING UPDATE:', { matchId, updateObject });
      
      // Direct database update
      const { data, error } = await supabase
        .from('matches')
        .update(updateObject)
        .eq('match_id', matchId)
        .select();
        
      if (error) {
        console.log('DATABASE ERROR:', error);
        throw error;
      }
      
      console.log('UPDATE SUCCESS:', data);
      
      return {
        success: true,
        message: isLateSubmission 
          ? "⚠️ Spelerslijst bijgewerkt - LET OP: Te laat ingevuld!"
          : "Wedstrijd succesvol bijgewerkt",
        data
      };

    } catch (error) {
      return {
        success: false,
        message: `Onverwachte fout bij bijwerken wedstrijd: ${error instanceof Error ? error.message : 'Onbekende fout'}`
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
