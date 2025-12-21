
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { useAuth } from "@/components/pages/login/AuthProvider";
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

  const fetchPlayers = async () => {
    try {
      return await withUserContext(async () => {
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
          return [];
        }
        return data || [];
      });
    } catch (error) {
      console.error('Error in fetchPlayers:', error);
      return [];
    }
  };

  const fetchPlayersByTeam = async (teamId: number) => {
    try {
      return await withUserContext(async () => {
        const { data, error } = await supabase
          .from('players')
          .select('player_id, first_name, last_name, birth_date, team_id')
          .eq('team_id', teamId)
          .order('last_name')
          .order('first_name');

        if (error) {
          console.error('Error fetching players by team:', error);
          return [];
        }
        return data || [];
      });
    } catch (error) {
      console.error('Error in fetchPlayersByTeam:', error);
      return [];
    }
  };

  const refreshPlayers = async (overrideTeamId?: number) => {
    try {
      setLoading(true);
      const targetTeamId = overrideTeamId ?? (authUser?.role === "player_manager" ? authUser.teamId : selectedTeam);
      if (targetTeamId) {
        const teamPlayers = await fetchPlayersByTeam(targetTeamId);
        setPlayers(teamPlayers);
      } else {
        const playersData = await fetchPlayers();
        setAllPlayers(playersData);
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('❌ Error refreshing players:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    try {
      const teamsData = await fetchTeams();
      setTeams(teamsData);

      if (authUser?.role === "player_manager" && authUser.teamId) {
        setSelectedTeam(authUser.teamId);
        didSetInitialTeam.current = true;
        
        const userTeam = teamsData.find(team => team.team_id === authUser.teamId);
        if (userTeam) {
          setUserTeamName(userTeam.team_name);
        }
        const teamPlayers = await fetchPlayersByTeam(authUser.teamId);
        setAllPlayers([]);
        setPlayers(teamPlayers);
      } else if (authUser?.role === "admin" && teamsData.length > 0) {
        setSelectedTeam(teamsData[0].team_id);
        didSetInitialTeam.current = true;
        const teamPlayers = await fetchPlayersByTeam(teamsData[0].team_id);
        setAllPlayers([]);
        setPlayers(teamPlayers);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
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
    
    const targetTeamId = authUser.role === "player_manager" ? authUser.teamId : selectedTeam;
    if (targetTeamId) {
      refreshPlayers(targetTeamId);
    }
  }, [selectedTeam]);

  // Safety fallback: if admin AND players empty after init, refetch once
  useEffect(() => {
    if (
      authUser?.role === 'admin' && 
      isInitialized.current && 
      !loading && 
      players.length === 0 && 
      selectedTeam && 
      !hasFallbackFetched.current
    ) {
      console.log('⚠️ Admin fallback: players empty after init, refetching once...');
      hasFallbackFetched.current = true;
      refreshPlayers(selectedTeam);
    }
  }, [players, loading, selectedTeam, authUser?.role]);

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
