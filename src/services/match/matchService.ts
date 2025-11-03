
import { supabase } from "@/integrations/supabase/client";
import { localDateTimeToISO } from "@/lib/dateUtils";
import { withUserContext } from "@/lib/supabaseUtils";

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
    const { error } = await withUserContext(async () => {
      return await supabase
        .from('matches')
        .update({
          match_date: localDateTimeToISO(metadata.date, metadata.time),
          home_team_id: metadata.homeTeamId,
          away_team_id: metadata.awayTeamId,
          location: metadata.location,
          speeldag: metadata.matchday
        })
        .eq('match_id', metadata.matchId);
    });

    if (error) {
      console.error('Error updating match metadata:', error);
      throw error;
    }
  }
};
