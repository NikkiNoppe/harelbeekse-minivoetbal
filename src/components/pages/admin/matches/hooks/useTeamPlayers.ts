
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";

export interface TeamPlayer {
  player_id: number;
  first_name: string;
  last_name: string;
  team_id?: number;
  is_eligible?: boolean; // Added for suspension status
}

interface UseTeamPlayersReturn {
  players: TeamPlayer[] | undefined;
  loading: boolean;
  error: any;
  refetch: () => Promise<void>;
}

interface UseTeamPlayersWithSuspensionReturn extends UseTeamPlayersReturn {
  playersWithSuspensions: TeamPlayer[] | undefined;
  suspensionLoading: boolean;
}

// Enhanced hook that includes suspension data for match forms
export const useTeamPlayersWithSuspensions = (teamId: number, matchDate?: Date): UseTeamPlayersWithSuspensionReturn => {
  const baseHook = useTeamPlayers(teamId);
  const [playersWithSuspensions, setPlayersWithSuspensions] = useState<TeamPlayer[] | undefined>(undefined);
  const [suspensionLoading, setSuspensionLoading] = useState(false);

  useEffect(() => {
    const loadSuspensions = async () => {
      if (!baseHook.players?.length || !matchDate) {
        setPlayersWithSuspensions(baseHook.players);
        return;
      }

      setSuspensionLoading(true);
      try {
        // Import suspensionService dynamically to avoid circular imports
        const { suspensionService } = await import('@/services');
        
        const playerIds = baseHook.players.map(p => p.player_id);
        const eligibilityMap = await suspensionService.checkBatchPlayerEligibility(playerIds, matchDate);
        
        const playersWithEligibility = baseHook.players.map(player => ({
          ...player,
          is_eligible: eligibilityMap[player.player_id] ?? true
        }));
        
        setPlayersWithSuspensions(playersWithEligibility);
      } catch (error) {
        console.error('Error loading suspensions:', error);
        // Fallback: set all players as eligible
        setPlayersWithSuspensions(baseHook.players?.map(p => ({ ...p, is_eligible: true })));
      } finally {
        setSuspensionLoading(false);
      }
    };

    loadSuspensions();
  }, [baseHook.players, matchDate]);

  return {
    ...baseHook,
    playersWithSuspensions,
    suspensionLoading
  };
};

export const useTeamPlayers = (teamId: number): UseTeamPlayersReturn => {
  const [players, setPlayers] = useState<TeamPlayer[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchPlayers = useCallback(async (attempt = 0) => {
    if (!teamId) {
      setPlayers(undefined);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add retry delay for failed attempts
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * attempt, 3000)));
      }

      // Use withUserContext to ensure proper RLS access for Team Managers
      const { data, error: fetchError } = await withUserContext(async () => {
        return await supabase
          .from('players')
          .select('player_id, first_name, last_name, team_id')
          .eq('team_id', teamId)
          .order('first_name');
      });

      if (fetchError) {
        throw fetchError;
      }

      setPlayers(data || []);
      setRetryCount(0);
    } catch (err) {
      console.error(`Error fetching team players (attempt ${attempt + 1}):`, err);
      setError(err);
      
      // Retry logic - up to 3 attempts
      if (attempt < 2) {
        setRetryCount(attempt + 1);
        setTimeout(() => fetchPlayers(attempt + 1), Math.min(1000 * (attempt + 1), 3000));
      } else {
        setPlayers(undefined);
        setRetryCount(0);
      }
    } finally {
      if (attempt >= 2 || error === null) {
        setLoading(false);
      }
    }
  }, [teamId]);

  const refetch = useCallback(async () => {
    setRetryCount(0);
    await fetchPlayers(0);
  }, [fetchPlayers]);

  const memoizedPlayers = useMemo(() => players, [players]);

  useEffect(() => {
    fetchPlayers(0);
  }, [fetchPlayers]);

  return {
    players: memoizedPlayers,
    loading: loading || retryCount > 0,
    error: retryCount >= 2 ? error : null,
    refetch,
  };
};

export default useTeamPlayers;


