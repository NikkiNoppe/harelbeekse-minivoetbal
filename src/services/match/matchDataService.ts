import { supabase } from "@/integrations/supabase/client";
import { isoToLocalDateTime, sortDatesDesc } from "@/lib/dateUtils";
import { sortMatchesByDateAndTime } from "@/lib/matchSortingUtils";

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
    .or('home_players.not.is.null,away_players.not.is.null');

  if (error || !data) {
    console.error("[fetchAllCards] Error:", error);
    return [];
  }

  const normalizeCardType = (raw: any): 'yellow' | 'red' | 'double_yellow' | 'none' => {
    const value = (typeof raw === 'string' ? raw : '').toLowerCase();
    if (value === 'yellow' || value === 'geel') return 'yellow';
    if (value === 'red' || value === 'rood') return 'red';
    if (value === 'double_yellow' || value === '2x geel' || value === 'double-yellow') return 'double_yellow';
    return 'none';
  };

  const extractPlayerId = (p: any): number | undefined => p?.playerId ?? p?.player_id ?? p?.id;
  const extractPlayerName = (p: any): string | undefined => p?.playerName ?? p?.name ?? (p?.firstName && p?.lastName ? `${p.firstName} ${p.lastName}` : undefined);

  const cards: CardData[] = [];

  for (const row of data as any[]) {
    const matchDate = row.match_date ? new Date(row.match_date).toISOString().slice(0, 10) : "";

    const pushCard = (teamName: string, player: any, cardType: 'yellow' | 'red') => {
      const playerId = extractPlayerId(player);
      const playerName = extractPlayerName(player);
      if (!playerId || !playerName) return;
      cards.push({
        playerId,
        playerName,
        teamName: teamName || 'Onbekend',
        cardType,
        matchId: row.match_id,
        matchDate,
        uniqueNumber: row.unique_number || ""
      });
    };

    const handlePlayers = (players: any[], teamName: string) => {
      for (const player of players) {
        const rawCard = player?.cardType ?? player?.card ?? player?.card_type ?? player?.kaart;
        const normalized = normalizeCardType(rawCard);
        if (normalized === 'yellow') pushCard(teamName, player, 'yellow');
        else if (normalized === 'red') pushCard(teamName, player, 'red');
        else if (normalized === 'double_yellow') {
          // Represent double yellow as both a yellow and a red entry
          pushCard(teamName, player, 'yellow');
          pushCard(teamName, player, 'red');
        }
      }
    };

    // Extract cards from home players
    if (row.home_players && Array.isArray(row.home_players)) {
      handlePlayers(row.home_players, row.teams_home?.team_name || 'Onbekend');
    }

    // Extract cards from away players
    if (row.away_players && Array.isArray(row.away_players)) {
      handlePlayers(row.away_players, row.teams_away?.team_name || 'Onbekend');
    }
  }

  return cards.sort((a, b) => sortDatesDesc(a.matchDate, b.matchDate));
};
