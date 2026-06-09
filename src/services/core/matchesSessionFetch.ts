import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export interface MatchFormsRow {
  match_id: number;
  unique_number: string | null;
  match_date: string;
  location: string | null;
  speeldag: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  referee: string | null;
  referee_notes: string | null;
  is_submitted: boolean | null;
  is_locked: boolean | null;
  home_players: unknown;
  away_players: unknown;
  is_cup_match: boolean | null;
  is_playoff_match: boolean | null;
  assigned_referee_id: number | null;
  poll_group_id: string | null;
  poll_month: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
}

async function fetchMatchesForForms(
  competitionType?: "league" | "cup" | "playoff" | null,
): Promise<MatchFormsRow[]> {
  const { data, error } = await supabase.rpc("get_matches_for_forms", {
    ...getRpcSessionArgs(),
    p_team_id: 0,
    p_has_elevated_permissions: true,
    p_competition_type: competitionType ?? null,
    p_referee_user_id: null,
    p_referee_username: null,
  });
  if (error) throw error;
  return (data ?? []) as MatchFormsRow[];
}

export async function fetchMatchForSession(
  matchId: number,
): Promise<MatchFormsRow | null> {
  const matches = await fetchMatchesForForms();
  return matches.find((m) => m.match_id === matchId) ?? null;
}

export async function fetchCupMatchesForSession(): Promise<MatchFormsRow[]> {
  return fetchMatchesForForms("cup");
}

export async function fetchAllMatchesForSession(): Promise<MatchFormsRow[]> {
  return fetchMatchesForForms(null);
}

export async function fetchMatchesForMonth(
  month: string,
  competitionType?: "league" | "cup" | "playoff" | null,
): Promise<MatchFormsRow[]> {
  const [year, monthNum] = month.split("-").map(Number);
  const nextMonth =
    monthNum === 12
      ? `${year + 1}-01`
      : `${year}-${String(monthNum + 1).padStart(2, "0")}`;
  const start = `${month}-01`;
  const end = `${nextMonth}-01`;

  const matches = await fetchMatchesForForms(competitionType);
  return matches.filter((m) => {
    const d = m.match_date?.split("T")[0] ?? "";
    return d >= start.slice(0, 10) && m.match_date < end;
  });
}
