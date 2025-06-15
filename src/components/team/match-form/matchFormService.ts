
import { MatchFormData } from "./types";
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
  // Base: join met match_forms zodat we altijd een form hebben per team/match
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
        form_id,
        team_id,
        is_submitted,
        is_locked,
        home_score,
        away_score,
        referee,
        referee_notes
      )
    `);

  // Permissies
  if (!hasElevatedPermissions && teamId) {
    // Team mag alleen z'n eigen formulieren zien
    query = query.or(
      `home_team_id.eq.${teamId},away_team_id.eq.${teamId}`
    );
  }

  const { data, error } = await query.order("match_date", { ascending: true });

  if (error || !data) {
    console.error("[fetchUpcomingMatches] Error:", error);
    return [];
  }

  // Map voor elk 'match_form' record bij de juiste match/team
  const list: MatchFormData[] = [];
  for (const row of data as any[]) {
    // Er zijn voor elke match altijd 2 match_forms: 1 per team
    const teamForms: any[] = Array.isArray(row.match_forms)
      ? row.match_forms
      : row.match_forms
        ? [row.match_forms]
        : [];
    // Filter forms op team
    let relevantForms = teamForms;
    if (!hasElevatedPermissions && teamId) {
      relevantForms = teamForms.filter((f) => f.team_id === teamId);
    }
    // Admin/ref: zien alle forms
    // Geef per gevonden formulier 1 MatchFormData terug
    for (const form of relevantForms) {
      // Parse datum
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
        isHomeTeam: form.team_id === row.home_team_id,
        matchday: row.matchday_id ? `Speeldag ${row.matchday_id}` : "",
        isCompleted: !!form.is_submitted,
        isLocked: !!form.is_locked,
        playersSubmitted: !!form.is_submitted,
        homeScore: form.home_score ?? undefined,
        awayScore: form.away_score ?? undefined,
        referee: form.referee ?? "",
        refereeNotes: form.referee_notes ?? "",
      });
    }
  }
  return list;
};

export const updateMatchForm = async (
  matchData: Partial<MatchFormData> & { matchId: number }
): Promise<void> => {
  // Update de juiste match_form via de matchId+teamId
  if (!matchData.matchId) return;
  // Zoek teamId in payload
  const teamId = matchData.isHomeTeam ? matchData.homeTeamId : matchData.awayTeamId;
  if (!teamId) return;

  const updateData: any = {
    // We slaan alle relevante velden op
    home_score: matchData.homeScore,
    away_score: matchData.awayScore,
    referee: matchData.referee,
    referee_notes: matchData.refereeNotes,
    is_submitted: !!matchData.isCompleted,
    updated_at: new Date().toISOString(),
  };

  // Sla niet-gewijzigde velden over
  Object.keys(updateData).forEach((k) => {
    if (updateData[k] === undefined) delete updateData[k];
  });

  const { error } = await supabase
    .from("match_forms")
    .update(updateData)
    .eq("match_id", matchData.matchId)
    .eq("team_id", teamId);

  if (error) {
    console.error("[updateMatchForm] Error:", error);
  }
};

export const lockMatchForm = async (matchId: number, teamId?: number): Promise<void> => {
  // Nu verplichten we ook teamId voor correcte match_form
  if (!teamId) {
    console.warn("[lockMatchForm] Geen teamId meegegeven, kan niet vergrendelen!");
    return;
  }
  const { error } = await supabase
    .from("match_forms")
    .update({
      is_locked: true,
      updated_at: new Date().toISOString(),
    })
    .eq("match_id", matchId)
    .eq("team_id", teamId);

  if (error) {
    console.error("[lockMatchForm] Error:", error);
  }
};

/**
 * Haal een specifiek match_form op voor een team + match
 */
export const getMatchForm = async (
  matchId: number,
  teamId: number
): Promise<MatchFormData | null> => {
  // Haal data uit match + match_form
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
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
        form_id,
        team_id,
        is_submitted,
        is_locked,
        home_score,
        away_score,
        referee,
        referee_notes
      )
      `
    )
    .eq("match_id", matchId)
    .maybeSingle();

  if (error || !data || !data.match_forms) return null;

  // Haal alleen de form van het gezochte team (of de eerste als admin)
  const form = Array.isArray(data.match_forms)
    ? data.match_forms.find((f) => f.team_id === teamId) || data.match_forms[0]
    : data.match_forms;

  let date = "", time = "";
  if (data.match_date) {
    const d = new Date(data.match_date);
    date = d.toISOString().slice(0, 10);
    time = d.toISOString().slice(11, 16);
  }
  
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
    isHomeTeam: form.team_id === data.home_team_id,
    matchday: data.matchday_id ? `Speeldag ${data.matchday_id}` : "",
    isCompleted: !!form.is_submitted,
    isLocked: !!form.is_locked,
    playersSubmitted: !!form.is_submitted,
    homeScore: form.home_score ?? undefined,
    awayScore: form.away_score ?? undefined,
    referee: form.referee ?? "",
    refereeNotes: form.referee_notes ?? ""
  };
};
