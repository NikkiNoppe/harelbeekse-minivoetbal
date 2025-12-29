import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { withUserContext } from '@/lib/supabaseUtils';

export interface RefereeMatch {
  match_id: number;
  match_date: string;
  home_team_id: number;
  away_team_id: number;
  home_team_name?: string;
  away_team_name?: string;
  speeldag?: string;
  location?: string;
  unique_number?: string;
  is_locked?: boolean;
  is_submitted?: boolean;
  home_score?: number | null;
  away_score?: number | null;
  referee?: string;
  referee_notes?: string;
}

export const useRefereeMatches = (refereeUsername: string | null, month?: number, year?: number) => {
  return useQuery({
    queryKey: ['refereeMatches', refereeUsername, month, year],
    queryFn: async () => {
      if (!refereeUsername) return [];

      // Use withUserContext to ensure RLS policies work correctly
      return await withUserContext(async () => {
        const now = new Date();
        const currentMonth = month ?? now.getMonth() + 1; // 1-12
        const currentYear = year ?? now.getFullYear();
        
        // Calculate start and end of the month
        const startDate = new Date(currentYear, currentMonth - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
        
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
            home_score,
            away_score,
            referee,
            referee_notes,
            home_team:teams!matches_home_team_id_fkey(team_name),
            away_team:teams!matches_away_team_id_fkey(team_name)
          `)
          .eq('referee', refereeUsername)
          .gte('match_date', startDate.toISOString())
          .lte('match_date', endDate.toISOString())
          .order('match_date', { ascending: true });

        if (error) throw error;

        // Filter out matches that have both scores (completed matches)
        const incompleteMatches = data.filter((match: any) => 
          match.home_score === null && match.away_score === null
        );

        return incompleteMatches.map((match: any) => ({
          match_id: match.match_id,
          match_date: match.match_date,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          home_team_name: match.home_team?.team_name,
          away_team_name: match.away_team?.team_name,
          speeldag: match.speeldag,
          location: match.location,
          unique_number: match.unique_number,
          is_locked: match.is_locked,
          is_submitted: match.is_submitted,
          home_score: match.home_score,
          away_score: match.away_score,
          referee: match.referee,
          referee_notes: match.referee_notes
        }));
      });
    },
    enabled: !!refereeUsername
  });
};
