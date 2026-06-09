import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '@/services/core/teamService';
import { fetchTeamForSession } from '@/services/core/teamsSessionFetch';
import { getSessionToken } from '@/lib/authSession';

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

// Fetch single team (session-RPC; admin or own team for managers)
export const useTeam = (teamId: number) => {
  return useQuery({
    queryKey: teamQueryKeys.detail(teamId),
    queryFn: () => fetchTeamForSession(teamId),
    enabled: !!teamId && !!getSessionToken(),
    staleTime: 0,
    refetchOnMount: 'always',
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
      await teamService.updateTeam(teamId, data);
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
      await teamService.deleteTeam(teamId);
      return teamId;
    },
    onSuccess: () => {
      // Invalidate teams list
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() });
    },
  });
};