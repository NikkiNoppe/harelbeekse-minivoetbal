
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../../MINIVOETBAL.SDK/client";

export interface TeamPlayer {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
}

export function useTeamPlayers(teamId?: number) {
  return useQuery({
    queryKey: ['teamPlayers', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, team_id')
        .eq('team_id', teamId)
        .order('first_name', { ascending: true });

      if (error) {
        throw new Error("Kan spelers niet laden: " + error.message);
      }
      return data as TeamPlayer[];
    }
  });
}
