
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { useAuth } from "@/components/pages/login/AuthProvider";

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
  retryCount: number;
  refetch: () => Promise<void>;
}

interface UseTeamPlayersWithSuspensionReturn extends UseTeamPlayersReturn {
  playersWithSuspensions: TeamPlayer[] | undefined;
  suspensionLoading: boolean;
  refetch: () => Promise<void>;
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
        const { suspensionService } = await import('@/domains/cards-suspensions');
        
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

// In-memory cache to prevent losing data during retries
const playerCache = new Map<number, TeamPlayer[]>();

export const useTeamPlayers = (teamId: number): UseTeamPlayersReturn => {
  const { authContextReady } = useAuth();
  const [players, setPlayers] = useState<TeamPlayer[] | undefined>(() => {
    // Initialize from cache if available
    return playerCache.get(teamId) || undefined;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const hasFetchedWithContext = useRef(false);

  const fetchPlayers = useCallback(async (attempt = 0) => {
    if (!teamId) {
      setPlayers(undefined);
      setLoading(false);
      return;
    }

    // Wait for auth context to be ready before fetching
    if (!authContextReady) {
      console.log('⏳ Waiting for auth context to be ready before fetching players...');
      setLoading(true);
      return; // Will be triggered again when authContextReady changes
    }

    try {
      setLoading(true);
      setError(null);

      // Enhanced retry delay with jitter for mobile stability
      if (attempt > 0) {
        const baseDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
        const jitter = Math.random() * 500; // Add randomness to prevent thundering herd
        await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
      }

      // Use withUserContext to ensure proper RLS access for Team Managers
      const { data, error: fetchError } = await withUserContext(async () => {
        return await supabase
          .from('players')
          .select('player_id, first_name, last_name, team_id')
          .eq('team_id', teamId)
          .order('first_name')
          .abortSignal(AbortSignal.timeout(10000)); // 10 second timeout for mobile
      });

      if (fetchError) {
        throw fetchError;
      }

      // Smart empty result handling: distinguish real empty from context-blocked
      if (data?.length === 0 && !hasFetchedWithContext.current) {
        console.log('⚠️ Empty result on first fetch - may be due to context timing');
      }
      
      hasFetchedWithContext.current = true;
      setPlayers(data || []);
      // Cache the data to prevent losing it during retries
      if (data && data.length > 0) {
        playerCache.set(teamId, data);
      }
      setRetryCount(0);
      setLoading(false); // Success - loading complete
    } catch (err) {
      console.error(`Error fetching team players (attempt ${attempt + 1}):`, err);
      setError(err);
      
      // Enhanced retry logic - up to 4 attempts for mobile
      if (attempt < 3) {
        setRetryCount(attempt + 1);
        // Keep loading: true during retries
        setLoading(true);
        // Use exponential backoff with longer delays for mobile
        const retryDelay = Math.min(1000 * Math.pow(2, attempt + 1), 8000);
        setTimeout(() => fetchPlayers(attempt + 1), retryDelay);
      } else {
        // After all retries failed, use cached data if available
        const cachedData = playerCache.get(teamId);
        if (cachedData && cachedData.length > 0) {
          console.log('Using cached player data after fetch failure');
          setPlayers(cachedData);
          setError(null); // Clear error since we have fallback data
        } else {
          setPlayers(undefined);
        }
        setRetryCount(0);
        setLoading(false); // All retries failed - stop loading
      }
    }
  }, [teamId, authContextReady]);

  const refetch = useCallback(async () => {
    setRetryCount(0);
    hasFetchedWithContext.current = false;
    await fetchPlayers(0);
  }, [fetchPlayers]);

  const memoizedPlayers = useMemo(() => players, [players]);

  // Fetch when teamId changes OR when authContextReady becomes true
  useEffect(() => {
    if (authContextReady) {
      fetchPlayers(0);
    }
  }, [fetchPlayers, authContextReady]);

  // Auto-retry if we got empty results before context was ready
  useEffect(() => {
    if (authContextReady && (!players || players.length === 0) && hasFetchedWithContext.current === false) {
      console.log('🔄 Auth context now ready, retrying player fetch...');
      fetchPlayers(0);
    }
  }, [authContextReady, players, fetchPlayers]);

  return {
    players: memoizedPlayers,
    loading: loading || retryCount > 0,
    error: retryCount >= 3 ? error : null, // Only show error after all retries
    retryCount,
    refetch,
  };
};

export default useTeamPlayers;


