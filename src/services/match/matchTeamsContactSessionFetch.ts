import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export interface MatchTeamContactRow {
  team_id: number;
  team_name: string;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  club_colors: string | null;
}

export async function fetchMatchTeamsContactForSession(
  homeTeamId: number,
  awayTeamId: number,
): Promise<MatchTeamContactRow[]> {
  const { data, error } = await supabase.rpc("get_match_teams_contact_for_session", {
    ...getRpcSessionArgs(),
    p_home_team_id: homeTeamId,
    p_away_team_id: awayTeamId,
  });

  if (error) {
    console.error("[fetchMatchTeamsContactForSession] RPC error:", error);
    throw error;
  }

  return (data ?? []) as MatchTeamContactRow[];
}
