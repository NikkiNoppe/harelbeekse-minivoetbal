
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TeamPlayer {
  player_id: number;
  first_name: string;
  last_name: string;
  team_id?: number;
}

interface UseTeamPlayersReturn {
  players: TeamPlayer[] | undefined;
  loading: boolean;
  error: any;
  refetch: () => Promise<void>;
}

export const useTeamPlayers = (teamId: number): UseTeamPlayersReturn => {
  const [players, setPlayers] = useState<TeamPlayer[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchPlayers = useCallback(async () => {
    if (!teamId) {
      setPlayers(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, team_id')
        .eq('team_id', teamId)
        .order('first_name');

      if (fetchError) {
        throw fetchError;
      }

      setPlayers(data || []);
    } catch (err) {
      console.error('Error fetching team players:', err);
      setError(err);
      setPlayers(undefined);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // Memoize the refetch function
  const refetch = useCallback(async () => {
    await fetchPlayers();
  }, [fetchPlayers]);

  // Memoize the players data to prevent unnecessary re-renders
  const memoizedPlayers = useMemo(() => players, [players]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return {
    players: memoizedPlayers,
    loading,
    error,
    refetch,
  };
};

export default useTeamPlayers;
