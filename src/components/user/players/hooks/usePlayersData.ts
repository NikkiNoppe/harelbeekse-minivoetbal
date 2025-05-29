
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Player, Team } from "../types";

export const usePlayersData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [userTeamName, setUserTeamName] = useState<string>("");
  
  // Fetch teams from Supabase
  useEffect(() => {
    async function fetchTeams() {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('team_id, team_name')
          .order('team_name');
        
        if (error) throw error;
        
        setTeams(data || []);
        
        // If user is player_manager, get their assigned team
        if (user && user.role === "player_manager") {
          const { data: teamUserData, error: teamUserError } = await supabase
            .from('team_users')
            .select('team_id, teams(team_name)')
            .eq('user_id', user.id)
            .single();
          
          if (teamUserError) {
            console.error('Error fetching user team:', teamUserError);
          } else if (teamUserData) {
            setSelectedTeam(teamUserData.team_id);
            setUserTeamName((teamUserData.teams as any)?.team_name || "");
          }
        } else if (data && data.length > 0) {
          // For admin, select first team by default
          setSelectedTeam(data[0].team_id);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: "Fout bij laden",
          description: "Er is een fout opgetreden bij het laden van de teams.",
          variant: "destructive",
        });
      }
    }
    
    fetchTeams();
  }, [user, toast]);
  
  // Fetch players when selected team changes
  useEffect(() => {
    async function fetchPlayers() {
      if (!selectedTeam) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('players' as any)
          .select('player_id, first_name, last_name, birth_date, team_id, is_active')
          .eq('team_id', selectedTeam)
          .eq('is_active', true)
          .order('first_name');
        
        if (error) throw error;
        
        setPlayers((data as unknown) as Player[] || []);
      } catch (error) {
        console.error('Error fetching players:', error);
        toast({
          title: "Fout bij laden",
          description: "Er is een fout opgetreden bij het laden van de spelers.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlayers();
  }, [selectedTeam, toast]);

  const refreshPlayers = async () => {
    if (!selectedTeam) return;
    
    try {
      const { data, error } = await supabase
        .from('players' as any)
        .select('player_id, first_name, last_name, birth_date, team_id, is_active')
        .eq('team_id', selectedTeam)
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      
      setPlayers((data as unknown) as Player[] || []);
    } catch (error) {
      console.error('Error refreshing players:', error);
    }
  };
  
  return {
    players,
    setPlayers,
    teams,
    loading,
    selectedTeam,
    setSelectedTeam,
    refreshPlayers,
    user,
    userTeamName
  };
};
