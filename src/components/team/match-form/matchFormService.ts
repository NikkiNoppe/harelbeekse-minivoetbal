
import { supabase } from "@/integrations/supabase/client";
import { MatchFormData } from "./types";

export const fetchUpcomingMatches = async (teamId: number): Promise<MatchFormData[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get matches where this team is either home or away team and the match date is in the future
    const { data, error } = await supabase
      .from('matches')
      .select(`
        match_id,
        unique_number,
        match_date,
        home_team_id,
        away_team_id,
        matchday_id,
        home_team:teams!home_team_id(team_id, team_name),
        away_team:teams!away_team_id(team_id, team_name)
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .gte('match_date', today)
      .order('match_date', { ascending: true })
      .limit(10);
    
    if (error) throw error;
    
    // Type casting to ensure we correctly access the nested properties
    return data.map(match => {
      // Safely extract team information from the nested properties
      const homeTeam = match.home_team as { team_id: number, team_name: string } | null;
      const awayTeam = match.away_team as { team_id: number, team_name: string } | null;
      
      return {
        matchId: match.match_id,
        uniqueNumber: match.unique_number || 'N/A',
        date: new Date(match.match_date).toLocaleDateString('nl-NL'),
        time: new Date(match.match_date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        homeTeamId: homeTeam?.team_id || 0,
        homeTeamName: homeTeam?.team_name || 'Onbekend',
        awayTeamId: awayTeam?.team_id || 0,
        awayTeamName: awayTeam?.team_name || 'Onbekend',
        location: 'Sporthal',  // This would ideally come from the database
        isHomeTeam: match.home_team_id === teamId
      };
    });
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    throw error;
  }
};
