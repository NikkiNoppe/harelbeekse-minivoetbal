import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { teamService } from '@/services/core/teamService';
import { withUserContext } from '@/lib/supabaseUtils';

export interface Team {
  team_id: number;
  team_name: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  club_colors?: string;
  preferred_play_moments?: {
    days?: string[];
    timeslots?: string[];
    venues?: number[];
    notes?: string;
  };
}

// Query keys
export const teamQueryKeys = {
  all: ['teams'] as const,
  lists: () => [...teamQueryKeys.all, 'list'] as const,
  list: (filters: string) => [...teamQueryKeys.lists(), { filters }] as const,
  details: () => [...teamQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...teamQueryKeys.details(), id] as const,
};

// Fetch all teams (for authenticated admin users - includes contact info)
export const useTeams = () => {
  return useQuery({
    queryKey: teamQueryKeys.lists(),
    queryFn: () => teamService.getAllTeams(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch public teams (safe for public access - no contact info)
export const usePublicTeams = () => {
  return useQuery({
    queryKey: [...teamQueryKeys.all, 'public'],
    queryFn: () => teamService.getPublicTeams(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch single team
export const useTeam = (teamId: number) => {
  return useQuery({
    queryKey: teamQueryKeys.detail(teamId),
    queryFn: async () => {
      // Use teams table for basic team information
      const { data: teamData, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .eq('team_id', teamId)
        .single();

      if (error) throw error;

      // Map teams data to Team interface
      const data = teamData ? {
        team_id: teamData.team_id,
        team_name: teamData.team_name,
        contact_person: undefined,
        contact_phone: undefined,
        contact_email: undefined,
        club_colors: undefined,
        preferred_play_moments: undefined
      } : null;

      return data as Team;
    },
    enabled: !!teamId,
  });
};

// Create team mutation
export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamData: {
      team_name: string;
      contact_person?: string;
      contact_phone?: string;
      contact_email?: string;
      club_colors?: string;
      preferred_play_moments?: {
        days?: string[];
        timeslots?: string[];
        venues?: number[];
        notes?: string;
      };
    }) => {
      return await teamService.createTeam(teamData);
    },
    onSuccess: () => {
      // Invalidate and refetch teams
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() });
    },
  });
};

// Update team mutation
export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, data }: { teamId: number; data: Partial<Team> }) => {
      const { error } = await withUserContext(async () => {
        return await supabase
          .from('teams')
          .update(data)
          .eq('team_id', teamId);
      });

      if (error) throw error;
      return { teamId, data };
    },
    onSuccess: (_, { teamId }) => {
      // Invalidate specific team and teams list
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() });
    },
  });
};

// Delete team mutation
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: number) => {
      const { error } = await withUserContext(async () => {
        return await supabase
          .from('teams')
          .delete()
          .eq('team_id', teamId);
      });

      if (error) throw error;
      return teamId;
    },
    onSuccess: () => {
      // Invalidate teams list
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() });
    },
  });
};