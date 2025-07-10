import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchUpcomingMatches } from "@/components/team/match-form/matchFormService";
import type { MatchFormData } from "@/components/team/match-form/types";

export interface MatchFormsFilters {
  searchTerm: string;
  dateFilter: string;
  matchdayFilter: string;
}

export const useMatchFormsData = (
  teamId: number,
  hasElevatedPermissions: boolean
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // League matches query - INSTANT UPDATES for time-sensitive data
  const leagueQuery = useQuery({
    queryKey: ['teamMatches', teamId, hasElevatedPermissions, 'league'],
    queryFn: () => fetchUpcomingMatches(
      hasElevatedPermissions ? 0 : teamId, 
      hasElevatedPermissions, 
      'league'
    ),
    staleTime: 30 * 1000, // 30 seconds - VERY short for instant updates
    gcTime: 2 * 60 * 1000, // 2 minutes cache
    retry: 3,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true,
    refetchInterval: 60 * 1000, // Auto-refetch every minute for live updates
    refetchIntervalInBackground: false // Only when tab is active
  });

  // Cup matches query - INSTANT UPDATES for time-sensitive data  
  const cupQuery = useQuery({
    queryKey: ['teamMatches', teamId, hasElevatedPermissions, 'cup'],
    queryFn: () => fetchUpcomingMatches(
      hasElevatedPermissions ? 0 : teamId, 
      hasElevatedPermissions, 
      'cup'
    ),
    staleTime: 30 * 1000, // 30 seconds - VERY short for instant updates
    gcTime: 2 * 60 * 1000, // 2 minutes cache  
    retry: 3,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true,
    refetchInterval: 60 * 1000, // Auto-refetch every minute for live updates
    refetchIntervalInBackground: false // Only when tab is active
  });

  // Filter matches based on current filters
  const filterMatches = (matches: MatchFormData[], filters: MatchFormsFilters) => {
    if (!matches) return [];

    return matches.filter(match => {
      const matchesSearch = !filters.searchTerm || 
        match.homeTeamName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        match.awayTeamName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        match.uniqueNumber.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesDate = !filters.dateFilter || 
        match.date === filters.dateFilter;

      const matchesMatchday = !filters.matchdayFilter || 
        match.matchday.toLowerCase().includes(filters.matchdayFilter.toLowerCase());

      return matchesSearch && matchesDate && matchesMatchday;
    });
  };

  // Get current tab data with filters
  const getTabData = (tabType: 'league' | 'cup', filters: MatchFormsFilters) => {
    const query = tabType === 'cup' ? cupQuery : leagueQuery;
    const filteredMatches = filterMatches(query.data || [], filters);
    
    return {
      matches: filteredMatches,
      allMatches: query.data || [],
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error
    };
  };

  // Instant refresh function for after form submissions
  const refreshInstantly = async () => {
    try {
      // Invalidate and refetch immediately for instant updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teamMatches'] }),
        leagueQuery.refetch(),
        cupQuery.refetch()
      ]);

      toast({
        title: "Bijgewerkt",
        description: "Wedstrijdformulieren zijn instant bijgewerkt."
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken.",
        variant: "destructive"
      });
    }
  };

  // Statistics for dashboard
  const statistics = {
    totalLeagueMatches: leagueQuery.data?.length || 0,
    totalCupMatches: cupQuery.data?.length || 0,
    submittedLeague: leagueQuery.data?.filter(m => m.isCompleted).length || 0,
    submittedCup: cupQuery.data?.filter(m => m.isCompleted).length || 0,
    pendingLeague: leagueQuery.data?.filter(m => !m.isCompleted).length || 0,
    pendingCup: cupQuery.data?.filter(m => !m.isCompleted).length || 0
  };

  return {
    // Raw data
    leagueMatches: leagueQuery.data || [],
    cupMatches: cupQuery.data || [],
    
    // Loading states
    leagueLoading: leagueQuery.isLoading,
    cupLoading: cupQuery.isLoading,
    isLoading: leagueQuery.isLoading || cupQuery.isLoading,
    
    // Error states
    leagueError: leagueQuery.error,
    cupError: cupQuery.error,
    hasError: !!leagueQuery.error || !!cupQuery.error,
    
    // Statistics
    statistics,
    
    // Utility functions
    getTabData,
    filterMatches,
    refreshInstantly,
    
    // Direct query methods for manual control
    refetchLeague: leagueQuery.refetch,
    refetchCup: cupQuery.refetch,
    refetchAll: () => Promise.all([leagueQuery.refetch(), cupQuery.refetch()])
  };
}; 