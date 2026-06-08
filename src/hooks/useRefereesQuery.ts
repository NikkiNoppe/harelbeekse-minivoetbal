import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSessionToken } from "@/lib/authSession";
import { fetchRefereesForSession } from "@/services/scheidsrechter/scheidsSessionFetch";

export interface Referee {
  user_id: number;
  username: string;
}

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

  const result = await Promise.race([
    fetchRefereesForSession(),
    timeoutPromise,
  ]);

  return result;
};

interface UseRefereesQueryOptions {
  enabled?: boolean;
}

export const useRefereesQuery = (options: UseRefereesQueryOptions = {}) => {
  const { enabled = true } = options;
  const hasSession = !!getSessionToken();

  return useQuery({
    queryKey: refereeQueryKeys.list(),
    queryFn: async ({ signal }) => fetchReferees(signal),
    enabled: enabled && hasSession,
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
