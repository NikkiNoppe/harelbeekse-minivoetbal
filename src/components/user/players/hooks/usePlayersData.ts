
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    console.log('🔄 Fetching teams...');
    try {
      const { data, error } = await supabase
        .from('teams_public')
        .select('team_id, team_name')
        .order('team_name');

      if (error) {
        console.error('❌ Error fetching teams:', error);
        return [];
      }

      console.log('✅ Teams fetched:', data?.length || 0, 'teams');
      return data || [];
    } catch (error) {
      console.error('💥 Error in fetchTeams:', error);
      return [];
    }
  };

  const fetchPlayers = async () => {
    console.log('🔄 Fetching all players with teams...');
    try {
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
        console.error('❌ Error fetching players:', error);
        return [];
      }
      console.log('✅ Players fetched:', data?.length || 0, 'players');
      return data || [];
    } catch (error) {
      console.error('💥 Error in fetchPlayers:', error);
      return [];
    }
  };

  const refreshPlayers = async () => {
    try {
      setLoading(true);
      const playersData = await fetchPlayers();
      setAllPlayers(playersData);
      // Filter direct op huidig team
      const targetTeamId = authUser?.role === "player_manager" ? authUser.teamId : selectedTeam;
      if (targetTeamId) {
        setPlayers(playersData.filter((p: any) => p.team_id === targetTeamId));
      } else {
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('❌ Error refreshing players:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    console.log('🚀 Initializing player data...');
    try {
      setLoading(true);
      
      const teamsData = await fetchTeams();
      setTeams(teamsData);

      if (authUser?.role === "player_manager" && authUser.teamId) {
        console.log('👤 Player manager detected, setting team:', authUser.teamId);
        setSelectedTeam(authUser.teamId);
        
        const userTeam = teamsData.find(team => team.team_id === authUser.teamId);
        if (userTeam) {
          setUserTeamName(userTeam.team_name);
          console.log('📝 User team name set:', userTeam.team_name);
        }
        
        const playersData = await fetchPlayers(); // Fetch all players here
        setAllPlayers(playersData); // Store all players
        setPlayers(playersData.filter((p: any) => p.team_id === authUser.teamId)); // Filter for the user's team
      } else if (authUser?.role === "admin" && teamsData.length > 0) {
        console.log('👑 Admin detected, selecting first team:', teamsData[0].team_id);
        setSelectedTeam(teamsData[0].team_id);
        
        const playersData = await fetchPlayers(); // Fetch all players here
        setAllPlayers(playersData); // Store all players
        setPlayers(playersData.filter((p: any) => p.team_id === teamsData[0].team_id)); // Filter for the selected team
      }
    } catch (error) {
      console.error('💥 Error initializing data:', error);
    } finally {
      setLoading(false);
      console.log('✅ Data initialization complete');
    }
  };

  useEffect(() => {
    if (authUser) {
      initializeData();
    }
  }, [authUser]);

  useEffect(() => {
    // Filter alleen in-memory bij teamselectie
    if (allPlayers.length > 0 && (selectedTeam || authUser?.role === "player_manager")) {
      const targetTeamId = authUser?.role === "player_manager" ? authUser.teamId : selectedTeam;
      if (targetTeamId) {
        setPlayers(allPlayers.filter((p: any) => p.team_id === targetTeamId));
      } else {
        setPlayers(allPlayers);
      }
    }
  }, [selectedTeam, allPlayers, authUser]);

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
