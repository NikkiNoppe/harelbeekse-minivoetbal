import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { useAuth } from "@/hooks/useAuth";

export interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
  teams?: {
    team_id: number;
    team_name: string;
  };
}

export interface Team {
  team_id: number;
  team_name: string;
}

// Centralized Query Keys - voor consistentie en cache management
export const playerQueryKeys = {
  all: ['players'] as const,
  lists: () => [...playerQueryKeys.all, 'list'] as const,
  list: (teamId: number | null) => [...playerQueryKeys.lists(), teamId] as const,
  details: () => [...playerQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...playerQueryKeys.details(), id] as const,
};

// Fetch Functions
const fetchAllPlayers = async (): Promise<Player[]> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 fetchAllPlayers called');
  }
  
  try {
    const result = await withUserContext(async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Executing Supabase query for all players...');
      }
      
      // Verify context is set before querying
      if (process.env.NODE_ENV === 'development') {
        const { data: roleCheck } = await supabase.rpc('get_current_user_role');
        console.log('🔍 Current role in context before query:', roleCheck);
      }
      
      const { data, error, count } = await supabase
        .from('players')
        .select(`
          player_id,
          first_name,
          last_name,
          birth_date,
          team_id,
          teams (
            team_id,
            team_name
          )
        `, { count: 'exact' })
        .order('last_name')
        .order('first_name');
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error fetching all players:', error);
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
        console.log(`✅ fetchAllPlayers result:`, {
          dataLength: data?.length || 0,
          count: count,
          hasError: !!error,
          firstPlayer: data?.[0] || null
        });
        
        if (data && data.length === 0 && count !== null && count > 0) {
          console.error('❌ RLS ISSUE: Query returned 0 players but count shows', count, 'players - RLS is blocking!');
        } else if (data && data.length === 0 && (count === null || count === 0)) {
          console.warn('⚠️ No players found in database (count is 0)');
        }
      }
      
      return (data || []) as Player[];
    });
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 Exception in fetchAllPlayers:', error);
    }
    throw error;
  }
};

const fetchPlayersByTeam = async (teamId: number): Promise<Player[]> => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 fetchPlayersByTeam START for team ${teamId} at ${new Date().toISOString()}`);
  }
  
  try {
    const result = await withUserContext(async () => {
      // Verify context BEFORE query
      if (process.env.NODE_ENV === 'development') {
        const { data: roleBefore, error: roleErrorBefore } = await supabase.rpc('get_current_user_role');
        const { data: teamIdsBefore } = await supabase.rpc('get_current_user_team_ids');
        console.log(`🔍 Context BEFORE query for team ${teamId}:`, {
          role: roleBefore,
          teamIds: teamIdsBefore,
          roleError: roleErrorBefore,
          timestamp: new Date().toISOString()
        });
      }
      
      const queryStartTime = Date.now();
      const { data, error, count } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, team_id', { count: 'exact' })
        .eq('team_id', teamId)
        .order('last_name')
        .order('first_name');
      const queryDuration = Date.now() - queryStartTime;
      
      // Verify context AFTER query
      if (process.env.NODE_ENV === 'development') {
        const { data: roleAfter, error: roleErrorAfter } = await supabase.rpc('get_current_user_role');
        console.log(`🔍 Context AFTER query for team ${teamId}:`, {
          role: roleAfter,
          roleError: roleErrorAfter,
          queryDuration: `${queryDuration}ms`
        });
      }
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ Error fetching players for team ${teamId}:`, error);
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
        console.log(`✅ fetchPlayersByTeam result for team ${teamId}:`, {
          dataLength: data?.length || 0,
          count: count,
          hasError: !!error,
          queryDuration: `${queryDuration}ms`
        });
        
        if (data && data.length === 0) {
          console.warn(`⚠️ No players found for team ${teamId}`);
          
          // Check if team exists
          const { data: teamCheck, error: teamError } = await supabase
            .from('teams')
            .select('team_id, team_name')
            .eq('team_id', teamId)
            .single();
          
          if (teamError) {
            console.warn(`⚠️ Could not verify if team ${teamId} exists:`, teamError.message);
          } else if (teamCheck) {
            console.log(`✅ Team ${teamId} (${teamCheck.team_name}) exists in database`);
            
            // Check if there are players for this team - use same context
            // Note: This count query also respects RLS, so if it shows players but select doesn't,
            // it means the RLS context is not set correctly for the select query
            const countStartTime = Date.now();
            const { count: totalCount, error: countError } = await supabase
              .from('players')
              .select('*', { count: 'exact', head: true })
              .eq('team_id', teamId);
            const countDuration = Date.now() - countStartTime;
            
            if (countError) {
              console.warn(`⚠️ Could not check total count for team ${teamId}:`, countError.message);
            } else {
              console.log(`📊 Total players for team ${teamId} (by count, ${countDuration}ms):`, totalCount || 0);
              if (totalCount && totalCount > 0 && data.length === 0) {
                console.error(`❌ RLS ISSUE DETECTED for team ${teamId}:`);
                console.error(`   - Count query shows: ${totalCount} players`);
                console.error(`   - Select query shows: 0 players`);
                console.error(`   - This indicates RLS is blocking the select query`);
                console.error(`   - Context role should be 'admin' but may have been lost`);
                
                // Double-check context one more time
                const { data: finalRoleCheck } = await supabase.rpc('get_current_user_role');
                console.error(`   - Final role check: ${finalRoleCheck}`);
              }
            }
          } else {
            console.warn(`⚠️ Team ${teamId} does not exist in database`);
          }
        } else {
          console.log(`✅ Successfully fetched ${data?.length || 0} players for team ${teamId}`);
        }
      }
      
      return (data || []) as Player[];
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 fetchPlayersByTeam END for team ${teamId} - returned ${result.length} players`);
    }
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`💥 Exception in fetchPlayersByTeam for team ${teamId}:`, error);
    }
    throw error;
  }
};

/**
 * Main hook for fetching players
 * Uses React Query for automatic caching, retry logic, and request cancellation
 */
export const usePlayersQuery = (teamId: number | null = null) => {
  const { user, authContextReady } = useAuth();
  const isAdmin = user?.role === "admin";
  
  // Determine what to fetch based on teamId and user role
  // Query should be enabled when:
  // 1. User exists
  // 2. Auth context is ready
  // 3. For player managers: they have a teamId
  // 4. For admins: always enabled (can be null for all teams)
  const shouldFetch = !!user && authContextReady && (isAdmin || (user.teamId !== undefined && user.teamId !== null));
  
  // Only log in development and only when query state actually changes
  const prevState = useRef<{ teamId: number | null; shouldFetch: boolean } | null>(null);
  const currentState = { teamId, shouldFetch };
  
  if (process.env.NODE_ENV === 'development') {
    if (!prevState.current || 
        prevState.current.teamId !== currentState.teamId || 
        prevState.current.shouldFetch !== currentState.shouldFetch) {
      console.log('🔍 usePlayersQuery setup:', {
        teamId,
        isAdmin,
        shouldFetch,
        willFetch: shouldFetch ? (teamId !== null ? `team ${teamId}` : isAdmin ? 'all players' : `team ${user?.teamId}`) : 'DISABLED'
      });
      prevState.current = currentState;
    }
  }
  
  // Create a stable query key - don't include user role to avoid unnecessary cache separation
  // The teamId is enough to differentiate queries
  const queryKey = useMemo(() => {
    return playerQueryKeys.list(teamId);
  }, [teamId]);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 usePlayersQuery queryFn called:', {
          teamId,
          isAdmin,
          userTeamId: user?.teamId,
          willFetch: teamId !== null ? `team ${teamId}` : isAdmin ? 'all players' : `team ${user?.teamId}`
        });
      }
      
      // If teamId is provided, fetch that team
      if (teamId !== null) {
        const result = await fetchPlayersByTeam(teamId);
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Query result for team ${teamId}:`, result.length, 'players');
          if (result.length === 0) {
            console.warn(`⚠️ Team ${teamId} returned 0 players`);
          }
        }
        return result;
      }
      
      // If admin and no teamId, fetch all players
      if (isAdmin) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📥 Fetching all players (admin view)');
        }
        const result = await fetchAllPlayers();
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Query result (all players):', result.length, 'players');
        }
        return result;
      }
      
      // Player manager: fetch their team (teamId is null, so use user's teamId)
      if (user?.teamId) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`📥 Fetching players for player manager team: ${user.teamId}`);
        }
        const result = await fetchPlayersByTeam(user.teamId);
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Query result for player manager team ${user.teamId}:`, result.length, 'players');
        }
        return result;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ No players to fetch - no teamId and not admin');
      }
      return [];
    },
    enabled: shouldFetch, // Only fetch when auth is ready
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
 * Hook for fetching teams list
 */
export const useTeamsQuery = () => {
  const { authContextReady } = useAuth();
  
  return useQuery({
    queryKey: ['teams'],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (error) {
        console.error('Error fetching teams:', error);
        throw error;
      }
      return (data || []) as Team[];
    },
    enabled: authContextReady, // Only fetch when auth is ready
    staleTime: 5 * 60 * 1000, // 5 minutes - teams change rarely
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

/**
 * Hook for invalidating player queries after mutations
 */
export const useInvalidatePlayers = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      console.log('🗑️ Invalidating all player queries');
      queryClient.invalidateQueries({ queryKey: playerQueryKeys.all });
    },
    invalidateTeam: (teamId: number | null) => {
      console.log(`🗑️ Invalidating team query for teamId: ${teamId}`);
      if (teamId !== null) {
        queryClient.invalidateQueries({ queryKey: playerQueryKeys.list(teamId) });
      } else {
        queryClient.invalidateQueries({ queryKey: playerQueryKeys.all });
      }
    },
    invalidateList: () => {
      console.log('🗑️ Invalidating player list queries');
      queryClient.invalidateQueries({ queryKey: playerQueryKeys.lists() });
    },
  };
};

