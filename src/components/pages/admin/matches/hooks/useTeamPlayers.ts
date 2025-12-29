
import { useState, useEffect, useRef } from "react";
import { useTeamPlayersQuery } from "@/hooks/useTeamPlayersQuery";

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
      // Always set players immediately (even if empty) so UI doesn't show "niet beschikbaar"
      // If no players, just use base players (which could be undefined or empty array)
      if (!baseHook.players) {
        setPlayersWithSuspensions(undefined);
        return;
      }

      // If no matchDate or empty players array, just use base players without suspension check
      if (baseHook.players.length === 0 || !matchDate) {
        setPlayersWithSuspensions(baseHook.players);
        return;
      }

      // Set players immediately with default eligibility (true) to prevent "niet beschikbaar" during loading
      setPlayersWithSuspensions(baseHook.players.map(p => ({ ...p, is_eligible: true })));

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
        // Fallback: set all players as eligible (already set above, but update to be sure)
        setPlayersWithSuspensions(baseHook.players.map(p => ({ ...p, is_eligible: true })));
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
  // Loading time management: minimum 250ms, maximum 15000ms timeout for slow connections
  const MIN_LOADING_TIME = 250; // Minimum 250ms for better UX
  const MAX_LOADING_TIME = 15000; // Maximum 15000ms timeout (15s for 3G/4G)
  
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [hasAutoRetried, setHasAutoRetried] = useState(false);
  const loadingStartTimeRef = useRef<number | null>(null);
  const minTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use React Query hook
  const playersQuery = useTeamPlayersQuery(teamId);
  
  // Track when loading starts and enforce minimum/maximum loading time
  useEffect(() => {
    const isQueryLoading = playersQuery.isLoading || playersQuery.isFetching;
    
    if (isQueryLoading) {
      // Loading started
      if (loadingStartTimeRef.current === undefined || loadingStartTimeRef.current === null) {
        loadingStartTimeRef.current = Date.now();
        setMinLoadingTimeElapsed(false);
        setLoadingTimeout(false);
        
        // Clear any existing timeouts
        if (minTimeoutRef.current) {
          clearTimeout(minTimeoutRef.current);
          minTimeoutRef.current = null;
        }
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = null;
        }
        
        // Set maximum timeout (15000ms) - show error if exceeded
        maxTimeoutRef.current = setTimeout(() => {
          setLoadingTimeout(true);
          loadingStartTimeRef.current = null;
          if (process.env.NODE_ENV === 'development') {
            console.error(`❌ Loading timeout for team players after ${MAX_LOADING_TIME}ms`);
          }
          
          // Auto-retry once on timeout if not already tried
          if (!hasAutoRetried) {
            setHasAutoRetried(true);
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Auto-retrying after timeout...');
            }
            playersQuery.refetch();
          }
        }, MAX_LOADING_TIME);
      }
    } else {
      // Loading finished - check if minimum time has elapsed
      if (loadingStartTimeRef.current !== undefined && loadingStartTimeRef.current !== null) {
        const elapsed = Date.now() - loadingStartTimeRef.current;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
        
        // Clear maximum timeout since loading finished
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = null;
        }
        
        if (remainingTime > 0) {
          // Clear any existing minimum timeout
          if (minTimeoutRef.current) {
            clearTimeout(minTimeoutRef.current);
          }
          // Set timeout to complete minimum loading time
          minTimeoutRef.current = setTimeout(() => {
            setMinLoadingTimeElapsed(true);
            loadingStartTimeRef.current = null;
            minTimeoutRef.current = null;
          }, remainingTime);
        } else {
          // Already exceeded minimum time
          setMinLoadingTimeElapsed(true);
          loadingStartTimeRef.current = null;
          if (minTimeoutRef.current) {
            clearTimeout(minTimeoutRef.current);
            minTimeoutRef.current = null;
          }
        }
      } else {
        // No loading was tracked, ensure elapsed is true
        setMinLoadingTimeElapsed(true);
      }
    }
    
    // Cleanup timeouts on unmount
    return () => {
      if (minTimeoutRef.current) {
        clearTimeout(minTimeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [playersQuery.isLoading, playersQuery.isFetching, hasAutoRetried]);

  // Reset auto-retry flag when teamId changes
  useEffect(() => {
    setHasAutoRetried(false);
    setLoadingTimeout(false);
  }, [teamId]);
  
  // Calculate final loading state: query loading OR minimum time not elapsed AND no timeout
  const isLoading = !loadingTimeout && (playersQuery.isLoading || playersQuery.isFetching || !minLoadingTimeElapsed);
  
  // Enhanced error handling - combine query errors with timeout errors
  const error = playersQuery.error || (loadingTimeout && !playersQuery.data ? new Error("Loading timeout - slechte verbinding") : null);
  
  const refetch = async () => {
    setLoadingTimeout(false);
    setHasAutoRetried(false);
    await playersQuery.refetch();
  };
  
  return {
    players: playersQuery.data,
    loading: isLoading,
    error: error,
    retryCount: playersQuery.failureCount || 0,
    refetch,
  };
};

export default useTeamPlayers;
