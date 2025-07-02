import { supabase } from "@/integrations/supabase/client";
import { localDateTimeToISO } from "@/lib/dateUtils";

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

      // Add updated_at if we have something to update
      if (Object.keys(updateObject).length > 0) {
        updateObject.updated_at = new Date().toISOString();
      }

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
          is_locked: true,
          updated_at: new Date().toISOString()
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
          is_locked: false,
          updated_at: new Date().toISOString()
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
