
import { supabase } from "@/integrations/supabase/client";
import { MatchesResult, PastMatch, MatchFormData } from "./types";

export async function fetchMatches(): Promise<MatchesResult> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('matches')
      .select(`
        match_id,
        unique_number,
        match_date,
        result,
        referee_cost,
        field_cost,
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
      const dateStr = matchDate.toLocaleDateString('nl-NL');
      const timeStr = matchDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      
      // Make sure we safely access nested objects
      const homeTeam = match.home_team as { team_id: number, team_name: string } | null;
      const awayTeam = match.away_team as { team_id: number, team_name: string } | null;
      
      if (match.result) {
        // This is a past match with a result
        const [homeScore, awayScore] = match.result.split('-').map(score => parseInt(score.trim()));
        past.push({
          id: match.match_id,
          date: dateStr,
          homeTeam: homeTeam?.team_name || 'Onbekend',
          awayTeam: awayTeam?.team_name || 'Onbekend',
          homeScore,
          awayScore,
          location: 'Sporthal', // This would ideally come from the database
          referee: 'Admin', // This would ideally come from the database
          uniqueNumber: match.unique_number
        });
      } else {
        // This is an upcoming match
        upcoming.push({
          id: match.match_id,
          date: dateStr,
          time: timeStr,
          homeTeam: homeTeam?.team_name || 'Onbekend',
          awayTeam: awayTeam?.team_name || 'Onbekend',
          location: 'Sporthal', // This would ideally come from the database
          uniqueNumber: match.unique_number
        });
      }
    });
    
    return { past, upcoming };
  } catch (error) {
    console.error("Error fetching matches:", error);
    return { past: [], upcoming: [] };
  }
}
