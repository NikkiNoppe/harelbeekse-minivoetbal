import { supabase } from "@/integrations/supabase/client";
import { MatchFormData } from "../types";
import { localDateTimeToISO, isoToLocalDateTime } from "@/lib/dateUtils";
import { cupService } from "@/services/match";
import { sortCupMatches, sortLeagueMatches } from "@/lib/matchSortingUtils";

export const fetchUpcomingMatches = async (
  teamId: number,
  hasElevatedPermissions: boolean = false,
  competitionType?: 'league' | 'cup'
): Promise<MatchFormData[]> => {
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
        is_cup_match,
        teams_home:teams!home_team_id ( team_name ),
        teams_away:teams!away_team_id ( team_name )
      `)
      .order("match_date", { ascending: true });

    // Filter by team if not elevated permissions
    if (!hasElevatedPermissions && teamId > 0) {
      query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
    }

    // Filter by competition type if specified
    if (competitionType === 'cup') {
      query = query.eq('is_cup_match', true);
    } else if (competitionType === 'league') {
      query = query.or('is_cup_match.is.null,is_cup_match.eq.false');
    }

    const { data, error } = await query;

    if (error) {
      console.error("[fetchUpcomingMatches] Error:", error);
      throw error;
    }

    if (!data) return [];

    const matches: MatchFormData[] = data.map((row: any) => {
      const { date, time } = isoToLocalDateTime(row.match_date);
      
      // Use speeldag for matchday display, with special handling for cup matches
      let matchdayDisplay = row.speeldag || "Te bepalen";
      if (row.is_cup_match) {
        matchdayDisplay = `🏆 ${matchdayDisplay}`;
      }

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
        matchday: matchdayDisplay,
        isCompleted: !!row.is_submitted,
        isLocked: !!row.is_locked,
        homeScore: row.home_score ?? undefined,
        awayScore: row.away_score ?? undefined,
        referee: row.referee,
        refereeNotes: row.referee_notes,
        homePlayers: row.home_players && typeof Array.isArray === 'function' && Array.isArray(row.home_players) ? row.home_players : [],
        awayPlayers: row.away_players && typeof Array.isArray === 'function' && Array.isArray(row.away_players) ? row.away_players : []
      };
    });

    // Apply appropriate sorting based on competition type
    if (competitionType === 'cup') {
      return sortCupMatches(matches);
    } else if (competitionType === 'league') {
      return sortLeagueMatches(matches);
    }

    return matches;
  } catch (error) {
    console.error("[fetchUpcomingMatches] Error:", error);
    throw error;
  }
};

export const updateMatchForm = async (matchData: MatchFormData): Promise<{advanceMessage?: string}> => {
  try {
    // First check if this is a cup match that's being completed
    const { data: existingMatch, error: fetchError } = await supabase
      .from('matches')
      .select('is_cup_match, is_submitted, unique_number')
      .eq('match_id', matchData.matchId)
      .single();

    if (fetchError) {
      console.error('Error fetching existing match:', fetchError);
      throw fetchError;
    }

    const isCupMatch = existingMatch?.is_cup_match;
    const wasAlreadySubmitted = existingMatch?.is_submitted;
    const isBeingCompleted = matchData.isCompleted && !wasAlreadySubmitted;

    // Update the match
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
        home_players: matchData.homePlayers as any,
        away_players: matchData.awayPlayers as any
      })
      .eq('match_id', matchData.matchId);

    if (error) {
      console.error('Error updating match:', error);
      throw error;
    }

    // If this is a cup match with scores, check for winner advancement (both new completions and score changes)
    if (isCupMatch && matchData.isCompleted && 
        matchData.homeScore !== undefined && matchData.awayScore !== undefined) {
      console.log('🏆 Cup match with scores being updated:', {
        matchId: matchData.matchId,
        uniqueNumber: matchData.uniqueNumber,
        homeScore: matchData.homeScore,
        awayScore: matchData.awayScore,
        isCupMatch,
        wasAlreadySubmitted,
        isBeingCompleted
      });
      
      try {
        const advanceResult = await cupService.autoAdvanceWinner(matchData.matchId);
        console.log('🚀 Auto-advance result:', advanceResult);
        
        if (advanceResult.success) {
          console.log('✅ Winner advancement processed:', advanceResult.message);
          return { advanceMessage: advanceResult.message };
        } else {
          console.log('⚠️ Could not process winner advancement:', advanceResult.message);
          // Still return some info for draws or other cases
          if (advanceResult.message.includes("Gelijkspel")) {
            return { advanceMessage: "Gelijkspel gedetecteerd - doorschuiving gewist" };
          }
        }
      } catch (advanceError) {
        console.error('❌ Error during auto-advance:', advanceError);
        // Don't throw here - the match update was successful, auto-advance is a bonus feature
      }
    }

    return {};

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
        is_locked: true
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
