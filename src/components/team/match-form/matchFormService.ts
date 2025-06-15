import { MatchFormData, PlayerSelection } from "./types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Ophalen van alle aankomende of relevante wedstrijdformulieren 
 * gebaseerd op het team en de rechten van de gebruiker.
 * 
 * @param teamId Het id van het team (voor teammanager, verplicht)
 * @param hasElevatedPermissions True als admin/referee (ziet alles), anders alleen eigen team
 */
export const fetchUpcomingMatches = async (
  teamId: number = 0,
  hasElevatedPermissions: boolean = false
): Promise<MatchFormData[]> => {
  // Base query: join with matches and grab the forms for each match
  let query = supabase
    .from("matches")
    .select(`
      match_id,
      unique_number,
      match_date,
      home_team_id,
      away_team_id,
      is_cup_match,
      matchday_id,
      teams_home:teams!home_team_id ( team_name ),
      teams_away:teams!away_team_id ( team_name ),
      match_forms:match_forms (
        is_submitted,
        is_locked,
        home_score,
        away_score,
        referee,
        referee_notes,
        home_players,
        away_players
      )
    `);

  if (!hasElevatedPermissions && teamId) {
    query = query.or(
      `home_team_id.eq.${teamId},away_team_id.eq.${teamId}`
    );
  }

  const { data, error } = await query.order("match_date", { ascending: true });

  if (error || !data) {
    console.error("[fetchUpcomingMatches] Error:", error);
    return [];
  }

  const list: MatchFormData[] = [];
  for (const row of data as any[]) {
    // Per match, match_forms (should always be 1!)
    const form = Array.isArray(row.match_forms) && row.match_forms.length > 0 ? row.match_forms[0] : null;
    // Parse date/time
    let date = "", time = "";
    if (row.match_date) {
      const d = new Date(row.match_date);
      date = d.toISOString().slice(0, 10);
      time = d.toISOString().slice(11, 16);
    }
    list.push({
      matchId: row.match_id,
      uniqueNumber: row.unique_number || "",
      date,
      time,
      homeTeamId: row.home_team_id,
      homeTeamName: row.teams_home?.team_name || "Onbekend",
      awayTeamId: row.away_team_id,
      awayTeamName: row.teams_away?.team_name || "Onbekend",
      location: "",
      matchday: row.matchday_id ? `Speeldag ${row.matchday_id}` : "",
      isCompleted: !!form?.is_submitted,
      isLocked: !!form?.is_locked,
      homeScore: form?.home_score ?? undefined,
      awayScore: form?.away_score ?? undefined,
      referee: form?.referee ?? "",
      refereeNotes: form?.referee_notes ?? "",
      homePlayers: form?.home_players || [],
      awayPlayers: form?.away_players || []
    });
  }
  return list;
};

// New: Fetch a single match form with unified player arrays (and correct source tables)
export const fetchMatchForm = async (matchId: number): Promise<MatchFormData | null> => {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      match_id,
      unique_number,
      match_date,
      home_team_id,
      away_team_id,
      is_cup_match,
      matchday_id,
      teams_home:teams!home_team_id ( team_name ),
      teams_away:teams!away_team_id ( team_name ),
      match_forms:match_forms (
        is_submitted,
        is_locked,
        home_score,
        away_score,
        referee,
        referee_notes,
        home_players,
        away_players
      )
    `)
    .eq("match_id", matchId)
    .maybeSingle();

  if (error || !data) return null;

  let date = "", time = "";
  if (data.match_date) {
    const d = new Date(data.match_date);
    date = d.toISOString().slice(0, 10);
    time = d.toISOString().slice(11, 16);
  }
  const form = Array.isArray(data.match_forms) && data.match_forms.length > 0 ? data.match_forms[0] : null;

  return {
    matchId: data.match_id,
    uniqueNumber: data.unique_number || "",
    date,
    time,
    homeTeamId: data.home_team_id,
    homeTeamName: data.teams_home?.team_name || "Onbekend",
    awayTeamId: data.away_team_id,
    awayTeamName: data.teams_away?.team_name || "Onbekend",
    location: "",
    matchday: data.matchday_id ? `Speeldag ${data.matchday_id}` : "",
    isCompleted: !!form?.is_submitted,
    isLocked: !!form?.is_locked,
    homeScore: form?.home_score ?? undefined,
    awayScore: form?.away_score ?? undefined,
    referee: form?.referee ?? "",
    refereeNotes: form?.referee_notes ?? "",
    homePlayers: form?.home_players || [],
    awayPlayers: form?.away_players || []
  };
};

// New: Save (update) the single match form, with home/away players
export const updateMatchForm = async (
  matchData: Partial<MatchFormData> & { matchId: number }
): Promise<void> => {
  if (!matchData.matchId) return;
  const updateData: any = {
    home_score: matchData.homeScore,
    away_score: matchData.awayScore,
    referee: matchData.referee,
    referee_notes: matchData.refereeNotes,
    is_submitted: !!matchData.isCompleted,
    is_locked: !!matchData.isLocked,
    home_players: matchData.homePlayers,
    away_players: matchData.awayPlayers,
    updated_at: new Date().toISOString(),
  };
  Object.keys(updateData).forEach((k) => {
    if (updateData[k] === undefined) delete updateData[k];
  });

  const { error } = await supabase
    .from("match_forms")
    .update(updateData)
    .eq("match_id", matchData.matchId);

  if (error) {
    console.error("[updateMatchForm] Error:", error);
  }
};

export const lockMatchForm = async (matchId: number): Promise<void> => {
  const { error } = await supabase
    .from("match_forms")
    .update({
      is_locked: true,
      updated_at: new Date().toISOString(),
    })
    .eq("match_id", matchId);

  if (error) {
    console.error("[lockMatchForm] Error:", error);
  }
};
