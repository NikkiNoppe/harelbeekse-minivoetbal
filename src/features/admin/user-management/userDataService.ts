
import { supabase } from "@shared/integrations/supabase/client";
import { DbUser, Team } from "./types";

export const useUserDataService = () => {
  const fetchData = async () => {
    try {
      console.log('Fetching users and teams from database');
      
      // Fetch users with their team relationships - fix the ambiguous relationship
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          user_id,
          username,
          email,
          role,
          team_users!left (
            team_id,
            teams!team_users_team_id_fkey (
              team_id,
              team_name
            )
          )
        `)
        .order('username');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('team_id, team_name')
        .order('team_name');

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        throw teamsError;
      }

      // Transform users data to include team information
      const transformedUsers: DbUser[] = (usersData || []).map(user => {
        const teamUsers = user.team_users || [];
        const teams = teamUsers.map(tu => ({
          team_id: tu.teams?.team_id || 0,
          team_name: tu.teams?.team_name || ''
        })).filter(t => t.team_id > 0);
        
        return {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          team_id: teams.length > 0 ? teams[0].team_id : null,
          team_name: teams.length > 0 ? teams[0].team_name : null,
          teams: teams
        };
      });

      console.log('Successfully fetched users:', transformedUsers.length);
      console.log('Successfully fetched teams:', teamsData?.length || 0);

      return {
        users: transformedUsers,
        teams: teamsData as Team[] || []
      };
    } catch (error) {
      console.error('Error in fetchData:', error);
      return {
        users: [],
        teams: []
      };
    }
  };

  return { fetchData };
};
