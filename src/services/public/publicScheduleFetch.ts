import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_ORGANIZATION_ID } from "@/config/organization";

export interface PublicMatchRow {
  match_id: number;
  unique_number: string | null;
  match_date: string;
  location: string | null;
  speeldag: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  home_position: number | null;
  away_position: number | null;
  referee: string | null;
  is_submitted: boolean | null;
  is_locked: boolean | null;
  is_cup_match: boolean | null;
  is_playoff_match: boolean | null;
  is_playoff_finalized: boolean | null;
  playoff_type: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
}

export interface PublicTeamRow {
  team_id: number;
  team_name: string;
  club_colors: string | null;
}

export async function fetchPublicMatches(
  organizationId: number = DEFAULT_ORGANIZATION_ID,
): Promise<PublicMatchRow[]> {
  const { data, error } = await supabase.rpc("get_public_matches", {
    p_organization_id: organizationId,
  });
  if (error) {
    console.error("[fetchPublicMatches] RPC error:", error);
    throw error;
  }
  return (data ?? []) as PublicMatchRow[];
}

export async function fetchPublicTeams(
  organizationId: number = DEFAULT_ORGANIZATION_ID,
): Promise<PublicTeamRow[]> {
  const { data, error } = await supabase.rpc("get_public_teams", {
    p_organization_id: organizationId,
  });
  if (error) {
    console.error("[fetchPublicTeams] RPC error:", error);
    throw error;
  }
  return (data ?? []) as PublicTeamRow[];
}

export function isRegularMatch(row: PublicMatchRow): boolean {
  return !row.is_cup_match && !row.is_playoff_match;
}

export function isCupMatch(row: PublicMatchRow): boolean {
  return !!row.is_cup_match;
}

export function isPlayoffMatch(row: PublicMatchRow): boolean {
  return !!row.is_playoff_match;
}
