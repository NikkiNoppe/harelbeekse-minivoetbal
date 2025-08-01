import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchUpcomingMatches } from "@/components/pages/admin/matches/services";
import type { MatchFormData } from "@/components/pages/admin/matches/types";

export interface MatchFormsFilters {
  searchTerm: string;
  dateFilter: string;
  matchdayFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
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

  // Filter and sort matches based on current filters
  const filterAndSortMatches = (matches: MatchFormData[], filters: MatchFormsFilters) => {
    if (!matches) return [];

    // Filter matches
    const filteredMatches = matches.filter(match => {
      const matchesSearch = !filters.searchTerm || 
        match.homeTeamName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        match.awayTeamName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        match.uniqueNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        match.matchday.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesDate = !filters.dateFilter || 
        match.date === filters.dateFilter ||
        match.date.startsWith(filters.dateFilter) ||
        match.date.includes(filters.dateFilter);

      const matchesMatchday = !filters.matchdayFilter || 
        match.matchday.toLowerCase().includes(filters.matchdayFilter.toLowerCase());

      return matchesSearch && matchesDate && matchesMatchday;
    });

    // Sort matches
    const sortedMatches = [...filteredMatches].sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          // Parse dates correctly and handle invalid dates
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'matchday':
          comparison = a.matchday.localeCompare(b.matchday);
          break;
        case 'week':
          // Extract week number from matchday or date
          const weekA = extractWeekNumber(a.matchday) || getWeekFromDate(a.date);
          const weekB = extractWeekNumber(b.matchday) || getWeekFromDate(b.date);
          comparison = weekA - weekB;
          break;
        case 'team':
          comparison = a.homeTeamName.localeCompare(b.homeTeamName);
          break;
        case 'status':
          // Sort by completion status (completed first, then pending)
          comparison = (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0);
          break;
        default:
          // Default to date sorting
          const defaultDateA = parseDate(a.date);
          const defaultDateB = parseDate(b.date);
          comparison = defaultDateA.getTime() - defaultDateB.getTime();
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return sortedMatches;
  };

  // Helper function to parse dates safely
  const parseDate = (dateString: string): Date => {
    // Handle different date formats
    if (dateString.includes('T')) {
      // ISO format
      return new Date(dateString);
    } else if (dateString.includes('-')) {
      // YYYY-MM-DD format
      return new Date(dateString + 'T00:00:00');
    } else {
      // Try to parse as local date
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
  };

  // Helper function to extract week number from matchday string
  const extractWeekNumber = (matchday: string): number | null => {
    const weekMatch = matchday.match(/week\s*(\d+)/i) || matchday.match(/speelweek\s*(\d+)/i);
    return weekMatch ? parseInt(weekMatch[1]) : null;
  };

  // Helper function to get week number from date
  const getWeekFromDate = (date: string): number => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Get current tab data with filters
  const getTabData = (tabType: 'league' | 'cup', filters: MatchFormsFilters) => {
    const query = tabType === 'cup' ? cupQuery : leagueQuery;
    const filteredMatches = filterAndSortMatches(query.data || [], filters);
    
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
        title: "Succes",
        description: "Wedstrijdformulieren zijn succesvol bijgewerkt."
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
    filterAndSortMatches,
    refreshInstantly,
    
    // Direct query methods for manual control
    refetchLeague: leagueQuery.refetch,
    refetchCup: cupQuery.refetch,
    refetchAll: () => Promise.all([leagueQuery.refetch(), cupQuery.refetch()])
  };
}; 