import { supabase } from "@/integrations/supabase/client";
import { isoToLocalDateTime, sortDatesDesc } from "@/lib/dateUtils";
import { sortMatchesByDateAndTime } from "@/lib/matchSortingUtils";
import { getRpcSessionArgs } from "@/lib/authSession";
import { fetchPublicMatches, isRegularMatch } from "@/services/public/publicScheduleFetch";

export interface MatchData {
  matchId: number;
  uniqueNumber: string;
  date: string;
  time: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  location: string;
  matchday: string;
  isCompleted: boolean;
  homeScore?: number;
  awayScore?: number;
  referee?: string;
}

export interface CardData {
  playerId: number;
  playerName: string;
  teamName: string;
  cardType: 'yellow' | 'red';
  matchId: number;
  matchDate: string;
  uniqueNumber: string;
}

export const fetchCompetitionMatches = async (organizationId: number) => {
  let matchesData;
  try {
    matchesData = (await fetchPublicMatches(organizationId)).filter(isRegularMatch);
  } catch (matchesError) {
    console.error("[fetchCompetitionMatches] Error:", matchesError);
    return { upcoming: [], past: [] };
  }

  // If there are matches, process them normally
  if (matchesData && matchesData.length > 0) {
    const upcoming: MatchData[] = [];
    const past: MatchData[] = [];

    for (const row of matchesData as any[]) {
      const { date, time } = isoToLocalDateTime(row.match_date);

      const matchData: MatchData = {
        matchId: row.match_id,
        uniqueNumber: row.unique_number || "",
        date,
        time,
        homeTeamId: row.home_team_id,
        homeTeamName: row.home_team_name || "Onbekend",
        awayTeamId: row.away_team_id,
        awayTeamName: row.away_team_name || "Onbekend",
        location: row.location || "Te bepalen",
        matchday: row.speeldag || "Te bepalen",
        isCompleted: !!row.is_submitted,
        homeScore: row.home_score ?? undefined,
        awayScore: row.away_score ?? undefined,
        referee: row.referee ?? undefined
      };

      if (matchData.isCompleted) {
        past.push(matchData);
      } else {
        upcoming.push(matchData);
      }
    }

    // Sort both upcoming and past matches by date and time
    return { 
      upcoming: sortMatchesByDateAndTime(upcoming), 
      past: sortMatchesByDateAndTime(past) 
    };
  }

  // If no matches exist, return empty arrays
  return { 
    upcoming: [], 
    past: [] 
  };
};

export const fetchAllCards = async (): Promise<CardData[]> => {
  const { data, error } = await supabase.rpc('get_match_card_events', getRpcSessionArgs());

  if (error || !data) {
    console.error("[fetchAllCards] Error:", error);
    return [];
  }

  const cards: CardData[] = (data as Array<{
    player_id: number;
    player_name: string;
    team_name: string;
    card_type: string;
    match_id: number;
    match_date: string;
    unique_number: string;
  }>).map((row) => ({
    playerId: row.player_id,
    playerName: row.player_name,
    teamName: row.team_name || 'Onbekend',
    cardType: row.card_type === 'red' ? 'red' : 'yellow',
    matchId: row.match_id,
    matchDate: row.match_date ? new Date(row.match_date).toISOString().slice(0, 10) : '',
    uniqueNumber: row.unique_number || '',
  }));

  return cards.sort((a, b) => sortDatesDesc(a.matchDate, b.matchDate));
};
