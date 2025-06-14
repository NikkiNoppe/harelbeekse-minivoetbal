
import { MatchFormData } from "./types";
import { supabase } from "@/integrations/supabase/client";

// Fetch upcoming or all matches (admins/referees see all)
export const fetchUpcomingMatches = async (
  teamId: number = 0,
  hasElevatedPermissions: boolean = false
): Promise<MatchFormData[]> => {
  // Build the base query
  let query = supabase
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
      teams_home:home_team_id ( team_name ),
      teams_away:away_team_id ( team_name )
      `
    );

  if (!hasElevatedPermissions && teamId) {
    // Restrict to matches for this team only
    query = query.or(
      `home_team_id.eq.${teamId},away_team_id.eq.${teamId}`
    );
  }

  const { data, error } = await query.order("match_date", { ascending: true });
  if (error || !data) {
    console.error("[fetchUpcomingMatches] Error:", error);
    return [];
  }

  // Map fields from DB to app interface
  return (data as any[]).map((row): MatchFormData => {
    // Parse date/time
    let date = "", time = "";
    if (row.match_date) {
      const d = new Date(row.match_date);
      date = d.toISOString().slice(0, 10);
      time = d.toISOString().slice(11, 16); // "HH:MM"
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
      location: "", // Not present in schema
      isHomeTeam: teamId === row.home_team_id,
      matchday: row.matchday_id ? `Speeldag ${row.matchday_id}` : "",
      isCompleted: false,
      isLocked: false,
      playersSubmitted: false,
    };
  });
};

// Stubs for completion: these would be implemented to write to your DB if needed
export const updateMatchForm = async (
  matchData: Partial<MatchFormData> & { matchId: number }
): Promise<void> => {
  // TODO: implement update logic based on your schema if needed
  console.log("[updateMatchForm] not implemented (database write).");
};

export const lockMatchForm = async (matchId: number): Promise<void> => {
  // TODO: implement lock logic here (e.g., set isLocked field)
  console.log("[lockMatchForm] not implemented (database write).");
};

export const getMatchForm = async (
  matchId: number
): Promise<MatchFormData | null> => {
  // Query the DB for this match
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
      teams_home:home_team_id ( team_name ),
      teams_away:away_team_id ( team_name )
      `
    )
    .eq("match_id", matchId)
    .maybeSingle();

  if (error || !data) return null;

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
    isHomeTeam: false, // Needs user context
    matchday: data.matchday_id ? `Speeldag ${data.matchday_id}` : "",
    isCompleted: false,
    isLocked: false,
    playersSubmitted: false,
  };
};
