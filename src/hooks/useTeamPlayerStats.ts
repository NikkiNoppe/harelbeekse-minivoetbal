import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getRpcSessionArgs } from "@/lib/authSession";

export interface PlayerStat {
  player_id: number;
  first_name: string;
  last_name: string;
  matchCount: number;
  yellowCards: number;
  redCards: number;
}

export const useTeamPlayerStats = (teamId: number | null) => {
  const { user, authContextReady } = useAuth();

  return useQuery({
    queryKey: ['teamPlayerStats', teamId],
    queryFn: async (): Promise<PlayerStat[]> => {
      if (!teamId || !user?.id) return [];

      const { data: players, error: playersError } = await supabase.rpc('get_players_for_session', {
        ...getRpcSessionArgs(),
        p_team_id: teamId,
      });

      if (playersError) {
        console.error('Error fetching players for stats:', playersError);
        throw playersError;
      }

      if (!players || players.length === 0) return [];

      const cardMap = new Map<number, { yellow: number; red: number }>();
      (players as Array<{ player_id: number; yellow_cards?: number; red_cards?: number }>).forEach((p) => {
        cardMap.set(p.player_id, {
          yellow: p.yellow_cards || 0,
          red: p.red_cards || 0,
        });
      });

      const { data: allMatches, error: matchesError } = await supabase.rpc('get_matches_for_forms', {
        ...getRpcSessionArgs(),
        p_team_id: teamId,
        p_has_elevated_permissions: false,
        p_competition_type: null,
        p_referee_user_id: null,
        p_referee_username: null,
      });

      if (matchesError) {
        console.error('Error fetching matches for stats:', matchesError);
        throw matchesError;
      }

      const matches = (allMatches || []).filter((m: { is_submitted?: boolean }) => m.is_submitted);
      const appearanceCount = new Map<number, number>();

      matches.forEach((match: {
        home_team_id?: number;
        home_players?: unknown;
        away_players?: unknown;
      }) => {
        const isHome = match.home_team_id === teamId;
        const playersArray = isHome ? match.home_players : match.away_players;

        if (Array.isArray(playersArray)) {
          playersArray.forEach((p: { playerId?: number | string }) => {
            if (p?.playerId) {
              const pid = typeof p.playerId === 'string' ? parseInt(p.playerId, 10) : p.playerId;
              appearanceCount.set(pid, (appearanceCount.get(pid) || 0) + 1);
            }
          });
        }
      });

      return (players as Array<{ player_id: number; first_name: string; last_name: string }>)
        .map((p) => ({
          player_id: p.player_id,
          first_name: p.first_name,
          last_name: p.last_name,
          matchCount: appearanceCount.get(p.player_id) || 0,
          yellowCards: cardMap.get(p.player_id)?.yellow || 0,
          redCards: cardMap.get(p.player_id)?.red || 0,
        }))
        .sort((a, b) => a.last_name.localeCompare(b.last_name));
    },
    enabled: !!user && authContextReady && !!teamId && teamId > 0,
    staleTime: 5 * 60 * 1000,
  });
};
