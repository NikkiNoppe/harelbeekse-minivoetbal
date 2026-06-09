import { useQuery } from "@tanstack/react-query";
import { fetchCompetitionMatches } from "@/services/match";
import { fetchRegularStandings } from "@/services/standings/standingsService";

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

const fetchCompetitionStandings = async (): Promise<Team[]> => {
  const standings = await fetchRegularStandings();
  return standings.map((s) => ({
    id: s.team_id,
    name: s.team_name,
    played: s.played,
    won: s.won,
    draw: s.draw,
    lost: s.lost,
    goalDiff: s.goal_diff,
    points: s.points,
  }));
};

export const useCompetitionStandings = () => {
  return useQuery({
    queryKey: ['competitionStandings'],
    queryFn: fetchCompetitionStandings,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

export const useCompetitionMatches = () => {
  return useQuery({
    queryKey: ['competitionMatches'],
    queryFn: fetchCompetitionMatches,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

export const useCompetitionData = () => {
  const standingsQuery = useCompetitionStandings();
  const matchesQuery = useCompetitionMatches();

  const processedMatches = matchesQuery.data
    ? {
        upcoming: matchesQuery.data.upcoming || [],
        past: matchesQuery.data.past || [],
        all: [...(matchesQuery.data.upcoming || []), ...(matchesQuery.data.past || [])],
      }
    : { upcoming: [], past: [], all: [] };

  const matchdays = [...new Set(processedMatches.all.map((match) => match.matchday))]
    .filter(Boolean)
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

  const teamNames = [
    ...new Set([
      ...processedMatches.all.map((match) => match.homeTeamName),
      ...processedMatches.all.map((match) => match.awayTeamName),
    ]),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'nl'));

  return {
    teams: standingsQuery.data,
    standingsLoading: standingsQuery.isLoading,
    standingsFetched: standingsQuery.isFetched,
    standingsError: standingsQuery.error,
    refetchStandings: standingsQuery.refetch,

    matches: processedMatches,
    matchesLoading: matchesQuery.isLoading,
    matchesFetched: matchesQuery.isFetched,
    matchesError: matchesQuery.error,
    refetchMatches: matchesQuery.refetch,

    matchdays,
    teamNames,

    isLoading: standingsQuery.isLoading || matchesQuery.isLoading,
    hasError: !!standingsQuery.error || !!matchesQuery.error,
  };
};
