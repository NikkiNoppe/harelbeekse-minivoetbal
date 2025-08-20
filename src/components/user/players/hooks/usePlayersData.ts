
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

  // Optimized: fetch players for a specific team only
  const fetchPlayersByTeam = async (teamId: number) => {
    console.log('🔄 Fetching players for team:', teamId);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('player_id, first_name, last_name, birth_date, team_id')
        .eq('team_id', teamId)
        .order('last_name')
        .order('first_name');

      if (error) {
        console.error('❌ Error fetching players by team:', error);
        return [];
      }

      console.log('✅ Team players fetched:', data?.length || 0, 'players');
      return data || [];
    } catch (error) {
      console.error('💥 Error in fetchPlayersByTeam:', error);
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
        // Optimized: fetch only the user's team players
        const teamPlayers = await fetchPlayersByTeam(authUser.teamId);
        setAllPlayers([]);
        setPlayers(teamPlayers);
      } else if (authUser?.role === "admin" && teamsData.length > 0) {
        console.log('👑 Admin detected, selecting first team:', teamsData[0].team_id);
        setSelectedTeam(teamsData[0].team_id);
        // Optimized: fetch only the selected team's players
        const teamPlayers = await fetchPlayersByTeam(teamsData[0].team_id);
        setAllPlayers([]);
        setPlayers(teamPlayers);
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

  // Realtime: auto-refresh when players change for the active team
  useEffect(() => {
    const targetTeamId = authUser?.role === "player_manager" ? authUser.teamId : selectedTeam;
    if (!targetTeamId) return;

    const channel = supabase
      .channel(`players-team-${targetTeamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        (payload: any) => {
          const affectedTeamIds = [payload.new?.team_id, payload.old?.team_id].filter(Boolean);
          if (affectedTeamIds.includes(targetTeamId)) {
            console.log('🔔 Players change detected for team, refreshing...');
            refreshPlayers(targetTeamId);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (_) {}
    };
  }, [authUser, selectedTeam]);

  // On team selection changes, fetch players for that team (admin flow)
  useEffect(() => {
    if (!authUser) return;
    const targetTeamId = authUser.role === "player_manager" ? authUser.teamId : selectedTeam;
    if (targetTeamId) {
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
