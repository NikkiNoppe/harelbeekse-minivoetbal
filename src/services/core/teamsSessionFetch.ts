import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import type { Team } from "@/services/core/teamService";

export interface TeamSessionRow {
  team_id: number;
  team_name: string;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  club_colors: string | null;
  preferred_play_moments: Team["preferred_play_moments"] | null;
}

function mapTeamRow(row: TeamSessionRow): Team {
  return {
    team_id: row.team_id,
    team_name: row.team_name,
    contact_person: row.contact_person ?? undefined,
    contact_phone: row.contact_phone ?? undefined,
    contact_email: row.contact_email ?? undefined,
    club_colors: row.club_colors ?? undefined,
    preferred_play_moments: row.preferred_play_moments ?? undefined,
  };
}

export async function fetchTeamsForSession(teamId?: number): Promise<Team[]> {
  const { data, error } = await supabase.rpc("get_teams_for_session", {
    ...getRpcSessionArgs(),
    p_team_id: teamId ?? undefined,
  });
  if (error) {
    console.error("[fetchTeamsForSession] RPC error:", error);
    throw error;
  }
  return ((data ?? []) as TeamSessionRow[]).map(mapTeamRow);
}

export async function fetchTeamForSession(teamId: number): Promise<Team | null> {
  const teams = await fetchTeamsForSession(teamId);
  return teams[0] ?? null;
}
