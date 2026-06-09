import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import { localDateTimeToISO } from "@/lib/dateUtils";

export interface MatchMetadata {
  matchId: number;
  date: string;
  time: string;
  homeTeamId: number;
  awayTeamId: number;
  location: string;
  matchday: string;
}

export const matchService = {
  async updateMatchMetadata(metadata: MatchMetadata): Promise<void> {
    const { data, error } = await supabase.rpc('update_match_for_session', {
      ...getRpcSessionArgs(),
      p_match_id: metadata.matchId,
      p_update_data: {
        match_date: localDateTimeToISO(metadata.date, metadata.time),
        home_team_id: metadata.homeTeamId,
        away_team_id: metadata.awayTeamId,
        location: metadata.location,
        speeldag: metadata.matchday,
        updated_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('Error updating match metadata:', error);
      throw error;
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (result && result.success === false) {
      throw new Error(result.message || 'Kon wedstrijd niet bijwerken');
    }
  }
};
