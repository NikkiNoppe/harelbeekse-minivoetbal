import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types (behouden van originele service)
export interface Referee {
  user_id: number;
  username: string;
  email?: string;
}

// Query Keys
export const refereeQueryKeys = {
  all: ['referees'] as const,
  byId: (id: number) => ['referees', id] as const,
  active: ['referees', 'active'] as const,
};

// Base service functions (behouden van originele service)
export const refereeService = {
  // Get all users with referee role (READ-ONLY - geen wijzigingen in rechten)
  async getReferees(): Promise<Referee[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, email')
        .eq('role', 'referee')
        .order('username');

      if (error) {
        console.error('Error fetching referees:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in refereeService.getReferees:', error);
      throw error;
    }
  },

  // Get referee by ID (READ-ONLY - geen wijzigingen in rechten)
  async getRefereeById(userId: number): Promise<Referee | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, email')
        .eq('user_id', userId)
        .eq('role', 'referee')
        .single();

      if (error) {
        console.error('Error fetching referee by ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in refereeService.getRefereeById:', error);
      throw error;
    }
  },

  // Get active referees (nieuwe functie voor betere performance)
  async getActiveReferees(): Promise<Referee[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, email')
        .eq('role', 'referee')
        .eq('is_active', true)
        .order('username');

      if (error) {
        console.error('Error fetching active referees:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in refereeService.getActiveReferees:', error);
      throw error;
    }
  }
};

// React Query Hooks voor geoptimaliseerde data fetching
export const useReferees = () => {
  return useQuery({
    queryKey: refereeQueryKeys.all,
    queryFn: refereeService.getReferees,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

export const useRefereeById = (userId: number) => {
  return useQuery({
    queryKey: refereeQueryKeys.byId(userId),
    queryFn: async () => refereeService.getRefereeById(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
};

export const useActiveReferees = () => {
  return useQuery({
    queryKey: refereeQueryKeys.active,
    queryFn: refereeService.getActiveReferees,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

// Utility hooks voor betere performance
export const useRefereeOptions = () => {
  const { data: referees, isLoading, error } = useReferees();
  
  const refereeOptions = referees?.map(referee => ({
    value: referee.username,
    label: referee.username,
    email: referee.email
  })) || [];

  return {
    refereeOptions,
    isLoading,
    error,
    referees
  };
};

// Cache management utilities
export const useRefereeCache = () => {
  const queryClient = useQueryClient();

  const invalidateRefereeCache = () => {
    queryClient.invalidateQueries({ queryKey: refereeQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: refereeQueryKeys.active });
  };

  const prefetchReferees = () => {
    queryClient.prefetchQuery({
      queryKey: refereeQueryKeys.all,
      queryFn: refereeService.getReferees,
      staleTime: 5 * 60 * 1000
    });
  };

  return {
    invalidateRefereeCache,
    prefetchReferees
  };
};

// Export optimized service
export const optimizedRefereeService = {
  // Original service functions (behouden voor backward compatibility)
  ...refereeService,
  
  // React Query hooks
  useReferees,
  useRefereeById,
  useActiveReferees,
  useRefereeOptions,
  useRefereeCache,
  
  // Query keys for external use
  queryKeys: refereeQueryKeys
}; 