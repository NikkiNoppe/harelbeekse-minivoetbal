
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";
import { Player, Team } from "../types";
import { User } from "@/types/auth";

export const usePlayersData = (authUser: User | null) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]); // alle spelers voor snelle filtering
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

  // Optimized: fetch players for a specific team only
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
        // Fallback to full fetch when no team context is available
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
      setLoading(true);
      
      const teamsData = await fetchTeams();
      setTeams(teamsData);

      if (authUser?.role === "player_manager" && authUser.teamId) {
        setSelectedTeam(authUser.teamId);
        didSetInitialTeam.current = true;
        
        const userTeam = teamsData.find(team => team.team_id === authUser.teamId);
        if (userTeam) {
          setUserTeamName(userTeam.team_name);
        }
        // Optimized: fetch only the user's team players
        const teamPlayers = await fetchPlayersByTeam(authUser.teamId);
        setAllPlayers([]);
        setPlayers(teamPlayers);
      } else if (authUser?.role === "admin" && teamsData.length > 0) {
        setSelectedTeam(teamsData[0].team_id);
        didSetInitialTeam.current = true;
        // Optimized: fetch only the selected team's players
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

  useEffect(() => {
    if (authUser) {
      initializeData();
    }
  }, [authUser]);

  // No realtime auto-refresh to avoid continuous reloads; we refresh only on user actions

  const didSetInitialTeam = useRef<boolean>(false);

  // On team selection changes, fetch players for that team (admin flow)
  useEffect(() => {
    if (!authUser) return;
    const targetTeamId = authUser.role === "player_manager" ? authUser.teamId : selectedTeam;
    if (targetTeamId) {
      if (didSetInitialTeam.current) {
        // Skip the first effect run caused by initial selection set during initialization
        didSetInitialTeam.current = false;
        return;
      }
      refreshPlayers(targetTeamId);
    }
  }, [selectedTeam]);

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
