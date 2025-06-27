
import { supabase } from "@/integrations/supabase/client";

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
  const { data, error } = await supabase
    .from("matches")
    .select(`
      match_id,
      unique_number,
      match_date,
      location,
      speeldag,
      home_team_id,
      away_team_id,
      teams_home:teams!home_team_id ( team_name ),
      teams_away:teams!away_team_id ( team_name ),
      match_forms (
        is_submitted,
        home_score,
        away_score,
        referee,
        home_players,
        away_players
      )
    `)
    .order("match_date", { ascending: true });

  if (error || !data) {
    console.error("[fetchCompetitionMatches] Error:", error);
    return { upcoming: [], past: [] };
  }

  const upcoming: MatchData[] = [];
  const past: MatchData[] = [];

  for (const row of data as any[]) {
    const form = Array.isArray(row.match_forms) && row.match_forms.length > 0 ? row.match_forms[0] : null;
    
    let date = "", time = "";
    if (row.match_date) {
      const d = new Date(row.match_date);
      date = d.toISOString().slice(0, 10);
      time = d.toISOString().slice(11, 16);
    }

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
      matchday: row.speeldag || "Te bepalen", // Use speeldag column
      isCompleted: form ? !!form.is_submitted : false,
      homeScore: form?.home_score ?? undefined,
      awayScore: form?.away_score ?? undefined,
      referee: form?.referee ?? undefined
    };

    if (matchData.isCompleted) {
      past.push(matchData);
    } else {
      upcoming.push(matchData);
    }
  }

  return { upcoming, past };
};

export const fetchAllCards = async (): Promise<CardData[]> => {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      match_id,
      unique_number,
      match_date,
      teams_home:teams!home_team_id ( team_name ),
      teams_away:teams!away_team_id ( team_name ),
      match_forms (
        home_players,
        away_players
      )
    `)
    .not("match_forms.home_players", "is", null)
    .not("match_forms.away_players", "is", null);

  if (error || !data) {
    console.error("[fetchAllCards] Error:", error);
    return [];
  }

  const cards: CardData[] = [];

  for (const row of data as any[]) {
    const form = Array.isArray(row.match_forms) && row.match_forms.length > 0 ? row.match_forms[0] : null;
    if (!form) continue;

    const matchDate = row.match_date ? new Date(row.match_date).toISOString().slice(0, 10) : "";
    
    // Extract cards from home players
    if (Array.isArray(form.home_players)) {
      for (const player of form.home_players) {
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
    if (Array.isArray(form.away_players)) {
      for (const player of form.away_players) {
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

  return cards.sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
};
