import { supabase } from "@/integrations/supabase/client";
import { MatchFormData } from "./types";
import { localDateTimeToISO, isoToLocalDateTime, getCurrentISO } from "@/lib/dateUtils";

export const fetchUpcomingMatches = async (teamId: number, hasElevatedPermissions: boolean = false): Promise<MatchFormData[]> => {
  try {
    let query = supabase
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
        referee_notes,
        is_submitted,
        is_locked,
        home_players,
        away_players,
        teams_home:teams!home_team_id ( team_name ),
        teams_away:teams!away_team_id ( team_name )
      `)
      .order("match_date", { ascending: true });

    // Filter by team if not elevated permissions
    if (!hasElevatedPermissions && teamId > 0) {
      query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[fetchUpcomingMatches] Error:", error);
      throw error;
    }

    if (!data) return [];

    const matches: MatchFormData[] = data.map((row: any) => {
      const { date, time } = isoToLocalDateTime(row.match_date);

      return {
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
        isLocked: !!row.is_locked,
        homeScore: row.home_score ?? undefined,
        awayScore: row.away_score ?? undefined,
        referee: row.referee,
        refereeNotes: row.referee_notes,
        homePlayers: Array.isArray(row.home_players) ? row.home_players : [],
        awayPlayers: Array.isArray(row.away_players) ? row.away_players : []
      };
    });

    return matches;
  } catch (error) {
    console.error("[fetchUpcomingMatches] Error:", error);
    throw error;
  }
};

export const updateMatchForm = async (matchData: MatchFormData): Promise<void> => {
  try {
    const { error } = await supabase
      .from('matches')
      .update({
        match_date: localDateTimeToISO(matchData.date, matchData.time),
        home_team_id: matchData.homeTeamId,
        away_team_id: matchData.awayTeamId,
        location: matchData.location,
        speeldag: matchData.matchday,
        home_score: matchData.homeScore,
        away_score: matchData.awayScore,
        referee: matchData.referee,
        referee_notes: matchData.refereeNotes,
        is_submitted: matchData.isCompleted,
        is_locked: matchData.isLocked,
        home_players: matchData.homePlayers as any, // Cast to any to satisfy Json type
        away_players: matchData.awayPlayers as any, // Cast to any to satisfy Json type
        updated_at: getCurrentISO()
      })
      .eq('match_id', matchData.matchId);

    if (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateMatchForm:', error);
    throw error;
  }
};

export const lockMatchForm = async (matchId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('matches')
      .update({
        is_locked: true,
        updated_at: getCurrentISO()
      })
      .eq('match_id', matchId);

    if (error) {
      console.error('Error locking match:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in lockMatchForm:', error);
    throw error;
  }
};
