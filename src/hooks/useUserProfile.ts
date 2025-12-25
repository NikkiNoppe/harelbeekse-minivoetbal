import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserProfileData {
  user: {
    user_id: number;
    username: string;
    email: string;
    role: string;
  };
  teams: Array<{
    team_id: number;
    team_name: string;
    club_colors?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
  }>;
  teamUsers: Array<{
    team_id: number;
    team_name: string;
  }>;
}

export const useUserProfile = () => {
  const { user: authUser } = useAuth();

  const query = useQuery({
    queryKey: ['userProfile', authUser?.id],
    queryFn: async (): Promise<UserProfileData> => {
      if (!authUser?.id) {
        // Return empty profile if no auth user
        return {
          user: {
            user_id: 0,
            username: 'Onbekende gebruiker',
            email: '',
            role: '',
          },
          teams: [],
          teamUsers: [],
        };
      }

      try {
        // Fetch user data from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_id, username, email, role')
          .eq('user_id', authUser.id)
          .single();

        // If database query fails, use auth user data as fallback
        let userInfo = {
          user_id: authUser.id,
          username: authUser.username || authUser.email || 'Onbekende gebruiker',
          email: authUser.email || '',
          role: authUser.role || '',
        };

        if (!userError && userData) {
          // Use database data if available
          userInfo = {
            user_id: userData.user_id,
            username: userData.username || authUser.username || 'Onbekende gebruiker',
            email: userData.email || authUser.email || '',
            role: userData.role || authUser.role || '',
          };
        } else if (userError) {
          // Log warning but continue with auth user data
          console.warn('Could not fetch user from database, using auth data:', userError);
        }

        // Fetch team relationships - don't throw on error, just log and continue
        const { data: teamUsersData, error: teamUsersError } = await supabase
          .from('team_users')
          .select(`
            team_id,
            teams!team_users_team_id_fkey (
              team_id,
              team_name,
              club_colors,
              contact_person,
              contact_email,
              contact_phone
            )
          `)
          .eq('user_id', authUser.id);

        // Log warning but don't throw - empty teams is valid
        if (teamUsersError) {
          console.warn('Could not fetch team_users (likely RLS or no teams):', teamUsersError);
        }

        // Transform team data - empty array is fine
        const teams = (teamUsersData || [])
          .map((tu: any) => ({
            team_id: tu.teams?.team_id || tu.team_id,
            team_name: tu.teams?.team_name || 'Onbekend Team',
            club_colors: tu.teams?.club_colors,
            contact_person: tu.teams?.contact_person,
            contact_email: tu.teams?.contact_email,
            contact_phone: tu.teams?.contact_phone,
          }))
          .filter((t: any) => t.team_id);

        return {
          user: userInfo,
          teams: teams || [],
          teamUsers: (teams || []).map(t => ({
            team_id: t.team_id,
            team_name: t.team_name,
          })),
        };
      } catch (error) {
        console.error('Error fetching user profile, using auth data as fallback:', error);
        // Return profile with auth user data as fallback
        return {
          user: {
            user_id: authUser.id,
            username: authUser.username || authUser.email || 'Onbekende gebruiker',
            email: authUser.email || '',
            role: authUser.role || '',
          },
          teams: [],
          teamUsers: [],
        };
      }
    },
    enabled: !!authUser?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    ...query,
    profileData: query.data || {
      user: {
        user_id: authUser?.id || 0,
        username: authUser?.username || authUser?.email || 'Onbekende gebruiker',
        email: authUser?.email || '',
        role: authUser?.role || '',
      },
      teams: [],
      teamUsers: [],
    },
  };
};

