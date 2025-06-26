
import { supabase } from "@/integrations/supabase/client";

export interface MatchMetadata {
  matchId: number;
  date: string;
  time: string;
  homeTeamId: number;
  awayTeamId: number;
  location: string;
  matchdayId: number;
}

export const matchService = {
  async updateMatchMetadata(metadata: MatchMetadata): Promise<void> {
    const matchDateTime = new Date(`${metadata.date}T${metadata.time}`);
    
    const { error } = await supabase
      .from('matches')
      .update({
        match_date: matchDateTime.toISOString(),
        home_team_id: metadata.homeTeamId,
        away_team_id: metadata.awayTeamId,
        location: metadata.location,
        matchday_id: metadata.matchdayId
      })
      .eq('match_id', metadata.matchId);

    if (error) {
      console.error('Error updating match metadata:', error);
      throw error;
    }
  },

  async getMatchdays(): Promise<{ matchday_id: number; name: string }[]> {
    const { data, error } = await supabase
      .from('matchdays')
      .select('matchday_id, name')
      .order('matchday_id');

    if (error) {
      console.error('Error fetching matchdays:', error);
      throw error;
    }

    return data || [];
  }
};
