import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { useAuth } from "@/hooks/useAuth";

export interface Referee {
  user_id: number;
  username: string;
}

// In-memory cache for fallback
let refereesCache: Referee[] | null = null;

// Query Keys
export const refereeQueryKeys = {
  all: ['referees'] as const,
  list: () => [...refereeQueryKeys.all, 'list'] as const,
};

const fetchReferees = async (signal?: AbortSignal): Promise<Referee[]> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 fetchReferees called');
  }
  
  // Create timeout promise (15 seconds)
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('De verbinding duurt te lang (timeout). Controleer je internetverbinding en probeer opnieuw.'));
    }, 15000);
    
    // Clean up timeout if signal is aborted
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Request geannuleerd'));
    });
  });
  
  try {
    const result = await Promise.race([
      withUserContext(async () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('📡 Executing Supabase query for referees...');
        }
        
        // Use referees_public view instead of users table to prevent email exposure
        const { data, error } = await supabase
          .from('referees_public' as 'users')
          .select('user_id, username')
          .order('username');
        
        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Error fetching referees:', error);
          }
          throw error;
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ fetchReferees result: ${data?.length || 0} referees`);
        }
        
        // Cast to Referee[] - view returns same structure as users table subset
        return (data as unknown as Referee[]) || [];
      }),
      timeoutPromise
    ]);
    
    // Cache successful result
    if (result && result.length > 0) {
      refereesCache = result;
    }
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 Exception in fetchReferees:', error);
    }
    
    // Return cached data on error if available
    if (refereesCache && refereesCache.length > 0) {
      console.log('📦 Using cached referees data as fallback');
      return refereesCache;
    }
    
    throw error;
  }
};

interface UseRefereesQueryOptions {
  enabled?: boolean;
}

/**
 * Hook for fetching referees with robust retry logic
 * Uses React Query for automatic caching, retry logic, and request cancellation
 */
export const useRefereesQuery = (options: UseRefereesQueryOptions = {}) => {
  const { enabled = true } = options;
  const { authContextReady } = useAuth();
  
  const shouldFetch = enabled && authContextReady;
  
  // Only log in development when state changes
  const prevState = useRef<{ shouldFetch: boolean } | null>(null);
  
  if (process.env.NODE_ENV === 'development') {
    if (!prevState.current || prevState.current.shouldFetch !== shouldFetch) {
      console.log('🔍 useRefereesQuery setup:', { enabled, authContextReady, shouldFetch });
      prevState.current = { shouldFetch };
    }
  }
  
  return useQuery({
    queryKey: refereeQueryKeys.list(),
    queryFn: async ({ signal }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 useRefereesQuery queryFn called');
      }
      return fetchReferees(signal);
    },
    enabled: shouldFetch,
    staleTime: 2 * 60 * 1000, // 2 minutes - referees don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 4, // 4 retries
    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter, max 10 seconds
      const baseDelay = 1500 * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 500;
      return Math.min(baseDelay + jitter, 10000);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
    networkMode: 'offlineFirst', // Try cache first for better offline support
  });
};

/**
 * Hook for invalidating referee queries after mutations
 */
export const useInvalidateReferees = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      console.log('🗑️ Invalidating referee queries');
      queryClient.invalidateQueries({ queryKey: refereeQueryKeys.all });
    },
  };
};
