import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { useAuth } from "@/hooks/useAuth";

export interface TeamPlayer {
  player_id: number;
  first_name: string;
  last_name: string;
  team_id?: number;
  is_eligible?: boolean; // Added for suspension status
}

// Centralized Query Keys
export const teamPlayerQueryKeys = {
  all: ['teamPlayers'] as const,
  lists: () => [...teamPlayerQueryKeys.all, 'list'] as const,
  list: (teamId: number) => [...teamPlayerQueryKeys.lists(), teamId] as const,
};

// Fetch function
const fetchTeamPlayers = async (teamId: number): Promise<TeamPlayer[]> => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 fetchTeamPlayers called for teamId: ${teamId}`);
  }
  
  try {
    const result = await withUserContext(async () => {
      // Verify context BEFORE query
      if (process.env.NODE_ENV === 'development') {
        const { data: roleBefore } = await supabase.rpc('get_current_user_role');
        const { data: teamIdsBefore } = await supabase.rpc('get_current_user_team_ids');
        console.log(`🔍 Context BEFORE query for team ${teamId}:`, {
          role: roleBefore,
          teamIds: teamIdsBefore,
          timestamp: new Date().toISOString()
        });
      }
      
      const queryStartTime = Date.now();
      const { data, error, count } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, team_id', { count: 'exact' })
        .eq('team_id', teamId)
        .order('first_name')
        .order('last_name');
      const queryDuration = Date.now() - queryStartTime;
      
      // Verify context AFTER query
      if (process.env.NODE_ENV === 'development') {
        const { data: roleAfter } = await supabase.rpc('get_current_user_role');
        console.log(`🔍 Context AFTER query for team ${teamId}:`, {
          role: roleAfter,
          queryDuration: `${queryDuration}ms`
        });
      }
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ Error fetching team players for team ${teamId}:`, error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        }
        throw error;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ fetchTeamPlayers result for team ${teamId}:`, {
          dataLength: data?.length || 0,
          count: count,
          hasError: !!error,
          queryDuration: `${queryDuration}ms`
        });
        
        if (data && data.length === 0 && count !== null && count > 0) {
          console.error(`❌ RLS ISSUE: Count shows ${count} players but query returned 0 - RLS is blocking!`);
        } else if (data && data.length === 0 && (count === null || count === 0)) {
          console.warn(`⚠️ No players found for team ${teamId} (count is 0)`);
        } else {
          console.log(`✅ Successfully fetched ${data?.length || 0} players for team ${teamId}`);
        }
      }
      
      return (data || []) as TeamPlayer[];
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 fetchTeamPlayers END for team ${teamId} - returned ${result.length} players`);
    }
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`💥 Exception in fetchTeamPlayers for team ${teamId}:`, error);
    }
    throw error;
  }
};

/**
 * Hook for fetching team players using React Query
 * Uses React Query for automatic caching, retry logic, and request cancellation
 */
export const useTeamPlayersQuery = (teamId: number | null) => {
  const { user, authContextReady } = useAuth();
  
  // Determine if we should fetch
  const shouldFetch = !!user && authContextReady && teamId !== null && teamId > 0;
  
  // Only log in development and only when query state actually changes
  const prevState = useRef<{ teamId: number | null; shouldFetch: boolean } | null>(null);
  if (process.env.NODE_ENV === 'development') {
    const currentState = { teamId, shouldFetch };
    
    if (!prevState.current || 
        prevState.current.teamId !== currentState.teamId || 
        prevState.current.shouldFetch !== currentState.shouldFetch) {
      console.log('🔍 useTeamPlayersQuery setup:', {
        teamId,
        shouldFetch,
        willFetch: shouldFetch ? `team ${teamId}` : 'DISABLED'
      });
      prevState.current = currentState;
    }
  }
  
  // Create a stable query key
  const queryKey = useMemo(() => {
    return teamPlayerQueryKeys.list(teamId!);
  }, [teamId]);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 useTeamPlayersQuery queryFn called:', {
          teamId,
          timestamp: new Date().toISOString()
        });
      }
      
      if (teamId === null || teamId <= 0) {
        return [];
      }
      
      const result = await fetchTeamPlayers(teamId);
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Query result for team ${teamId}:`, result.length, 'players');
      }
      return result;
    },
    enabled: shouldFetch,
    staleTime: 0, // Always consider data stale - refetch on every request to ensure fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2, // Retry 2 times on error
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000), // Exponential backoff, max 5s
    refetchOnWindowFocus: false, // Don't refetch on tab focus
    refetchOnReconnect: true, // Refetch when connection restored
    refetchInterval: false, // No polling
    placeholderData: undefined, // Don't use placeholder
    networkMode: 'online', // Always fetch fresh data
  });
};

/**
 * Hook for invalidating team player queries after mutations
 */
export const useInvalidateTeamPlayers = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateTeam: (teamId: number) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Invalidating team players query for teamId: ${teamId}`);
      }
      queryClient.invalidateQueries({ queryKey: teamPlayerQueryKeys.list(teamId) });
    },
    invalidateAll: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Invalidating all team player queries');
      }
      queryClient.invalidateQueries({ queryKey: teamPlayerQueryKeys.all });
    },
  };
};

