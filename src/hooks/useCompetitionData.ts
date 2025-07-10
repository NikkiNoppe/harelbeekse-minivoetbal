import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchCompetitionMatches } from "@/services/matchDataService";

export interface Team {
  id: number;
  name: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalDiff: number;
  points: number;
}

export interface MatchData {
  matchId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  date: string;
  time: string;
  location: string;
  matchday: string;
  uniqueNumber?: string;
}

// Function to fetch competition standings from Supabase
const fetchCompetitionStandings = async (): Promise<Team[]> => {
  const { data, error } = await supabase
    .from('competition_standings')
    .select(`
      standing_id,
      team_id,
      matches_played,
      wins,
      draws,
      losses,
      goal_difference,
      goals_scored,
      goals_against,
      points,
      teams(team_name)
    `)
    .order('points', { ascending: false })
    .order('goal_difference', { ascending: false });
    
  if (error) {
    console.error("Error fetching standings:", error);
    throw new Error(`Error fetching standings: ${error.message}`);
  }
  
  return data.map(standing => ({
    id: standing.team_id,
    name: standing.teams?.team_name || 'Unknown Team',
    played: standing.matches_played,
    won: standing.wins,
    draw: standing.draws,
    lost: standing.losses,
    goalDiff: standing.goal_difference,
    points: standing.points
  }));
};

export const useCompetitionStandings = () => {
  return useQuery({
    queryKey: ['competitionStandings'],
    queryFn: fetchCompetitionStandings,
    staleTime: 2 * 60 * 1000, // 2 minutes - standings change often during match days
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

export const useCompetitionMatches = () => {
  return useQuery({
    queryKey: ['competitionMatches'],
    queryFn: fetchCompetitionMatches,
    staleTime: 1 * 60 * 1000, // 1 minute - matches change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

export const useCompetitionData = () => {
  const standingsQuery = useCompetitionStandings();
  const matchesQuery = useCompetitionMatches();
  
  // Process matches data
  const processedMatches = matchesQuery.data ? {
    upcoming: matchesQuery.data.upcoming || [],
    past: matchesQuery.data.past || [],
    all: [...(matchesQuery.data.upcoming || []), ...(matchesQuery.data.past || [])]
  } : { upcoming: [], past: [], all: [] };
  
  // Get filter options
  const matchdays = [...new Set(processedMatches.all.map(match => match.matchday))];
  const teamNames = [...new Set([
    ...processedMatches.all.map(match => match.homeTeamName),
    ...processedMatches.all.map(match => match.awayTeamName)
  ])];
  
  return {
    // Standings
    teams: standingsQuery.data,
    standingsLoading: standingsQuery.isLoading,
    standingsError: standingsQuery.error,
    refetchStandings: standingsQuery.refetch,
    
    // Matches
    matches: processedMatches,
    matchesLoading: matchesQuery.isLoading,
    matchesError: matchesQuery.error,
    refetchMatches: matchesQuery.refetch,
    
    // Filter options
    matchdays,
    teamNames,
    
    // Combined loading state
    isLoading: standingsQuery.isLoading || matchesQuery.isLoading,
    hasError: !!standingsQuery.error || !!matchesQuery.error
  };
}; 