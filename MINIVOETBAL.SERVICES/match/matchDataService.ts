import { supabase } from "../../MINIVOETBAL.SDK/client";
import { isoToLocalDateTime, sortDatesDesc } from "../../MINIVOETBAL.UI/lib/dateUtils";
import { sortMatchesByDateAndTime } from "../../MINIVOETBAL.UI/lib/matchSortingUtils";

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

export const fetchCompetitionMatches = async () => {
  // First check if there are any matches
  const { data: matchesData, error: matchesError } = await supabase
    .from("matches")
    .select(`
      match_id,
      unique_number,
      match_date,
      location,
      speeldag,
      home_team_id,
      away_team_id,
      home_score,
      away_score,
      referee,
      is_submitted,
      is_cup_match,
      home_players,
      away_players,
      teams_home:teams!home_team_id ( team_name ),
      teams_away:teams!away_team_id ( team_name )
    `)
    .or('is_cup_match.is.null,is_cup_match.eq.false')
    .order("match_date", { ascending: true });

  if (matchesError) {
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
        homeTeamName: row.teams_home?.team_name || "Onbekend",
        awayTeamId: row.away_team_id,
        awayTeamName: row.teams_away?.team_name || "Onbekend",
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
  const { data, error } = await supabase
    .from("matches")
    .select(`
      match_id,
      unique_number,
      match_date,
      home_players,
      away_players,
      teams_home:teams!home_team_id ( team_name ),
      teams_away:teams!away_team_id ( team_name )
    `)
    .not("home_players", "is", null)
    .not("away_players", "is", null);

  if (error || !data) {
    console.error("[fetchAllCards] Error:", error);
    return [];
  }

  const cards: CardData[] = [];

  for (const row of data as any[]) {
    const matchDate = row.match_date ? new Date(row.match_date).toISOString().slice(0, 10) : "";
    
    // Extract cards from home players
    if (row.home_players && typeof Array.isArray === 'function' && Array.isArray(row.home_players)) {
      for (const player of row.home_players) {
        if (player.cardType && player.cardType !== 'none' && player.playerId && player.playerName) {
          cards.push({
            playerId: player.playerId,
            playerName: player.playerName,
            teamName: row.teams_home?.team_name || "Onbekend",
            cardType: player.cardType === 'yellow' ? 'yellow' : 'red',
            matchId: row.match_id,
            matchDate,
            uniqueNumber: row.unique_number || ""
          });
        }
      }
    }

    // Extract cards from away players
    if (row.away_players && typeof Array.isArray === 'function' && Array.isArray(row.away_players)) {
      for (const player of row.away_players) {
        if (player.cardType && player.cardType !== 'none' && player.playerId && player.playerName) {
          cards.push({
            playerId: player.playerId,
            playerName: player.playerName,
            teamName: row.teams_away?.team_name || "Onbekend",
            cardType: player.cardType === 'yellow' ? 'yellow' : 'red',
            matchId: row.match_id,
            matchDate,
            uniqueNumber: row.unique_number || ""
          });
        }
      }
    }
  }

  return cards.sort((a, b) => sortDatesDesc(a.matchDate, b.matchDate));
};
