import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface AdminUser {
  user_id: number;
  username: string;
  email: string;
  role: "admin" | "referee" | "player_manager";
  created_at: string;
  teams?: Team[];
  id?: number; // Add id for generic CRUD compatibility
}

export interface Team {
  team_id: number;
  team_name: string;
  created_at: string;
  players?: Player[];
  id?: number; // Add id for generic CRUD compatibility
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

export interface Player {
  player_id: number;
  name: string;
  team_id: number;
  created_at: string;
  id?: number; // Add id for generic CRUD compatibility
}

export interface CostSetting {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  category: "match_cost" | "penalty" | "other";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  team_id: number;
  transaction_type: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  cost_setting_id?: number;
  match_id?: number;
  created_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  date: string;
  tags: string[];
}

// Query Keys
export const adminQueryKeys = {
  users: ['admin', 'users'] as const,
  teams: ['admin', 'teams'] as const,
  players: ['admin', 'players'] as const,
  costSettings: ['admin', 'cost-settings'] as const,
  transactions: ['admin', 'transactions'] as const,
  blogPosts: ['admin', 'blog-posts'] as const,
  teamTransactions: (teamId: number) => ['admin', 'team-transactions', teamId] as const,
  teamPlayers: (teamId: number) => ['admin', 'team-players', teamId] as const,
};

// Generic CRUD operations
export const createGenericCRUD = <T extends { id?: number | string }>(
  entityName: string,
  queryKey: readonly unknown[],
  endpoint: keyof any,
  transformData?: (data: any) => T
) => {
  // Fetch all
  const useFetchAll = () => {
    return useQuery({
      queryKey,
      queryFn: async () => {
        const { data, error } = await supabase
          .from(endpoint as any)
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return transformData ? data.map(transformData) : data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // Create
  const useCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (newItem: Omit<T, 'id'>) => {
        const { data, error } = await supabase
          .from(endpoint as any)
          .insert([newItem])
          .select()
          .single();
        
        if (error) throw error;
        return transformData ? transformData(data) : data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      },
      onError: (error: any) => {
        // Removed toast
      },
    });
  };

  // Update
  const useUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, ...updateData }: Partial<T> & { id: number | string }) => {
        const { data, error } = await supabase
          .from(endpoint as any)
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return transformData ? transformData(data) : data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      },
      onError: (error: any) => {
        // Removed toast
      },
    });
  };

  // Delete
  const useDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: number | string) => {
        const { error } = await supabase
          .from(endpoint as any)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      },
      onError: (error: any) => {
        // Removed toast
      },
    });
  };

  return {
    useFetchAll,
    useCreate,
    useUpdate,
    useDelete,
  };
};

// Specific CRUD instances with proper types
export const userCRUD = createGenericCRUD<AdminUser>(
  'Gebruiker',
  adminQueryKeys.users,
  'users'
);

export const teamCRUD = createGenericCRUD<Team>(
  'Team',
  adminQueryKeys.teams,
  'teams'
);

export const playerCRUD = createGenericCRUD<Player>(
  'Speler',
  adminQueryKeys.players,
  'players'
);

export const costSettingCRUD = createGenericCRUD<CostSetting>(
  'Kostentarief',
  adminQueryKeys.costSettings,
  'costs'
);

export const blogPostCRUD = createGenericCRUD<BlogPost>(
  'Nieuwsbericht',
  adminQueryKeys.blogPosts,
  'application_settings',
  (data) => ({
    id: data.setting_value.id,
    title: data.setting_value.title,
    content: data.setting_value.content,
    date: data.setting_value.date,
    tags: data.setting_value.tags || [],
  })
);

// Bulk operations
export const useBulkDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, entityName }: { ids: number[], entityName: string }) => {
      const { error } = await supabase
        .from(entityName as any)
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: (_, { entityName }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (error: any) => {
      // Removed toast
    },
  });
};

// Export all CRUD operations
export const adminService = {
  users: userCRUD,
  teams: teamCRUD,
  players: playerCRUD,
  costSettings: costSettingCRUD,
  blogPosts: blogPostCRUD,
  useBulkDelete,
};

// Gespecialiseerde hook voor team_costs (geen generic CRUD, want niet in Supabase types)
// Gebruik deze hook alleen voor team_costs queries:
export function useTeamTransactions(teamId: number) {
  return useQuery({
    queryKey: adminQueryKeys.teamTransactions(teamId),
    queryFn: async () => {
      // 'team_costs' bestaat niet in de Supabase types, dus expliciet as any
      const { data, error } = await supabase
        .from('team_costs' as any)
        .select(`
          *,
          costs(name, description, category),
          matches(unique_number, match_date)
        `)
        .eq('team_id', teamId)
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });
} 