
import { supabase } from "@/integrations/supabase/client";
import { DbUser, Team } from "./types";
import { useToast } from "@/hooks/use-toast";

export const useUserDataService = () => {
  const { toast } = useToast();

  // Function to fetch both users and teams data
  const fetchData = async () => {
    try {
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');
      
      if (teamsError) throw teamsError;
      
      // Fetch users with their teams (including email)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          user_id,
          username,
          email,
          role
        `);
      
      if (usersError) throw usersError;
      
      // Fetch team managers relationships
      const { data: teamUsersData, error: teamUsersError } = await supabase
        .from('team_users')
        .select(`
          user_id,
          team_id,
          teams (
            team_id,
            team_name
          )
        `);
      
      if (teamUsersError) throw teamUsersError;
      
      // Map team manager data to organize by user_id
      const userTeamsMap: Record<number, { team_id: number; team_name: string }[]> = {};
      
      teamUsersData.forEach((manager) => {
        if (!userTeamsMap[manager.user_id]) {
          userTeamsMap[manager.user_id] = [];
        }
        
        if (manager.teams) {
          userTeamsMap[manager.user_id].push({
            team_id: manager.teams.team_id,
            team_name: manager.teams.team_name
          });
        }
      });
      
      // Combine user data with team data
      const formattedUsers: DbUser[] = usersData.map(user => {
        const userTeams = userTeamsMap[user.user_id] || [];
        
        // For backwards compatibility, set the first team as the main team
        const mainTeam = userTeams.length > 0 ? userTeams[0] : null;
        
        return {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          team_id: mainTeam ? mainTeam.team_id : null,
          team_name: mainTeam ? mainTeam.team_name : null,
          teams: userTeams.length > 0 ? userTeams : []
        };
      });
      
      return {
        users: formattedUsers,
        teams: teamsData || []
      };
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Fout bij laden",
        description: "Er is een fout opgetreden bij het laden van gebruikersgegevens.",
        variant: "destructive",
      });
      return { users: [], teams: [] };
    }
  };

  return { fetchData };
};
