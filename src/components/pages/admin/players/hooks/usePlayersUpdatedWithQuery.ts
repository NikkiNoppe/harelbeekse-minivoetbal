import React, { useCallback, useMemo, useState, useEffect } from "react";
import { usePlayersQuery, useTeamsQuery, useInvalidatePlayers } from "@/hooks/usePlayersQuery";
import { usePlayerOperations } from "./usePlayerOperations";
import { usePlayerDialogs } from "./usePlayerDialogs";
import { formatDate, getFullName, handleTeamChange } from "../utils/playerUtils";
import { useAuth } from "@/hooks/useAuth";

/**
 * Updated hook using React Query for better performance and reliability
 * Replaces usePlayersUpdated with React Query implementation
 */
export const usePlayersUpdatedWithQuery = () => {
  const { user: authUser } = useAuth();
  const isAdmin = useMemo(() => authUser?.role === "admin", [authUser?.role]);
  
  // Local state for team selection
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Determine effective teamId for query
  // For player managers: always use their teamId (ignore selectedTeam)
  // For admins: use selectedTeam (null = all teams)
  const effectiveTeamId = useMemo(() => {
    // Player manager: always use their teamId
    if (!isAdmin && authUser?.teamId !== undefined && authUser.teamId !== null) {
      return authUser.teamId;
    }
    // Admin: use selectedTeam (can be null for all teams)
    // During initial load, selectedTeam might be null which is fine for admins
    return selectedTeam;
  }, [isAdmin, authUser?.teamId, selectedTeam]);
  
  // Use effectiveTeamId directly - React Query handles deduplication automatically
  // No debounce needed - React Query will cancel previous requests when teamId changes
  const playersQuery = usePlayersQuery(effectiveTeamId);
  const teamsQuery = useTeamsQuery();
  const { invalidateAll, invalidateTeam } = useInvalidatePlayers();
  
  // Loading time management: minimum 250ms, maximum 5000ms timeout
  const MIN_LOADING_TIME = 250; // Minimum 250ms for better UX
  const MAX_LOADING_TIME = 5000; // Maximum 5000ms timeout
  
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const loadingStartTimeRef = React.useRef<number | null>(null);
  const minTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Track when loading starts and enforce minimum/maximum loading time
  useEffect(() => {
    const isQueryLoading = playersQuery.isLoading || teamsQuery.isLoading;
    
    if (isQueryLoading) {
      // Loading started
      if (loadingStartTimeRef.current === null) {
        loadingStartTimeRef.current = Date.now();
        setMinLoadingTimeElapsed(false);
        setLoadingTimeout(false);
        
        // Clear any existing timeouts
        if (minTimeoutRef.current) {
          clearTimeout(minTimeoutRef.current);
        }
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
        }
        
        // Set maximum timeout (5000ms) - show error if exceeded
        maxTimeoutRef.current = setTimeout(() => {
          setLoadingTimeout(true);
          loadingStartTimeRef.current = null;
          if (process.env.NODE_ENV === 'development') {
            console.error(`❌ Loading timeout after ${MAX_LOADING_TIME}ms`);
          }
        }, MAX_LOADING_TIME);
      }
    } else {
      // Loading finished - check if minimum time has elapsed
      if (loadingStartTimeRef.current !== null) {
        const elapsed = Date.now() - loadingStartTimeRef.current;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
        
        // Clear maximum timeout since loading finished
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = null;
        }
        
        if (remainingTime > 0) {
          // Clear any existing minimum timeout
          if (minTimeoutRef.current) {
            clearTimeout(minTimeoutRef.current);
          }
          // Set timeout to complete minimum loading time
          minTimeoutRef.current = setTimeout(() => {
            setMinLoadingTimeElapsed(true);
            loadingStartTimeRef.current = null;
            minTimeoutRef.current = null;
          }, remainingTime);
        } else {
          // Already exceeded minimum time
          setMinLoadingTimeElapsed(true);
          loadingStartTimeRef.current = null;
          if (minTimeoutRef.current) {
            clearTimeout(minTimeoutRef.current);
            minTimeoutRef.current = null;
          }
        }
      } else {
        // No loading was tracked, ensure elapsed is true
        setMinLoadingTimeElapsed(true);
      }
    }
    
    // Cleanup timeouts on unmount
    return () => {
      if (minTimeoutRef.current) {
        clearTimeout(minTimeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [playersQuery.isLoading, teamsQuery.isLoading]);
  
  // Debug: log only on meaningful changes (not every render)
  const prevDataLengthRef = React.useRef<number>(0);
  const prevLoadingRef = React.useRef<boolean>(false);
  
  useEffect(() => {
    // Only log when data actually changes or loading state changes significantly
    if (process.env.NODE_ENV === 'development') {
      const dataLength = playersQuery.data?.length || 0;
      const isLoading = playersQuery.isLoading;
      
      if (dataLength !== prevDataLengthRef.current || isLoading !== prevLoadingRef.current) {
        console.log('🔍 usePlayersUpdatedWithQuery state change:', {
          selectedTeam,
          effectiveTeamId,
          dataLength,
          isLoading,
          isError: !!playersQuery.error
        });
        prevDataLengthRef.current = dataLength;
        prevLoadingRef.current = isLoading;
      }
    }
  }, [selectedTeam, effectiveTeamId, playersQuery.data?.length, playersQuery.isLoading, playersQuery.error]);
  
  // Initialize selectedTeam on mount - CRITICAL for initial load
  useEffect(() => {
    if (authUser && !hasInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Initializing player data:', {
          isAdmin,
          userTeamId: authUser.teamId,
          role: authUser.role
        });
      }
      
      if (!isAdmin && authUser.teamId !== undefined && authUser.teamId !== null) {
        // Player manager: set their team immediately
        setSelectedTeam(authUser.teamId);
      } else if (isAdmin) {
        // Admin: start with null (all teams) - this triggers fetchAllPlayers
        // Force invalidate to ensure fresh data is fetched
        setSelectedTeam(null);
        // Small delay to ensure state is set before invalidating
        setTimeout(() => {
          invalidateAll();
        }, 0);
      }
      setHasInitialized(true);
    }
  }, [authUser, isAdmin, hasInitialized, invalidateAll]);
  
  // Get user's team name
  const userTeamName = useMemo(() => {
    if (!isAdmin && authUser?.teamId) {
      const userTeam = teamsQuery.data?.find(team => team.team_id === authUser.teamId);
      return userTeam?.team_name || "";
    }
    return "";
  }, [isAdmin, authUser?.teamId, teamsQuery.data]);
  
  // Refresh function (for compatibility with existing code)
  const refreshPlayers = useCallback(async () => {
    // Invalidate and refetch - this will trigger React Query to refetch
    if (effectiveTeamId !== null) {
      invalidateTeam(effectiveTeamId);
    } else {
      invalidateAll();
    }
  }, [effectiveTeamId, invalidateTeam, invalidateAll]);
  
  // Player operations
  const {
    dialogOpen,
    setDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    editMode,
    setEditMode,
    handleEditPlayer: handleEditPlayerDialog
  } = usePlayerDialogs();
  
  // For operations, use effectiveTeamId (not debounced) to ensure correct team is used
  const {
    newPlayer,
    setNewPlayer,
    editingPlayer,
    setEditingPlayer,
    handleAddPlayer,
    handleSaveEditedPlayer,
    handleRemovePlayer
  } = usePlayerOperations(effectiveTeamId, refreshPlayers, setEditDialogOpen);
  
  // Memoized handlers
  const handleTeamChangeWrapper = useCallback((teamId: number | null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Team change requested:', { from: selectedTeam, to: teamId });
    }
    
    // Update team first - React Query will automatically cancel the old query
    // when the query key changes (teamId changes)
    handleTeamChange(teamId, setSelectedTeam, setEditMode);
    
    // Only invalidate the NEW query to force a fresh fetch
    // Don't invalidate the old query - React Query will cancel it automatically
    if (teamId !== null) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Invalidating new team query: ${teamId}`);
      }
      // Use a small delay to ensure state is updated first
      setTimeout(() => {
        invalidateTeam(teamId);
      }, 0);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Invalidating all players query');
      }
      // Use a small delay to ensure state is updated first
      setTimeout(() => {
        invalidateAll();
      }, 0);
    }
  }, [setEditMode, selectedTeam, invalidateTeam, invalidateAll]);
  
  const handleEditPlayer = useCallback((playerId: number) => {
    const players = playersQuery.data || [];
    handleEditPlayerDialog(playerId, players, setEditingPlayer);
  }, [handleEditPlayerDialog, playersQuery.data, setEditingPlayer]);
  
  // Memoized add player handler with dialog management
  const handleAddPlayerAndMaybeCloseDialog = useCallback(async (): Promise<boolean> => {
    const success = await handleAddPlayer();
    if (success) {
      setDialogOpen(false);
      setEditDialogOpen(false);
      setNewPlayer({ firstName: "", lastName: "", birthDate: "" });
      return true;
    }
    return false;
  }, [handleAddPlayer, setDialogOpen, setEditDialogOpen, setNewPlayer]);
  
  // Memoized utility functions
  const memoizedFormatDate = useCallback(formatDate, []);
  const memoizedGetFullName = useCallback(getFullName, []);
  
  // Calculate final loading state: 
  // - Query is loading AND minimum time not elapsed AND no timeout
  // - Stop loading if timeout occurred (show error instead)
  const isLoading = !loadingTimeout && ((playersQuery.isLoading || teamsQuery.isLoading) || !minLoadingTimeElapsed);
  
  // Enhanced error handling - combine query errors with timeout errors
  const error = useMemo(() => {
    if (loadingTimeout) {
      console.error('❌ Loading timeout - data may not have loaded correctly');
      return {
        message: 'Het laden van de spelerslijst duurt te lang (>5 seconden). Dit kan betekenen dat de data niet correct is binnengehaald. Probeer de pagina te vernieuwen of controleer je internetverbinding.',
        timeout: true
      };
    }
    if (playersQuery.error) {
      console.error('❌ Error loading players:', playersQuery.error);
      return {
        message: 'Er is een fout opgetreden bij het laden van de spelerslijst. De data is mogelijk niet correct binnengehaald. Probeer het opnieuw of neem contact op met de beheerder.',
        originalError: playersQuery.error,
        timeout: false
      };
    }
    if (teamsQuery.error) {
      console.error('❌ Error loading teams:', teamsQuery.error);
      return {
        message: 'Er is een fout opgetreden bij het laden van de teams. De data is mogelijk niet correct binnengehaald. Probeer het opnieuw of neem contact op met de beheerder.',
        originalError: teamsQuery.error,
        timeout: false
      };
    }
    return null;
  }, [loadingTimeout, playersQuery.error, teamsQuery.error]);
  
  return {
    players: playersQuery.data || [],
    teams: teamsQuery.data || [],
    loading: isLoading,
    error: error,
    editMode,
    selectedTeam,
    dialogOpen,
    editDialogOpen,
    newPlayer,
    editingPlayer,
    setEditMode,
    handleTeamChange: handleTeamChangeWrapper,
    setDialogOpen,
    setEditDialogOpen,
    setNewPlayer,
    setEditingPlayer,
    handleAddPlayer: handleAddPlayerAndMaybeCloseDialog,
    handleEditPlayer,
    handleSaveEditedPlayer,
    handleRemovePlayer,
    formatDate: memoizedFormatDate,
    getFullName: memoizedGetFullName,
    userTeamName,
    refreshPlayers, // For backward compatibility
  };
};

