
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Player, Team } from "../types";
import { User } from "@/types/auth";

export const usePlayersData = (authUser: User | null) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [userTeamName, setUserTeamName] = useState<string>("");

  const fetchTeams = async () => {
    console.log('🔄 Fetching teams...');
    try {
      const { data, error } = await supabase
        .from('teams')
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

  const fetchPlayers = async (teamId?: number) => {
    console.log('🔄 Fetching players for team:', teamId);
    try {
      let query = supabase
        .from('players')
        .select(`
          player_id,
          first_name,
          last_name,
          birth_date,
          team_id,
          is_active,
          teams (
            team_id,
            team_name
          )
        `)
        .eq('is_active', true)
        .order('last_name')
        .order('first_name');

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching players:', error);
        return [];
      }

      console.log('✅ Players fetched:', data?.length || 0, 'players for team:', teamId);
      return data || [];
    } catch (error) {
      console.error('💥 Error in fetchPlayers:', error);
      return [];
    }
  };

  const refreshPlayers = async () => {
    console.log('🔄 refreshPlayers called - START');
    console.log('📊 Refresh context:', {
      selectedTeam,
      authUserRole: authUser?.role,
      timestamp: new Date().toISOString()
    });

    try {
      setLoading(true);
      
      const targetTeamId = authUser?.role === "player_manager" ? authUser.teamId : selectedTeam;
      console.log('🎯 Target team ID for refresh:', targetTeamId);
      
      const playersData = await fetchPlayers(targetTeamId || undefined);
      console.log('📊 Refreshed players data:', playersData.length, 'players');
      
      setPlayers(playersData);
      console.log('✅ Players state updated');
    } catch (error) {
      console.error('💥 Error in refreshPlayers:', error);
    } finally {
      setLoading(false);
      console.log('🔄 refreshPlayers called - END');
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
        
        const playersData = await fetchPlayers(authUser.teamId);
        setPlayers(playersData);
      } else if (authUser?.role === "admin" && teamsData.length > 0) {
        console.log('👑 Admin detected, selecting first team:', teamsData[0].team_id);
        setSelectedTeam(teamsData[0].team_id);
        
        const playersData = await fetchPlayers(teamsData[0].team_id);
        setPlayers(playersData);
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
    if (selectedTeam && authUser?.role === "admin") {
      console.log('🔄 Selected team changed for admin:', selectedTeam);
      refreshPlayers();
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
