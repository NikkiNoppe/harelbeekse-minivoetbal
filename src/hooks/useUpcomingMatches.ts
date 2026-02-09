import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UpcomingMatch {
  match_id: number;
  match_date: string;
  home_team_id: number;
  away_team_id: number;
  opponent_name: string;
  home_team_name?: string;
  away_team_name?: string;
  is_home: boolean;
  speeldag?: string;
  location?: string;
  unique_number?: string;
  is_locked?: boolean;
  is_submitted?: boolean;
  home_players?: any[];
  away_players?: any[];
  home_score?: number | null;
  away_score?: number | null;
  referee?: string;
  referee_notes?: string;
}

export const useUpcomingMatches = (teamId: number | null, limit: number = 5) => {
  return useQuery({
    queryKey: ['upcomingMatches', teamId, limit],
    queryFn: async () => {
      if (!teamId) return [];

      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('matches')
        .select(`
          match_id,
          match_date,
          home_team_id,
          away_team_id,
          speeldag,
          location,
          unique_number,
          is_submitted,
          is_locked,
          home_players,
          away_players,
          home_score,
          away_score,
          referee,
          referee_notes,
          home_team:teams!matches_home_team_id_fkey(team_name),
          away_team:teams!matches_away_team_id_fkey(team_name)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .or(`match_date.gte.${now},and(home_score.is.null,away_score.is.null)`)
        
        .order('match_date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data.map((match: any) => {
        const isHome = match.home_team_id === teamId;
        return {
          match_id: match.match_id,
          match_date: match.match_date,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          opponent_name: isHome ? match.away_team?.team_name : match.home_team?.team_name,
          home_team_name: match.home_team?.team_name,
          away_team_name: match.away_team?.team_name,
          is_home: isHome,
          speeldag: match.speeldag,
          location: match.location,
          unique_number: match.unique_number,
          is_locked: match.is_locked,
          is_submitted: match.is_submitted,
          home_players: match.home_players || [],
          away_players: match.away_players || [],
          home_score: match.home_score,
          away_score: match.away_score,
          referee: match.referee,
          referee_notes: match.referee_notes
        };
      });
    },
    enabled: !!teamId
  });
};
