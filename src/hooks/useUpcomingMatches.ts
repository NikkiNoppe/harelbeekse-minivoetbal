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
          is_submitted,
          home_team:teams!matches_home_team_id_fkey(team_name),
          away_team:teams!matches_away_team_id_fkey(team_name)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .gte('match_date', now)
        .eq('is_cup_match', false)
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
          location: match.location
        };
      });
    },
    enabled: !!teamId
  });
};
