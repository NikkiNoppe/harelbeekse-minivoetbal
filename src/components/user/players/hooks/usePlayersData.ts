
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Player, Team } from "../types";
import { useToast } from "@/hooks/use-toast";

export const usePlayersData = (authUser: any) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [userTeamName, setUserTeamName] = useState<string>("");
  const { toast } = useToast();

  console.log('🔍 usePlayersData - Auth User:', {
    authUser: authUser,
    role: authUser?.role,
    email: authUser?.email
  });

  // Set user team based on role when authUser changes
  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!authUser?.email) {
        console.log('⚠️ No auth user email available');
        return;
      }

      console.log('🔄 Fetching user team data for:', authUser.email);
      
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select(`
            *,
            team_users (
              teams (
                team_id,
                team_name
              )
            )
          `)
          .eq('email', authUser.email)
          .single();

        if (error) {
          console.error('❌ Error fetching user team data:', error);
          return;
        }

        console.log('📊 User team data fetched:', userData);

        if (authUser.role === "player_manager" && userData?.team_users?.[0]?.teams) {
          const teamData = userData.team_users[0].teams;
          console.log('🎯 Setting team for player_manager:', teamData);
          setSelectedTeam(teamData.team_id);
          setUserTeamName(teamData.team_name);
        } else if (authUser.role === "admin") {
          console.log('🎯 Admin user detected - no automatic team selection');
          // For admin, don't auto-select a team
          setSelectedTeam(null);
          setUserTeamName("");
        }
      } catch (error) {
        console.error('💥 Error in fetchUserTeam:', error);
      }
    };

    fetchUserTeam();
  }, [authUser]);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      console.log('🔄 Fetching teams...');
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('team_name');

        if (error) throw error;
        
        console.log('📊 Teams fetched:', data?.length || 0, 'teams');
        setTeams(data || []);
      } catch (error) {
        console.error('❌ Error fetching teams:', error);
        toast({
          title: "Fout bij laden teams",
          description: "Kon teams niet laden",
          variant: "destructive",
        });
      }
    };

    fetchTeams();
  }, [toast]);

  // Fetch players based on selected team
  const fetchPlayers = async () => {
    if (!selectedTeam) {
      console.log('⚠️ No team selected, clearing players list');
      setPlayers([]);
      setLoading(false);
      return;
    }

    console.log('🔄 FETCHING PLAYERS for team:', selectedTeam);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          player_id,
          first_name,
          last_name,
          birth_date,
          team_id,
          is_active,
          teams (
            team_name
          )
        `)
        .eq('team_id', selectedTeam)
        .eq('is_active', true)
        .order('last_name')
        .order('first_name');

      if (error) {
        console.error('❌ Error fetching players:', error);
        throw error;
      }

      console.log('📊 RAW PLAYERS DATA from database:', data);
      console.log('📊 Number of players fetched:', data?.length || 0);
      
      setPlayers(data || []);
      console.log('✅ Players state updated with:', data?.length || 0, 'players');
      
    } catch (error) {
      console.error('💥 Error in fetchPlayers:', error);
      toast({
        title: "Fout bij laden spelers",
        description: "Kon spelers niet laden",
        variant: "destructive",
      });
      setPlayers([]);
    } finally {
      setLoading(false);
      console.log('🏁 fetchPlayers completed, loading set to false');
    }
  };

  // Refresh players function for external use
  const refreshPlayers = async () => {
    console.log('🔄 REFRESH PLAYERS called');
    await fetchPlayers();
    console.log('✅ REFRESH PLAYERS completed');
  };

  // Fetch players when selectedTeam changes
  useEffect(() => {
    console.log('🎯 useEffect triggered - selectedTeam changed to:', selectedTeam);
    fetchPlayers();
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
