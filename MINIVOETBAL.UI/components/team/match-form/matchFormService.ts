import { supabase } from '../../../../MINIVOETBAL.SDK/client';
import { MatchFormData } from './types';
import { localDateTimeToISO, isoToLocalDateTime, getCurrentISO } from '../../../../MINIVOETBAL.UI/lib/dateUtils';
import { cupService } from '../../../../MINIVOETBAL.SERVICES/match/cupService';
import { sortCupMatches, sortLeagueMatches } from '../../../../MINIVOETBAL.UI/lib/matchSortingUtils';

export const fetchUpcomingMatches = async (teamId: number, hasElevatedPermissions: boolean = false, competitionType?: 'league' | 'cup'): Promise<MatchFormData[]> => {
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

    const { data, error, status } = await query;

    if (error) {
      // Extra debug info voor Supabase policies/errors
      console.error("[fetchUpcomingMatches] Supabase error:", error, "Status:", status);
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission')) {
        throw new Error('Geen toegang tot wedstrijden. Controleer Supabase policies/RLS. (' + error.message + ')');
      }
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
    // Verbeterde logging
    console.error("[fetchUpcomingMatches] Exception:", error);
    throw new Error('Fout bij ophalen wedstrijden: ' + (error?.message || error));
  }
};

export const updateMatchForm = async (matchData: MatchFormData): Promise<{advanceMessage?: string}> => {
  try {
    // First check if this is a cup match that's being completed
    const { data: existingMatch, error: fetchError, status: fetchStatus } = await supabase
      .from('matches')
      .select('is_cup_match, is_submitted, unique_number')
      .eq('match_id', matchData.matchId)
      .single();

    if (fetchError) {
      console.error('Error fetching existing match:', fetchError, 'Status:', fetchStatus);
      if (fetchError.code === '42501' || fetchError.message?.toLowerCase().includes('permission')) {
        throw new Error('Geen toegang tot deze wedstrijd. Controleer Supabase policies/RLS. (' + fetchError.message + ')');
      }
      throw fetchError;
    }

    const isCupMatch = existingMatch?.is_cup_match;
    const wasAlreadySubmitted = existingMatch?.is_submitted;
    const isBeingCompleted = matchData.isCompleted && !wasAlreadySubmitted;

    // Update the match
    const { error: updateError, status: updateStatus } = await supabase
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
        away_players: matchData.awayPlayers as any // Cast to any to satisfy Json type
      })
      .eq('match_id', matchData.matchId);

    if (updateError) {
      console.error('Error updating match:', updateError, 'Status:', updateStatus);
      if (updateError.code === '42501' || updateError.message?.toLowerCase().includes('permission')) {
        throw new Error('Geen toegang tot updaten van deze wedstrijd. Controleer Supabase policies/RLS. (' + updateError.message + ')');
      }
      throw updateError;
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
        let winnerTeamId: number | null = null;
        if (matchData.homeScore! > matchData.awayScore!) {
          winnerTeamId = matchData.homeTeamId;
        } else if (matchData.awayScore! > matchData.homeScore!) {
          winnerTeamId = matchData.awayTeamId;
        }
        const nextRound = cupService.getNextMatchUniqueNumber(matchData.uniqueNumber);
        if (winnerTeamId && nextRound) {
          const advanceResult = await cupService.advanceWinner(matchData.matchId, winnerTeamId, nextRound);
          console.log('🚀 Auto-advance result:', advanceResult);
          if (advanceResult.success) {
            console.log('✅ Winner advancement processed:', advanceResult.message);
            return { advanceMessage: advanceResult.message };
          } else {
            console.log('⚠️ Could not process winner advancement:', advanceResult.message);
            if (advanceResult.message.includes("Gelijkspel")) {
              return { advanceMessage: "Gelijkspel gedetecteerd - doorschuiving gewist" };
            }
          }
        }
      } catch (advanceError) {
        console.error('❌ Error during auto-advance:', advanceError);
      }
    }

    return {};

  } catch (error) {
    console.error('Error in updateMatchForm:', error);
    throw new Error('Fout bij opslaan wedstrijdformulier: ' + (error?.message || error));
  }
};

export const lockMatchForm = async (matchId: number): Promise<void> => {
  try {
    const { error, status } = await supabase
      .from('matches')
      .update({
        is_locked: true
      })
      .eq('match_id', matchId);

    if (error) {
      console.error('Error locking match:', error, 'Status:', status);
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission')) {
        throw new Error('Geen toegang tot locken van deze wedstrijd. Controleer Supabase policies/RLS. (' + error.message + ')');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in lockMatchForm:', error);
    throw new Error('Fout bij locken van wedstrijdformulier: ' + (error?.message || error));
  }
};
