import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../MINIVOETBAL.SDK/client';
import { teamService } from '../../MINIVOETBAL.SERVICES/core/teamService';

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

// Fetch all teams
export const useTeams = () => {
  return useQuery({
    queryKey: teamQueryKeys.lists(),
    queryFn: async () => {
      // First try with all columns
      let { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name, contact_person, contact_phone, contact_email, club_colors, preferred_play_moments')
        .order('team_name');

      // If contact columns don't exist, fall back to basic columns
      if (error && error.message.includes('does not exist')) {
        const { data: basicData, error: basicError } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .order('team_name');

        if (basicError) throw basicError;

        // Map basic data to Team interface
        data = (basicData || []).map((team: any) => ({
          team_id: team.team_id,
          team_name: team.team_name,
          contact_person: undefined,
          contact_phone: undefined,
          contact_email: undefined,
          club_colors: undefined,
          preferred_play_moments: undefined
        }));
      } else if (error) {
        throw error;
      }

      return (data || []) as Team[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch single team
export const useTeam = (teamId: number) => {
  return useQuery({
    queryKey: teamQueryKeys.detail(teamId),
    queryFn: async () => {
      // First try with all columns
      let { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name, contact_person, contact_phone, contact_email, club_colors, preferred_play_moments')
        .eq('team_id', teamId)
        .single();

      // If contact columns don't exist, fall back to basic columns
      if (error && error.message.includes('does not exist')) {
        const { data: basicData, error: basicError } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .eq('team_id', teamId)
          .single();

        if (basicError) throw basicError;

        // Map basic data to Team interface
        data = basicData ? {
          team_id: basicData.team_id,
          team_name: basicData.team_name,
          contact_person: undefined,
          contact_phone: undefined,
          contact_email: undefined,
          club_colors: undefined,
          preferred_play_moments: undefined
        } : null;
      } else if (error) {
        throw error;
      }

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
      const { error } = await supabase
        .from('teams')
        .update(data)
        .eq('team_id', teamId);

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
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('team_id', teamId);

      if (error) throw error;
      return teamId;
    },
    onSuccess: () => {
      // Invalidate teams list
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() });
    },
  });
}; 