
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Player, Team } from "../types";
import { User } from "@/types/auth";

/**
 * Helper to get user ID from localStorage
 */
const getUserIdFromStorage = (): number | null => {
  try {
    const authDataString = localStorage.getItem('auth_data');
    if (!authDataString) return null;
    const authData = JSON.parse(authDataString);
    return authData?.user?.id ?? null;
  } catch {
    return null;
  }
};

export const usePlayersData = (authUser: User | null) => {
  const { authContextReady } = useAuth();
  
  // 🔧 REFS FIRST - before any useEffect (Strict Mode safe)
  const isInitialized = useRef<boolean>(false);
  const didSetInitialTeam = useRef<boolean>(false);
  const hasFallbackFetched = useRef<boolean>(false);

  // States
  const [players, setPlayers] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [userTeamName, setUserTeamName] = useState<string>("");

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');

      if (error) {
        console.error('Error fetching teams:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in fetchTeams:', error);
      return [];
    }
  };

  /**
   * Fetch players using atomic SECURITY DEFINER RPC
   * This eliminates RLS context loss issues from connection pooling
   */
  const fetchPlayersViaRPC = async (teamId: number | null): Promise<Player[]> => {
    const userId = getUserIdFromStorage();
    
    if (!userId) {
      console.error('❌ No user ID found for player fetch');
      return [];
    }
    
    console.log('📡 Fetching players via RPC:', { userId, teamId });
    
    const { data, error } = await supabase.rpc('get_players_for_team', {
      p_user_id: userId,
      p_team_id: teamId
    });
    
    if (error) {
      console.error('❌ Error fetching players via RPC:', error);
      throw error;
    }
    
    const players = (data || []) as Player[];
    console.log(`✅ RPC returned ${players.length} players`);
    
    return players;
  };

  const refreshPlayers = async (overrideTeamId?: number) => {
    const startTime = Date.now();
    const MIN_LOADING_TIME = 250; // Minimum 250ms loading time for better UX
    
    try {
      setLoading(true);
      // For admins: if no team selected, show all players. If team selected, show team players.
      // For player managers: always show their team players
      const targetTeamId = overrideTeamId ?? (authUser?.role === "player_manager" ? authUser.teamId : selectedTeam);
      
      if (targetTeamId) {
        // Fetch team players via atomic RPC
        const teamPlayers = await fetchPlayersViaRPC(targetTeamId);
        setPlayers(teamPlayers);
        console.log(`✅ Loaded ${teamPlayers.length} players for team ${targetTeamId}`);
        // For admins, also keep all players in allPlayers for reference (but don't block on it)
        if (authUser?.role === "admin") {
          // Fetch in background without blocking
          fetchPlayersViaRPC(null).then(allPlayersData => {
            setAllPlayers(allPlayersData);
          }).catch(err => {
            console.warn('Could not fetch all players for reference:', err);
          });
        }
      } else {
        // No team selected - for admins, show all players
        if (authUser?.role === "admin") {
          const playersData = await fetchPlayersViaRPC(null);
          setAllPlayers(playersData);
          setPlayers(playersData);
          console.log(`✅ Loaded ${playersData.length} players (all teams)`);
        } else {
          // Player manager without team - shouldn't happen, but handle gracefully
          setPlayers([]);
          setAllPlayers([]);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing players:', error);
      // Set empty on error to prevent stuck state
      setPlayers([]);
    } finally {
      // Ensure minimum loading time for better UX
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      if (remainingTime > 0) {
        setTimeout(() => {
          setLoading(false);
          console.log('✅ Loading complete');
        }, remainingTime);
      } else {
        setLoading(false);
        console.log('✅ Loading complete');
      }
    }
  };

  const initializeData = async () => {
    const startTime = Date.now();
    const MIN_LOADING_TIME = 250; // Minimum 250ms loading time for better UX
    
    try {
      setLoading(true);
      console.log('🔄 Initializing player data...');
      
      // Fetch teams first (fast, no RLS issues)
      const teamsData = await fetchTeams();
      setTeams(teamsData);
      console.log(`✅ Loaded ${teamsData.length} teams`);

      // Then fetch players based on role
      if (authUser?.role === "player_manager" && authUser.teamId) {
        setSelectedTeam(authUser.teamId);
        didSetInitialTeam.current = true;
        
        const userTeam = teamsData.find(team => team.team_id === authUser.teamId);
        if (userTeam) {
          setUserTeamName(userTeam.team_name);
        }
        
        // Fetch team players via atomic RPC
        const teamPlayers = await fetchPlayersViaRPC(authUser.teamId);
        setAllPlayers([]);
        setPlayers(teamPlayers);
        console.log(`✅ Loaded ${teamPlayers.length} players for team ${authUser.teamId}`);
      } else if (authUser?.role === "admin") {
        // For admins: by default, show ALL players (no team filter)
        didSetInitialTeam.current = true;
        
        // Fetch all players via atomic RPC
        const allPlayersData = await fetchPlayersViaRPC(null);
        setAllPlayers(allPlayersData);
        setPlayers(allPlayersData);
        console.log(`✅ Loaded ${allPlayersData.length} players (all teams)`);
        // Don't set selectedTeam - admin can optionally filter by team
      } else {
        // No user or unknown role - set empty
        setPlayers([]);
        setAllPlayers([]);
        console.log('⚠️ No user or unknown role, setting empty players');
      }
    } catch (error) {
      console.error('❌ Error initializing data:', error);
      // Set empty arrays on error to prevent stuck loading state
      setPlayers([]);
      setAllPlayers([]);
    } finally {
      // Ensure minimum loading time for better UX
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      if (remainingTime > 0) {
        setTimeout(() => {
          setLoading(false);
          console.log('✅ Loading complete');
        }, remainingTime);
      } else {
        setLoading(false);
        console.log('✅ Loading complete');
      }
    }
  };

  // Main initialization effect - runs only once (Strict Mode safe)
  useEffect(() => {
    if (authUser && authContextReady && !isInitialized.current) {
      isInitialized.current = true;
      console.log('✅ Auth context ready, initializing player data...');
      initializeData();
    } else if (!authUser && isInitialized.current) {
      // User logged out - reset
      isInitialized.current = false;
      setPlayers([]);
      setAllPlayers([]);
      setTeams([]);
      setSelectedTeam(null);
      setLoading(false);
    } else if (authUser && !authContextReady) {
      // User exists but context not ready yet - keep loading state
      setLoading(true);
    }
  }, [authUser, authContextReady]);

  // Cleanup on unmount for HMR/navigation
  useEffect(() => {
    return () => {
      isInitialized.current = false;
      hasFallbackFetched.current = false;
    };
  }, []);

  // On team selection changes by USER (not initialization), fetch players
  useEffect(() => {
    if (!authUser || !isInitialized.current) return;
    
    // Skip the first trigger from initialization
    if (didSetInitialTeam.current) {
      didSetInitialTeam.current = false;
      return;
    }
    
    // For admins: if team is selected, show team players. If null, show all players.
    // For player managers: always use their team
    console.log('🔄 Team selection changed, refreshing players...', { selectedTeam, role: authUser.role });
    if (authUser.role === "admin") {
      refreshPlayers(selectedTeam || undefined);
    } else if (authUser.role === "player_manager" && authUser.teamId) {
      refreshPlayers(authUser.teamId);
    }
  }, [selectedTeam, authUser]);

  // Safety fallback: if players empty after init and we have a user, try to refetch once
  useEffect(() => {
    if (
      authUser && 
      isInitialized.current && 
      !loading && 
      players.length === 0 && 
      !hasFallbackFetched.current
    ) {
      console.log('⚠️ Players empty after init, attempting fallback refetch...');
      hasFallbackFetched.current = true;
      
      // Small delay to ensure context is fully ready
      setTimeout(() => {
        if (authUser.role === "admin") {
          // Admin: try fetching all players
          refreshPlayers(undefined);
        } else if (authUser.role === "player_manager" && authUser.teamId) {
          // Player manager: try fetching their team
          refreshPlayers(authUser.teamId);
        }
      }, 500);
    }
  }, [players, loading, authUser]);

  return {
    players,
    teams,
    loading,
    selectedTeam,
    setSelectedTeam,
    refreshPlayers,
    userTeamName
  };
};
