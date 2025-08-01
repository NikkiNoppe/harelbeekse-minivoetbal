import { supabase } from "@/integrations/supabase/client";
import { MatchesResult, PastMatch, MatchFormData } from "../types";
import { updateMatchData, MatchUpdateData } from "./matchUpdateService";
import { formatDateShort, formatTimeForDisplay, getCurrentDate } from "@/lib/dateUtils";

export { updateMatchData };
export type { MatchUpdateData };

export async function fetchMatches(): Promise<MatchesResult> {
  try {
    const today = getCurrentDate();
    
    const { data, error } = await supabase
      .from('matches')
      .select(`
        match_id,
        unique_number,
        match_date,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        is_submitted,
        is_locked,
        location,
        referee,
        referee_notes,
        speeldag,
        home_players,
        away_players,
        home_team:teams!home_team_id(team_id, team_name),
        away_team:teams!away_team_id(team_id, team_name)
      `)
      .order('match_date', { ascending: false });
    
    if (error) throw error;
    
    // Process the data into past and upcoming matches
    const past: PastMatch[] = [];
    const upcoming: MatchFormData[] = [];
    
    data.forEach(match => {
      const matchDate = new Date(match.match_date);
      const dateStr = formatDateShort(match.match_date);
      const timeStr = formatTimeForDisplay(match.match_date);
      
      // Make sure we safely access nested objects
      const homeTeam = match.home_team as { team_id: number, team_name: string } | null;
      const awayTeam = match.away_team as { team_id: number, team_name: string } | null;
      
      if (match.is_submitted && match.home_score !== null && match.away_score !== null) {
        // This is a past match with a result
        past.push({
          id: match.match_id,
          date: dateStr,
          homeTeam: homeTeam?.team_name || 'Onbekend',
          awayTeam: awayTeam?.team_name || 'Onbekend',
          homeScore: match.home_score,
          awayScore: match.away_score,
          location: match.location || 'Sporthal',
          referee: match.referee || 'Admin',
          uniqueNumber: match.unique_number
        });
      } else {
        // This is an upcoming match
        upcoming.push({
          matchId: match.match_id,
          uniqueNumber: match.unique_number || '',
          date: dateStr,
          time: timeStr,
          homeTeamId: homeTeam?.team_id || 0,
          homeTeamName: homeTeam?.team_name || 'Onbekend',
          awayTeamId: awayTeam?.team_id || 0,
          awayTeamName: awayTeam?.team_name || 'Onbekend',
          location: match.location || 'Sporthal',
          matchday: (match as any).speeldag || '',
          isCompleted: !!match.is_submitted,
          isLocked: !!(match as any).is_locked,
          homeScore: match.home_score,
          awayScore: match.away_score,
          referee: match.referee,
          refereeNotes: (match as any).referee_notes,
          homePlayers: (match as any).home_players || [],
          awayPlayers: (match as any).away_players || []
        });
      }
    });
    
    return { past, upcoming };
  } catch (error) {
    console.error("Error fetching matches:", error);
    return { past: [], upcoming: [] };
  }
}
