import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('De verbinding duurt te lang (timeout). Controleer je internetverbinding en probeer opnieuw.'));
    }, 8000);
    
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Request geannuleerd'));
    });
  });
  
  try {
    const result = await Promise.race([
      (async () => {
        const { data, error } = await supabase
          .from('referees_public' as 'users')
          .select('user_id, username')
          .order('username');
        
        if (error) throw error;
        return (data as unknown as Referee[]) || [];
      })(),
      timeoutPromise
    ]);
    
    if (result && result.length > 0) {
      refereesCache = result;
    }
    
    return result;
  } catch (error) {
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

export const useRefereesQuery = (options: UseRefereesQueryOptions = {}) => {
  const { enabled = true } = options;
  
  return useQuery({
    queryKey: refereeQueryKeys.list(),
    queryFn: async ({ signal }) => fetchReferees(signal),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 8000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
  });
};

export const useInvalidateReferees = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: refereeQueryKeys.all });
    },
  };
};
