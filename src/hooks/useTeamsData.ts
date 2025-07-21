import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { enhancedTeamService, Team } from "@/services";

export interface TeamFormData {
  team_name: string;
  balance: number;
}

export interface TeamStatistics {
  totalTeams: number;
  positiveBalance: number;
  negativeBalance: number;
  totalBalance: number;
  averageBalance: number;
}

export const useTeamsData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all teams
  const teamsQuery = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const teams = await enhancedTeamService.getAllTeams();
      return teams;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - teams don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: TeamFormData) => {
      const result = await enhancedTeamService.createTeam(teamData);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Team toegevoegd",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het team",
        variant: "destructive"
      });
    }
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, teamData }: { teamId: number; teamData: TeamFormData }) => {
      const result = await enhancedTeamService.updateTeam(teamId, teamData);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Team bijgewerkt",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van het team",
        variant: "destructive"
      });
    }
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const result = await enhancedTeamService.deleteTeam(teamId);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: (result) => {
      toast({
        title: "Team verwijderd",
        description: result.message
      });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van het team",
        variant: "destructive"
      });
    }
  });

  // Calculate team statistics
  const calculateStatistics = (teams: Team[]): TeamStatistics => {
    if (!teams || teams.length === 0) {
      return {
        totalTeams: 0,
        positiveBalance: 0,
        negativeBalance: 0,
        totalBalance: 0,
        averageBalance: 0
      };
    }

    const totalBalance = teams.reduce((sum, team) => sum, 0);
    const positiveBalance = 0;
    const negativeBalance = 0;

    return {
      totalTeams: teams.length,
      positiveBalance,
      negativeBalance,
      totalBalance,
      averageBalance: 0
    };
  };

  // Sort teams by various criteria
  const sortTeams = (teams: Team[], sortBy: 'name' | 'balance' | 'balance_desc' = 'name') => {
    if (!teams) return [];
    
    return [...teams].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.team_name.localeCompare(b.team_name);
        // case 'balance':
        //   return (a.balance || 0) - (b.balance || 0);
        // case 'balance_desc':
        //   return (b.balance || 0) - (a.balance || 0);
        default:
          return 0;
      }
    });
  };

  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Statistics based on current data
  const statistics = teamsQuery.data ? calculateStatistics(teamsQuery.data) : {
    totalTeams: 0,
    positiveBalance: 0,
    negativeBalance: 0,
    totalBalance: 0,
    averageBalance: 0
  };

  return {
    // Data
    teams: teamsQuery.data || [],
    statistics,
    
    // Loading states
    isLoading: teamsQuery.isLoading,
    isCreating: createTeamMutation.isPending,
    isUpdating: updateTeamMutation.isPending,
    isDeleting: deleteTeamMutation.isPending,
    
    // Error states
    error: teamsQuery.error,
    hasError: !!teamsQuery.error,
    
    // Actions
    createTeam: createTeamMutation.mutate,
    updateTeam: (teamId: number, teamData: TeamFormData) => 
      updateTeamMutation.mutate({ teamId, teamData }),
    deleteTeam: deleteTeamMutation.mutate,
    
    // Utility functions
    sortTeams,
    formatCurrency,
    
    // Query controls
    refetch: teamsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['teams'] })
  };
}; 