
import { supabase } from "@/integrations/supabase/client";
import { getCurrentISO } from "@/lib/dateUtils";

interface MatchUpdateData {
  homeScore?: number;
  awayScore?: number;
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
  async updateMatch(matchId: number, updateData: MatchUpdateData): Promise<ServiceResponse> {
    const timestamp = getCurrentISO();
    console.log(`[${timestamp}] enhancedMatchService.updateMatch START:`, { 
      matchId, 
      updateKeys: Object.keys(updateData),
      hasMatchId: !!matchId
    });

    if (!matchId || isNaN(matchId)) {
      console.error(`[${timestamp}] enhancedMatchService.updateMatch ERROR: Invalid matchId:`, matchId);
      return {
        success: false,
        message: "Ongeldige wedstrijd ID"
      };
    }

    try {
      // Build update object with only defined values
      const updateObject: any = {
        updated_at: new Date().toISOString()
      };

      // Add fields only if they are defined
      if (updateData.homeScore !== undefined) updateObject.home_score = updateData.homeScore;
      if (updateData.awayScore !== undefined) updateObject.away_score = updateData.awayScore;
      if (updateData.referee !== undefined) updateObject.referee = updateData.referee;
      if (updateData.refereeNotes !== undefined) updateObject.referee_notes = updateData.refereeNotes;
      if (updateData.matchday !== undefined) updateObject.speeldag = updateData.matchday;
      if (updateData.location !== undefined) updateObject.location = updateData.location;
      if (updateData.homePlayers !== undefined) updateObject.home_players = updateData.homePlayers;
      if (updateData.awayPlayers !== undefined) updateObject.away_players = updateData.awayPlayers;
      if (updateData.isCompleted !== undefined) updateObject.is_submitted = updateData.isCompleted;
      if (updateData.isLocked !== undefined) updateObject.is_locked = updateData.isLocked;

      console.log(`[${timestamp}] enhancedMatchService.updateMatch UPDATE OBJECT:`, updateObject);

      const { data, error } = await supabase
        .from('matches')
        .update(updateObject)
        .eq('match_id', matchId)
        .select();

      if (error) {
        console.error(`[${timestamp}] enhancedMatchService.updateMatch SUPABASE ERROR:`, error);
        return {
          success: false,
          message: `Database fout bij bijwerken wedstrijd: ${error.message}`
        };
      }

      console.log(`[${timestamp}] enhancedMatchService.updateMatch SUCCESS:`, { 
        updatedRows: data?.length || 0,
        matchId 
      });

      return {
        success: true,
        message: "Wedstrijd succesvol bijgewerkt",
        data
      };

    } catch (error) {
      console.error(`[${timestamp}] enhancedMatchService.updateMatch CATCH ERROR:`, error);
      return {
        success: false,
        message: `Onverwachte fout bij bijwerken wedstrijd: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      };
    }
  },

  async lockMatch(matchId: number): Promise<ServiceResponse> {
    const timestamp = getCurrentISO();
    console.log(`[${timestamp}] enhancedMatchService.lockMatch START:`, { matchId });

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
        console.error(`[${timestamp}] enhancedMatchService.lockMatch ERROR:`, error);
        return {
          success: false,
          message: `Fout bij vergrendelen wedstrijd: ${error.message}`
        };
      }

      console.log(`[${timestamp}] enhancedMatchService.lockMatch SUCCESS:`, { matchId });

      return {
        success: true,
        message: "Wedstrijd succesvol vergrendeld",
        data
      };

    } catch (error) {
      console.error(`[${timestamp}] enhancedMatchService.lockMatch CATCH ERROR:`, error);
      return {
        success: false,
        message: `Onverwachte fout bij vergrendelen: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      };
    }
  },

  async unlockMatch(matchId: number): Promise<ServiceResponse> {
    const timestamp = getCurrentISO();
    console.log(`[${timestamp}] enhancedMatchService.unlockMatch START:`, { matchId });

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
        console.error(`[${timestamp}] enhancedMatchService.unlockMatch ERROR:`, error);
        return {
          success: false,
          message: `Fout bij ontgrendelen wedstrijd: ${error.message}`
        };
      }

      console.log(`[${timestamp}] enhancedMatchService.unlockMatch SUCCESS:`, { matchId });

      return {
        success: true,
        message: "Wedstrijd succesvol ontgrendeld",
        data
      };

    } catch (error) {
      console.error(`[${timestamp}] enhancedMatchService.unlockMatch CATCH ERROR:`, error);
      return {
        success: false,
        message: `Onverwachte fout bij ontgrendelen: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      };
    }
  },

  async getMatch(matchId: number): Promise<ServiceResponse> {
    const timestamp = getCurrentISO();
    console.log(`[${timestamp}] enhancedMatchService.getMatch START:`, { matchId });

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
        console.error(`[${timestamp}] enhancedMatchService.getMatch ERROR:`, error);
        return {
          success: false,
          message: `Fout bij ophalen wedstrijd: ${error.message}`
        };
      }

      console.log(`[${timestamp}] enhancedMatchService.getMatch SUCCESS:`, { matchId });

      return {
        success: true,
        message: "Wedstrijd succesvol opgehaald",
        data
      };

    } catch (error) {
      console.error(`[${timestamp}] enhancedMatchService.getMatch CATCH ERROR:`, error);
      return {
        success: false,
        message: `Onverwachte fout bij ophalen wedstrijd: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      };
    }
  }
};
