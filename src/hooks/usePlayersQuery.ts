import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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

/**
 * Helper to get user ID from localStorage
 */
const getUserIdFromStorage = (): number | null => {
  try {
    const authDataString = localStorage.getItem('auth_data');
    if (!authDataString) return null;
    const authData = JSON.parse(authDataString);
    return authData?.user?.id ?? null;
  } catch {
    return null;
  }
};

/**
 * Fetch players using atomic SECURITY DEFINER RPC
 * This eliminates RLS context loss issues from connection pooling
 */
const fetchPlayersViaRPC = async (teamId: number | null): Promise<Player[]> => {
  const userId = getUserIdFromStorage();
  
  if (!userId) {
    console.error('❌ No user ID found for player fetch');
    return [];
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📡 Fetching players via RPC:', { userId, teamId });
  }
  
  const { data, error } = await supabase.rpc('get_players_for_team', {
    p_user_id: userId,
    p_team_id: teamId
  });
  
  if (error) {
    console.error('❌ Error fetching players via RPC:', error);
    throw error;
  }
  
  const players = (data || []) as Player[];
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ RPC returned ${players.length} players for ${teamId ? `team ${teamId}` : 'all teams'}`);
  }
  
  return players;
};

/**
 * Main hook for fetching players
 * Uses React Query with atomic RPC for reliable data loading
 */
export const usePlayersQuery = (teamId: number | null = null) => {
  const { user, authContextReady } = useAuth();
  const isAdmin = user?.role === "admin";
  
  // Determine what to fetch based on teamId and user role
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
  
  // Create a stable query key
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
          userTeamId: user?.teamId
        });
      }
      
      // Use atomic RPC for all cases
      // If teamId is provided, fetch that team
      if (teamId !== null) {
        return fetchPlayersViaRPC(teamId);
      }
      
      // If admin and no teamId, fetch all players (pass null)
      if (isAdmin) {
        return fetchPlayersViaRPC(null);
      }
      
      // Player manager: fetch their team
      if (user?.teamId) {
        return fetchPlayersViaRPC(user.teamId);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ No players to fetch - no teamId and not admin');
      }
      return [];
    },
    enabled: shouldFetch,
    staleTime: 2 * 60 * 1000, // 2 minutes - matches blog/competition caching
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 4,
    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter, max 10 seconds
      const baseDelay = 1500 * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 500;
      return Math.min(baseDelay + jitter, 10000);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
    placeholderData: (previousData) => previousData, // Show previous data while loading
    networkMode: 'offlineFirst',
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

