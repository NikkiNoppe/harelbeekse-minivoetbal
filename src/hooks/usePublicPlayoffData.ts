import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlayoffTeam {
  team_id: number;
  team_name: string;
  regular_points: number;
  playoff_points: number;
  total_points: number;
  playoff_played: number;
  playoff_wins: number;
  playoff_draws: number;
  playoff_losses: number;
  playoff_goal_diff: number;
  playoff_goals_scored: number;
  playoff_goals_against: number;
  original_position: number;
  playoff_type: 'top' | 'bottom';
}

export interface PlayoffMatchData {
  match_id: number;
  speeldag: string;
  match_date: string;
  time: string;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  location: string;
  playoff_type: 'top' | 'bottom';
  is_completed: boolean;
}

interface RegularStanding {
  team_id: number;
  team_name: string;
  points: number;
  position: number;
}

const fetchRegularStandings = async (): Promise<RegularStanding[]> => {
  const { data, error } = await supabase
    .from('competition_standings')
    .select(`
      team_id,
      points,
      teams!competition_standings_team_id_fkey (
        team_name
      )
    `)
    .order('points', { ascending: false });

  if (error) throw error;

  return (data || []).map((item, index) => ({
    team_id: item.team_id!,
    team_name: (item.teams as any)?.team_name || 'Onbekend',
    points: item.points || 0,
    position: index + 1,
  }));
};

const fetchPlayoffMatches = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      match_id,
      speeldag,
      match_date,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      location,
      playoff_type,
      is_submitted
    `)
    .eq('is_playoff_match', true)
    .order('match_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

const fetchTeams = async (): Promise<Map<number, string>> => {
  const { data, error } = await supabase
    .from('teams')
    .select('team_id, team_name');

  if (error) throw error;
  
  const map = new Map<number, string>();
  (data || []).forEach(t => map.set(t.team_id, t.team_name));
  return map;
};

export const usePublicPlayoffData = () => {
  return useQuery({
    queryKey: ['publicPlayoffData'],
    queryFn: async () => {
      const [regularStandings, playoffMatchesRaw, teamMap] = await Promise.all([
        fetchRegularStandings(),
        fetchPlayoffMatches(),
        fetchTeams(),
      ]);

      // Split teams into PO1 (top 8) and PO2 (bottom 7)
      const po1RegularTeams = regularStandings.slice(0, 8);
      const po2RegularTeams = regularStandings.slice(8, 15);

      // Calculate playoff points per team
      const playoffStats = new Map<number, {
        played: number;
        wins: number;
        draws: number;
        losses: number;
        goalsScored: number;
        goalsAgainst: number;
        points: number;
      }>();

      // Initialize stats for all teams
      regularStandings.forEach(team => {
        playoffStats.set(team.team_id, {
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsScored: 0,
          goalsAgainst: 0,
          points: 0,
        });
      });

      // Process completed playoff matches
      playoffMatchesRaw
        .filter(m => m.is_submitted && m.home_score !== null && m.away_score !== null)
        .forEach(match => {
          const homeStats = playoffStats.get(match.home_team_id);
          const awayStats = playoffStats.get(match.away_team_id);

          if (homeStats) {
            homeStats.played++;
            homeStats.goalsScored += match.home_score;
            homeStats.goalsAgainst += match.away_score;
            if (match.home_score > match.away_score) {
              homeStats.wins++;
              homeStats.points += 3;
            } else if (match.home_score === match.away_score) {
              homeStats.draws++;
              homeStats.points += 1;
            } else {
              homeStats.losses++;
            }
          }

          if (awayStats) {
            awayStats.played++;
            awayStats.goalsScored += match.away_score;
            awayStats.goalsAgainst += match.home_score;
            if (match.away_score > match.home_score) {
              awayStats.wins++;
              awayStats.points += 3;
            } else if (match.away_score === match.home_score) {
              awayStats.draws++;
              awayStats.points += 1;
            } else {
              awayStats.losses++;
            }
          }
        });

      // Build PO1 standings
      const po1Teams: PlayoffTeam[] = po1RegularTeams.map(team => {
        const stats = playoffStats.get(team.team_id)!;
        return {
          team_id: team.team_id,
          team_name: team.team_name,
          regular_points: team.points,
          playoff_points: stats.points,
          total_points: team.points + stats.points,
          playoff_played: stats.played,
          playoff_wins: stats.wins,
          playoff_draws: stats.draws,
          playoff_losses: stats.losses,
          playoff_goal_diff: stats.goalsScored - stats.goalsAgainst,
          playoff_goals_scored: stats.goalsScored,
          playoff_goals_against: stats.goalsAgainst,
          original_position: team.position,
          playoff_type: 'top' as const,
        };
      }).sort((a, b) => b.total_points - a.total_points || b.playoff_goal_diff - a.playoff_goal_diff);

      // Build PO2 standings
      const po2Teams: PlayoffTeam[] = po2RegularTeams.map(team => {
        const stats = playoffStats.get(team.team_id)!;
        return {
          team_id: team.team_id,
          team_name: team.team_name,
          regular_points: team.points,
          playoff_points: stats.points,
          total_points: team.points + stats.points,
          playoff_played: stats.played,
          playoff_wins: stats.wins,
          playoff_draws: stats.draws,
          playoff_losses: stats.losses,
          playoff_goal_diff: stats.goalsScored - stats.goalsAgainst,
          playoff_goals_scored: stats.goalsScored,
          playoff_goals_against: stats.goalsAgainst,
          original_position: team.position,
          playoff_type: 'bottom' as const,
        };
      }).sort((a, b) => b.total_points - a.total_points || b.playoff_goal_diff - a.playoff_goal_diff);

      // Format matches for display
      const playoffMatches: PlayoffMatchData[] = playoffMatchesRaw.map(match => {
        const matchDate = new Date(match.match_date);
        const time = matchDate.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
        
        return {
          match_id: match.match_id,
          speeldag: match.speeldag || '',
          match_date: match.match_date,
          time,
          home_team_id: match.home_team_id,
          away_team_id: match.away_team_id,
          home_team_name: teamMap.get(match.home_team_id) || 'Onbekend',
          away_team_name: teamMap.get(match.away_team_id) || 'Onbekend',
          home_score: match.home_score,
          away_score: match.away_score,
          location: match.location || '',
          playoff_type: match.playoff_type === 'top' ? 'top' : 'bottom',
          is_completed: match.is_submitted && match.home_score !== null && match.away_score !== null,
        };
      });

      // Separate upcoming and past matches
      const now = new Date();
      const upcomingMatches = playoffMatches.filter(m => !m.is_completed && new Date(m.match_date) >= now);
      const pastMatches = playoffMatches.filter(m => m.is_completed);

      return {
        po1Teams,
        po2Teams,
        allMatches: playoffMatches,
        upcomingMatches,
        pastMatches,
        hasData: regularStandings.length > 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};
