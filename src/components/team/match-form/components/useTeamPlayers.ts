
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamPlayer {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
  is_active: boolean;
}

export function useTeamPlayers(teamId?: number) {
  return useQuery({
    queryKey: ['teamPlayers', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      if (!teamId) return [];
      const { data, error } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, team_id, is_active')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) {
        throw new Error("Kan spelers niet laden: " + error.message);
      }
      return data as TeamPlayer[];
    }
  });
}
