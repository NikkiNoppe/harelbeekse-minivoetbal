
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { useAuth } from "@/hooks/useAuth";
import { Player, Team } from "../types";
import { User } from "@/types/auth";

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

  const fetchPlayers = async (retryCount = 0): Promise<Player[]> => {
    try {
      const result = await withUserContext(async () => {
        const { data, error } = await supabase
          .from('players')
          .select(`
            player_id,
            first_name,
            last_name,
            birth_date,
            team_id,
            teams (
              team_id,
              team_name
            )
          `)
          .order('last_name')
          .order('first_name');
        
        if (error) {
          console.error('Error fetching players:', error);
          // Retry once if it's a context/RLS error
          if (retryCount === 0 && (error.message?.includes('RLS') || error.message?.includes('policy'))) {
            console.log('🔄 Retrying players fetch after context error...');
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 300));
            return fetchPlayers(1);
          }
          return [];
        }
        return data || [];
      });
      return result;
    } catch (error) {
      console.error('Error in fetchPlayers:', error);
      // Retry once on error
      if (retryCount === 0) {
        console.log('🔄 Retrying players fetch after error...');
        await new Promise(resolve => setTimeout(resolve, 300));
        return fetchPlayers(1);
      }
      return [];
    }
  };

  const fetchPlayersByTeam = async (teamId: number, retryCount = 0): Promise<Player[]> => {
    try {
      const result = await withUserContext(async () => {
        const { data, error } = await supabase
          .from('players')
          .select('player_id, first_name, last_name, birth_date, team_id')
          .eq('team_id', teamId)
          .order('last_name')
          .order('first_name');

        if (error) {
          console.error('Error fetching players by team:', error);
          // Retry once if it's a context/RLS error
          if (retryCount === 0 && (error.message?.includes('RLS') || error.message?.includes('policy'))) {
            console.log('🔄 Retrying team players fetch after context error...');
            await new Promise(resolve => setTimeout(resolve, 300));
            return fetchPlayersByTeam(teamId, 1);
          }
          return [];
        }
        return data || [];
      });
      return result;
    } catch (error) {
      console.error('Error in fetchPlayersByTeam:', error);
      // Retry once on error
      if (retryCount === 0) {
        console.log('🔄 Retrying team players fetch after error...');
        await new Promise(resolve => setTimeout(resolve, 300));
        return fetchPlayersByTeam(teamId, 1);
      }
      return [];
    }
  };

  const refreshPlayers = async (overrideTeamId?: number) => {
    try {
      setLoading(true);
      // For admins: if no team selected, show all players. If team selected, show team players.
      // For player managers: always show their team players
      const targetTeamId = overrideTeamId ?? (authUser?.role === "player_manager" ? authUser.teamId : selectedTeam);
      
      if (targetTeamId) {
        // Fetch team players
        const teamPlayers = await fetchPlayersByTeam(targetTeamId);
        setPlayers(teamPlayers);
        // For admins, also keep all players in allPlayers for reference (but don't block on it)
        if (authUser?.role === "admin") {
          // Fetch in background without blocking
          fetchPlayers().then(allPlayersData => {
            setAllPlayers(allPlayersData);
          }).catch(err => {
            console.warn('Could not fetch all players for reference:', err);
          });
        }
      } else {
        // No team selected - for admins, show all players
        if (authUser?.role === "admin") {
          const playersData = await fetchPlayers();
          setAllPlayers(playersData);
          setPlayers(playersData);
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
      setLoading(false);
    }
  };

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Fetch teams first (fast, no RLS issues)
      const teamsData = await fetchTeams();
      setTeams(teamsData);

      // Then fetch players based on role
      if (authUser?.role === "player_manager" && authUser.teamId) {
        setSelectedTeam(authUser.teamId);
        didSetInitialTeam.current = true;
        
        const userTeam = teamsData.find(team => team.team_id === authUser.teamId);
        if (userTeam) {
          setUserTeamName(userTeam.team_name);
        }
        
        // Fetch team players
        const teamPlayers = await fetchPlayersByTeam(authUser.teamId);
        setAllPlayers([]);
        setPlayers(teamPlayers);
      } else if (authUser?.role === "admin") {
        // For admins: by default, show ALL players (no team filter)
        didSetInitialTeam.current = true;
        
        // Fetch all players (parallel with teams if possible, but teams already done)
        const allPlayersData = await fetchPlayers();
        setAllPlayers(allPlayersData);
        setPlayers(allPlayersData);
        // Don't set selectedTeam - admin can optionally filter by team
      } else {
        // No user or unknown role - set empty
        setPlayers([]);
        setAllPlayers([]);
      }
    } catch (error) {
      console.error('❌ Error initializing data:', error);
      // Set empty arrays on error to prevent stuck loading state
      setPlayers([]);
      setAllPlayers([]);
    } finally {
      setLoading(false);
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
    if (authUser.role === "admin") {
      refreshPlayers(selectedTeam || undefined);
    } else if (authUser.role === "player_manager" && authUser.teamId) {
      refreshPlayers(authUser.teamId);
    }
  }, [selectedTeam]);

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
