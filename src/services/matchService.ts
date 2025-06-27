
import { supabase } from "@/integrations/supabase/client";

export interface MatchMetadata {
  matchId: number;
  date: string;
  time: string;
  homeTeamId: number;
  awayTeamId: number;
  location: string;
  matchday: string; // Changed from matchdayId to matchday string
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
        speeldag: metadata.matchday // Use speeldag column instead of matchday_id
      })
      .eq('match_id', metadata.matchId);

    if (error) {
      console.error('Error updating match metadata:', error);
      throw error;
    }
  }
};
