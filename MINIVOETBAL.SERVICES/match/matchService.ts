
import { supabase } from "../../MINIVOETBAL.SDK/client";
import { localDateTimeToISO } from "../../MINIVOETBAL.UI/lib/dateUtils";

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
    const { error } = await supabase
      .from('matches')
      .update({
        match_date: localDateTimeToISO(metadata.date, metadata.time),
        home_team_id: metadata.homeTeamId,
        away_team_id: metadata.awayTeamId,
        location: metadata.location,
        speeldag: metadata.matchday
      })
      .eq('match_id', metadata.matchId);

    if (error) {
      console.error('Error updating match metadata:', error);
      throw error;
    }
  }
};
