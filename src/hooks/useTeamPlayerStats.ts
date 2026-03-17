import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { withUserContext } from "@/lib/supabaseUtils";

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

      return withUserContext(async () => {
        // 1. Fetch players via RPC
        const { data: players, error: playersError } = await supabase.rpc('get_players_for_team', {
          p_user_id: user.id as number,
          p_team_id: teamId,
        });

        if (playersError) {
          console.error('Error fetching players for stats:', playersError);
          throw playersError;
        }

        if (!players || players.length === 0) return [];

        // 2. Fetch player card data (yellow_cards, red_cards) from players table
        const playerIds = players.map((p: any) => p.player_id);
        const { data: cardData } = await supabase
          .from('players')
          .select('player_id, yellow_cards, red_cards')
          .in('player_id', playerIds);

        const cardMap = new Map<number, { yellow: number; red: number }>();
        cardData?.forEach((p: any) => {
          cardMap.set(p.player_id, {
            yellow: p.yellow_cards || 0,
            red: p.red_cards || 0,
          });
        });

        // 3. Fetch all submitted matches for this team
        const { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select('home_players, away_players, home_team_id')
          .eq('is_submitted', true)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);

        if (matchesError) {
          console.error('Error fetching matches for stats:', matchesError);
          throw matchesError;
        }

        // 4. Count appearances per player
        const appearanceCount = new Map<number, number>();

        (matches || []).forEach((match: any) => {
          const isHome = match.home_team_id === teamId;
          const playersArray = isHome ? match.home_players : match.away_players;

          if (Array.isArray(playersArray)) {
            playersArray.forEach((p: any) => {
              if (p?.playerId) {
                const pid = typeof p.playerId === 'string' ? parseInt(p.playerId, 10) : p.playerId;
                appearanceCount.set(pid, (appearanceCount.get(pid) || 0) + 1);
              }
            });
          }
        });

        // 5. Combine and sort by last_name
        return players
          .map((p: any) => ({
            player_id: p.player_id,
            first_name: p.first_name,
            last_name: p.last_name,
            matchCount: appearanceCount.get(p.player_id) || 0,
            yellowCards: cardMap.get(p.player_id)?.yellow || 0,
            redCards: cardMap.get(p.player_id)?.red || 0,
          }))
          .sort((a: PlayerStat, b: PlayerStat) => a.last_name.localeCompare(b.last_name));
      }, {
        userId: user.id as number,
        role: user.role,
        teamIds: String(teamId),
      });
    },
    enabled: !!user && authContextReady && !!teamId && teamId > 0,
    staleTime: 5 * 60 * 1000,
  });
};
