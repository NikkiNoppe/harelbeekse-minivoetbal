import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";

export interface PlayerSessionRow {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
}

export async function fetchPlayersForSession(
  teamId?: number | null,
): Promise<PlayerSessionRow[]> {
  const { data, error } = await supabase.rpc("get_players_for_session", {
    ...getRpcSessionArgs(),
    p_team_id: teamId ?? null,
  });
  if (error) throw error;
  return (data ?? []) as PlayerSessionRow[];
}

export async function findPlayerSessionMatch(
  firstName: string,
  lastName: string,
  birthDate?: string,
  excludePlayerId?: number,
): Promise<(PlayerSessionRow & { team_name?: string }) | null> {
  const players = await fetchPlayersForSession(null);
  const match = players.find((p) => {
    if (excludePlayerId && p.player_id === excludePlayerId) return false;
    if (p.first_name.trim() !== firstName.trim()) return false;
    if (p.last_name.trim() !== lastName.trim()) return false;
    if (birthDate !== undefined && p.birth_date !== birthDate) return false;
    return true;
  });
  return match ?? null;
}
