import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types (behouden van originele service)
export interface Player {
  player_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  team_id: number;
}

// Query Keys
export const playerQueryKeys = {
  all: ['players'] as const,
  byId: (id: number) => ['players', id] as const,
  byTeam: (teamId: number) => ['players', 'team', teamId] as const,
  active: ['players', 'active'] as const,
};

// Base service functions (behouden van originele service)
export const playerService = {
  // Get players by team (READ-ONLY - geen wijzigingen in rechten)
  async getPlayersByTeam(teamId: number): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name, birth_date, team_id')
      .eq('team_id', teamId)
      .order('first_name');
    
    if (error) {
      console.error('Error fetching players for team:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get all players (READ-ONLY - geen wijzigingen in rechten)
  async getAllPlayers(): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name, birth_date, team_id')
      .order('first_name');
    
    if (error) {
      console.error('Error fetching all players:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get player by ID (READ-ONLY - geen wijzigingen in rechten)
  async getPlayerById(playerId: number): Promise<Player | null> {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name, birth_date, team_id')
      .eq('player_id', playerId)
      .single();
    
    if (error) {
      console.error('Error fetching player:', error);
      return null;
    }
    
    return data;
  },

  // Get active players (nieuwe functie voor betere performance)
  async getActivePlayers(): Promise<Player[]> {
    const { data, error } = await supabase
      .from('players')
      .select('player_id, first_name, last_name, birth_date, team_id')
      .not('team_id', 'is', null)
      .order('first_name');
    
    if (error) {
      console.error('Error fetching active players:', error);
      throw error;
    }
    
    return data || [];
  }
};

// React Query Hooks voor geoptimaliseerde data fetching
export const usePlayers = () => {
  return useQuery({
    queryKey: playerQueryKeys.all,
    queryFn: playerService.getAllPlayers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

export const usePlayerById = (playerId: number) => {
  return useQuery({
    queryKey: playerQueryKeys.byId(playerId),
    queryFn: async () => playerService.getPlayerById(playerId),
    enabled: !!playerId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
};

export const usePlayersByTeam = (teamId: number) => {
  return useQuery({
    queryKey: playerQueryKeys.byTeam(teamId),
    queryFn: async () => playerService.getPlayersByTeam(teamId),
    enabled: !!teamId,
    staleTime: 3 * 60 * 1000, // 3 minutes (team players change more frequently)
    gcTime: 8 * 60 * 1000, // 8 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

export const useActivePlayers = () => {
  return useQuery({
    queryKey: playerQueryKeys.active,
    queryFn: playerService.getActivePlayers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
};

// Utility hooks voor betere performance
export const usePlayerOptions = () => {
  const { data: players, isLoading, error } = usePlayers();
  
  const playerOptions = players?.map(player => ({
    value: player.player_id.toString(),
    label: `${player.first_name} ${player.last_name}`,
    player
  })) || [];

  return {
    playerOptions,
    isLoading,
    error,
    players
  };
};

export const useTeamPlayerOptions = (teamId: number) => {
  const { data: players, isLoading, error } = usePlayersByTeam(teamId);
  
  const playerOptions = players?.map(player => ({
    value: player.player_id.toString(),
    label: `${player.first_name} ${player.last_name}`,
    player
  })) || [];

  return {
    playerOptions,
    isLoading,
    error,
    players
  };
};

// Cache management utilities
export const usePlayerCache = () => {
  const queryClient = useQueryClient();

  const invalidatePlayerCache = () => {
    queryClient.invalidateQueries({ queryKey: playerQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: playerQueryKeys.active });
  };

  const invalidateTeamPlayerCache = (teamId: number) => {
    queryClient.invalidateQueries({ queryKey: playerQueryKeys.byTeam(teamId) });
  };

  const prefetchPlayers = () => {
    queryClient.prefetchQuery({
      queryKey: playerQueryKeys.all,
      queryFn: playerService.getAllPlayers,
      staleTime: 5 * 60 * 1000
    });
  };

  return {
    invalidatePlayerCache,
    invalidateTeamPlayerCache,
    prefetchPlayers
  };
};

// Export optimized service
export const optimizedPlayerService = {
  // Original service functions (behouden voor backward compatibility)
  ...playerService,
  
  // React Query hooks
  usePlayers,
  usePlayerById,
  usePlayersByTeam,
  useActivePlayers,
  usePlayerOptions,
  useTeamPlayerOptions,
  usePlayerCache,
  
  // Query keys for external use
  queryKeys: playerQueryKeys
}; 