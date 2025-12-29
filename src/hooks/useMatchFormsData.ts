import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchUpcomingMatches } from "@/components/pages/admin/matches/services/matchesFormService";
import type { MatchFormData } from "@/components/pages/admin/matches/types";

export interface MatchFormsFilters {
  searchTerm: string;
  dateFilter: string;
  matchdayFilter: string;
  teamFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  hideCompletedMatches: boolean;
}

export const useMatchFormsData = (
  teamId: number,
  hasElevatedPermissions: boolean
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Loading time management: minimum 250ms, maximum 5000ms timeout
  const MIN_LOADING_TIME = 250; // Minimum 250ms for better UX
  const MAX_LOADING_TIME = 5000; // Maximum 5000ms timeout
  
  const [minLoadingState, setMinLoadingState] = useState({
    league: true, // Start as true, will be set to false when loading starts
    cup: true,
    playoff: true
  });
  const [loadingTimeout, setLoadingTimeout] = useState({
    league: false,
    cup: false,
    playoff: false
  });
  const loadingStartTimeRef = useRef<{ league?: number; cup?: number; playoff?: number }>({});
  const minTimeoutRef = useRef<{ league?: NodeJS.Timeout; cup?: NodeJS.Timeout; playoff?: NodeJS.Timeout }>({});
  const maxTimeoutRef = useRef<{ league?: NodeJS.Timeout; cup?: NodeJS.Timeout; playoff?: NodeJS.Timeout }>({});

  // League matches query
  const leagueQuery = useQuery({
    queryKey: ['teamMatches', teamId, hasElevatedPermissions, 'league'],
    queryFn: async () => {
      return fetchUpcomingMatches(
        hasElevatedPermissions ? 0 : teamId, 
        hasElevatedPermissions, 
        'league'
      );
    },
    staleTime: 0, // Always refetch immediately
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2, // Reduced retries
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
    placeholderData: undefined, // No placeholder data
    networkMode: 'online' // Always fetch fresh data
  });

  // Cup matches query
  const cupQuery = useQuery({
    queryKey: ['teamMatches', teamId, hasElevatedPermissions, 'cup'],
    queryFn: async () => {
      return fetchUpcomingMatches(
        hasElevatedPermissions ? 0 : teamId, 
        hasElevatedPermissions, 
        'cup'
      );
    },
    staleTime: 0, // Always refetch immediately
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2, // Reduced retries
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
    placeholderData: undefined, // No placeholder data
    networkMode: 'online' // Always fetch fresh data
  });

  // Playoff matches query
  const playoffQuery = useQuery({
    queryKey: ['teamMatches', teamId, hasElevatedPermissions, 'playoff'],
    queryFn: async () => {
      return fetchUpcomingMatches(
        hasElevatedPermissions ? 0 : teamId, 
        hasElevatedPermissions, 
        'playoff'
      );
    },
    staleTime: 0, // Always refetch immediately
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2, // Reduced retries
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
    placeholderData: undefined, // No placeholder data
    networkMode: 'online' // Always fetch fresh data
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

      const matchesTeam = !filters.teamFilter ||
        match.homeTeamName.toLowerCase() === filters.teamFilter.toLowerCase() ||
        match.awayTeamName.toLowerCase() === filters.teamFilter.toLowerCase();

      // Helper function to check if a score is valid
      const hasValidScore = (score: number | null | undefined): boolean => 
        score !== null && score !== undefined;
      
      // Filter completed matches - hide matches that are completed when toggle is enabled
      const isCompleted = hasValidScore(match.homeScore) && hasValidScore(match.awayScore);
      const showMatch = !filters.hideCompletedMatches || !isCompleted;

      return matchesSearch && matchesDate && matchesMatchday && matchesTeam && showMatch;
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

  // Track when loading starts and enforce minimum/maximum loading time for each query
  useEffect(() => {
    const checkLoading = (query: typeof leagueQuery, type: 'league' | 'cup' | 'playoff') => {
      const isQueryLoading = query.isLoading;
      
      if (isQueryLoading) {
        // Loading started
        if (loadingStartTimeRef.current[type] === undefined) {
          loadingStartTimeRef.current[type] = Date.now();
          setMinLoadingState(prev => ({ ...prev, [type]: false }));
          setLoadingTimeout(prev => ({ ...prev, [type]: false }));
          
          // Clear any existing timeouts
          if (minTimeoutRef.current[type]) {
            clearTimeout(minTimeoutRef.current[type]);
            minTimeoutRef.current[type] = undefined;
          }
          if (maxTimeoutRef.current[type]) {
            clearTimeout(maxTimeoutRef.current[type]);
            maxTimeoutRef.current[type] = undefined;
          }
          
          // Set maximum timeout (5000ms) - show error if exceeded
          maxTimeoutRef.current[type] = setTimeout(() => {
            setLoadingTimeout(prev => ({ ...prev, [type]: true }));
            loadingStartTimeRef.current[type] = undefined;
            if (process.env.NODE_ENV === 'development') {
              console.error(`❌ Loading timeout for ${type} matches after ${MAX_LOADING_TIME}ms`);
            }
          }, MAX_LOADING_TIME);
        }
      } else {
        // Loading finished - check if minimum time has elapsed
        if (loadingStartTimeRef.current[type] !== undefined) {
          const elapsed = Date.now() - (loadingStartTimeRef.current[type] || 0);
          const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
          
          // Clear maximum timeout since loading finished
          if (maxTimeoutRef.current[type]) {
            clearTimeout(maxTimeoutRef.current[type]);
            maxTimeoutRef.current[type] = undefined;
          }
          
          if (remainingTime > 0) {
            // Clear any existing minimum timeout
            if (minTimeoutRef.current[type]) {
              clearTimeout(minTimeoutRef.current[type]);
            }
            // Set timeout to complete minimum loading time
            minTimeoutRef.current[type] = setTimeout(() => {
              setMinLoadingState(prev => ({ ...prev, [type]: true }));
              loadingStartTimeRef.current[type] = undefined;
              minTimeoutRef.current[type] = undefined;
            }, remainingTime);
          } else {
            // Already exceeded minimum time
            setMinLoadingState(prev => ({ ...prev, [type]: true }));
            loadingStartTimeRef.current[type] = undefined;
            if (minTimeoutRef.current[type]) {
              clearTimeout(minTimeoutRef.current[type]);
              minTimeoutRef.current[type] = undefined;
            }
          }
        } else {
          // No loading was tracked, ensure elapsed is true
          setMinLoadingState(prev => ({ ...prev, [type]: true }));
        }
      }
    };

    checkLoading(leagueQuery, 'league');
    checkLoading(cupQuery, 'cup');
    checkLoading(playoffQuery, 'playoff');
    
    // Cleanup timeouts on unmount
    return () => {
      Object.values(minTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      Object.values(maxTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [leagueQuery.isLoading, cupQuery.isLoading, playoffQuery.isLoading]);

  // Enhanced error handling - combine query errors with timeout errors
  const getError = useMemo(() => {
    const errors: { league?: any; cup?: any; playoff?: any } = {};
    
    if (loadingTimeout.league) {
      errors.league = {
        message: 'Het laden van de competitie wedstrijden duurt te lang (>5 seconden). Dit kan betekenen dat de data niet correct is binnengehaald. Probeer de pagina te vernieuwen of controleer je internetverbinding.',
        timeout: true
      };
    } else if (leagueQuery.error) {
      errors.league = {
        message: 'Er is een fout opgetreden bij het laden van de competitie wedstrijden. De data is mogelijk niet correct binnengehaald. Probeer het opnieuw of neem contact op met de beheerder.',
        originalError: leagueQuery.error,
        timeout: false
      };
    }
    
    if (loadingTimeout.cup) {
      errors.cup = {
        message: 'Het laden van de beker wedstrijden duurt te lang (>5 seconden). Dit kan betekenen dat de data niet correct is binnengehaald. Probeer de pagina te vernieuwen of controleer je internetverbinding.',
        timeout: true
      };
    } else if (cupQuery.error) {
      errors.cup = {
        message: 'Er is een fout opgetreden bij het laden van de beker wedstrijden. De data is mogelijk niet correct binnengehaald. Probeer het opnieuw of neem contact op met de beheerder.',
        originalError: cupQuery.error,
        timeout: false
      };
    }
    
    if (loadingTimeout.playoff) {
      errors.playoff = {
        message: 'Het laden van de playoff wedstrijden duurt te lang (>5 seconden). Dit kan betekenen dat de data niet correct is binnengehaald. Probeer de pagina te vernieuwen of controleer je internetverbinding.',
        timeout: true
      };
    } else if (playoffQuery.error) {
      errors.playoff = {
        message: 'Er is een fout opgetreden bij het laden van de playoff wedstrijden. De data is mogelijk niet correct binnengehaald. Probeer het opnieuw of neem contact op met de beheerder.',
        originalError: playoffQuery.error,
        timeout: false
      };
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }, [loadingTimeout, leagueQuery.error, cupQuery.error, playoffQuery.error]);

  // Get current tab data with filters
  const getTabData = (tabType: 'league' | 'cup' | 'playoff', filters: MatchFormsFilters) => {
    const query = tabType === 'cup' ? cupQuery : 
                  tabType === 'playoff' ? playoffQuery : leagueQuery;
    const filteredMatches = filterAndSortMatches(query.data || [], filters);
    
    // Calculate final loading state: query loading OR minimum time not elapsed AND no timeout
    const isLoading = !loadingTimeout[tabType] && (query.isLoading || !minLoadingState[tabType]);
    
    // Get error for this tab type
    const error = getError?.[tabType] || null;
    
    return {
      matches: filteredMatches,
      allMatches: query.data || [],
      isLoading,
      isError: !!error || query.isError,
      error: error || query.error
    };
  };

  // Instant refresh function for after form submissions
  const refreshInstantly = async () => {
    try {
      // Invalidate and refetch immediately for instant updates
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teamMatches'] }),
        leagueQuery.refetch(),
        cupQuery.refetch(),
        playoffQuery.refetch()
      ]);
      // Note: Toast notifications are handled by the submission hooks (e.g., useEnhancedMatchFormSubmission)
      // to avoid duplicate notifications
    } catch (error) {
      // Only show error toast if refresh fails, not success toast
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
    totalPlayoffMatches: playoffQuery.data?.length || 0,
    
    submittedLeague: leagueQuery.data?.filter(m => m.isCompleted).length || 0,
    submittedCup: cupQuery.data?.filter(m => m.isCompleted).length || 0,
    submittedPlayoff: playoffQuery.data?.filter(m => m.isCompleted).length || 0,
    
    pendingLeague: leagueQuery.data?.filter(m => !m.isCompleted).length || 0,
    pendingCup: cupQuery.data?.filter(m => !m.isCompleted).length || 0,
    pendingPlayoff: playoffQuery.data?.filter(m => !m.isCompleted).length || 0
  };

  return {
    // Raw data
    leagueMatches: leagueQuery.data || [],
    cupMatches: cupQuery.data || [],
    playoffMatches: playoffQuery.data || [],
    
    // Loading states (with minimum/maximum loading time)
    leagueLoading: !loadingTimeout.league && (leagueQuery.isLoading || !minLoadingState.league),
    cupLoading: !loadingTimeout.cup && (cupQuery.isLoading || !minLoadingState.cup),
    playoffLoading: !loadingTimeout.playoff && (playoffQuery.isLoading || !minLoadingState.playoff),
    isLoading: (!loadingTimeout.league && (leagueQuery.isLoading || !minLoadingState.league)) || 
               (!loadingTimeout.cup && (cupQuery.isLoading || !minLoadingState.cup)) || 
               (!loadingTimeout.playoff && (playoffQuery.isLoading || !minLoadingState.playoff)),
    
    // Error states (enhanced with timeout errors)
    leagueError: getError?.league || leagueQuery.error,
    cupError: getError?.cup || cupQuery.error,
    playoffError: getError?.playoff || playoffQuery.error,
    hasError: !!getError || !!leagueQuery.error || !!cupQuery.error || !!playoffQuery.error,
    
    // Statistics
    statistics,
    
    // Utility functions
    getTabData,
    filterAndSortMatches,
    refreshInstantly,
    
    // Direct query methods for manual control
    refetchLeague: leagueQuery.refetch,
    refetchCup: cupQuery.refetch,
    refetchPlayoff: playoffQuery.refetch,
    refetchAll: () => Promise.all([leagueQuery.refetch(), cupQuery.refetch(), playoffQuery.refetch()])
  };
}; 