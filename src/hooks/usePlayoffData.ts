import { useQuery } from "@tanstack/react-query";
import { Team } from "./useCompetitionData";

export interface PlayoffMatch {
  playoff: string;
  matchday: string;
  date: string;
  home: string;
  away: string;
  result?: string;
  time?: string;
  location: string;
}

// Mock data - later te vervangen door echte API calls
const fetchPlayoffStandings = async (): Promise<Team[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      id: 1,
      name: "CAFE DE GILDE",
      played: 29,
      won: 22,
      draw: 3,
      lost: 4,
      goalDiff: 126,
      points: 70
    },
    {
      id: 2,
      name: "GARAGE VERBEKE", 
      played: 29,
      won: 23,
      draw: 5,
      lost: 1,
      goalDiff: 128,
      points: 70
    },
    {
      id: 3,
      name: "BEMARMI BOYS",
      played: 29,
      won: 21,
      draw: 6,
      lost: 2,
      goalDiff: 95,
      points: 65
    },
    {
      id: 4,
      name: "DE FLORRE",
      played: 29,
      won: 16,
      draw: 10,
      lost: 3,
      goalDiff: 88,
      points: 51
    },
    {
      id: 5,
      name: "DE DAGERAAD",
      played: 29,
      won: 15,
      draw: 12,
      lost: 2,
      goalDiff: 59,
      points: 47
    },
    {
      id: 6,
      name: "SHAKTHAR TRU.",
      played: 29,
      won: 12,
      draw: 13,
      lost: 4,
      goalDiff: 2,
      points: 40
    }
  ];
};

const fetchPlayoffMatches = async (): Promise<PlayoffMatch[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return [
    {
      playoff: "Play-Off 1",
      matchday: "Speeldag 1",
      date: "10 juni",
      home: "Garage Verbeke",
      away: "Cafe De Gilde",
      result: "4-1",
      location: "Sportpark Zuid"
    },
    {
      playoff: "Play-Off 1",
      matchday: "Speeldag 1",
      date: "10 juni",
      home: "Shakthar Truu",
      away: "De Dageraad",
      result: "3-2",
      location: "Sportpark Oost"
    },
    {
      playoff: "Play-Off 2",
      matchday: "Speeldag 1",
      date: "11 juni",
      home: "De Florre",
      away: "Bemarmi Boys",
      result: "2-2",
      location: "Sportpark Noord"
    },
    {
      playoff: "Play-Off 1",
      matchday: "Speeldag 2",
      date: "17 juni",
      home: "Garage Verbeke",
      away: "De Dageraad",
      result: "2-1",
      location: "Sportpark Zuid"
    },
    {
      playoff: "Play-Off 1",
      matchday: "Speeldag 2",
      date: "17 juni",
      home: "Shakthar Truu",
      away: "Cafe De Gilde",
      result: "3-0",
      location: "Sportpark Oost"
    },
    {
      playoff: "Play-Off 2",
      matchday: "Speeldag 2",
      date: "18 juni",
      home: "De Florre",
      away: "Bemarmi Boys",
      result: "3-1",
      location: "Sportpark Noord"
    },
    {
      playoff: "Play-Off 1",
      matchday: "Speeldag 3",
      date: "12 mei",
      home: "Shakthar Tru.",
      away: "De Florre",
      result: "0-5",
      location: "Sportpark Oost"
    },
    {
      playoff: "Play-Off 1",
      matchday: "Speeldag 3",
      date: "12 mei",
      home: "Cafe De Gilde",
      away: "Bemarmi Boys",
      result: "4-4",
      location: "Sportpark Zuid"
    },
    {
      playoff: "Play-Off 1",
      matchday: "Speeldag 3",
      date: "13 mei",
      home: "Garage Verbeke",
      away: "De Dageraad",
      result: "5-1",
      location: "Sportpark Noord"
    }
  ];
};

export const usePlayoffStandings = () => {
  return useQuery({
    queryKey: ['playoffStandings'],
    queryFn: fetchPlayoffStandings,
    staleTime: 10 * 60 * 1000, // 10 minutes - playoff standings are historical
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 1,
    refetchOnWindowFocus: false
  });
};

export const usePlayoffMatches = () => {
  return useQuery({
    queryKey: ['playoffMatches'],
    queryFn: fetchPlayoffMatches,
    staleTime: 10 * 60 * 1000, // 10 minutes - playoff results are historical
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 1,
    refetchOnWindowFocus: false
  });
};

export const usePlayoffData = () => {
  const standingsQuery = usePlayoffStandings();
  const matchesQuery = usePlayoffMatches();
  
  return {
    teams: standingsQuery.data,
    matches: matchesQuery.data || [],
    upcomingMatches: [], // For now, no upcoming playoff matches
    isLoading: standingsQuery.isLoading || matchesQuery.isLoading,
    error: standingsQuery.error || matchesQuery.error,
    refetch: () => {
      standingsQuery.refetch();
      matchesQuery.refetch();
    }
  };
}; 