import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchTeamsForSession } from "@/services/core/teamsSessionFetch";
import { getSessionToken } from "@/lib/authSession";

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
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_id, username, email, role')
          .eq('user_id', authUser.id)
          .single();

        let userInfo = {
          user_id: authUser.id,
          username: authUser.username || authUser.email || 'Onbekende gebruiker',
          email: authUser.email || '',
          role: authUser.role || '',
        };

        if (!userError && userData) {
          userInfo = {
            user_id: userData.user_id,
            username: userData.username || authUser.username || 'Onbekende gebruiker',
            email: userData.email || authUser.email || '',
            role: userData.role || authUser.role || '',
          };
        } else if (userError) {
          console.warn('Could not fetch user from database, using auth data:', userError);
        }

        const effectiveTeamId = authUser.teamId ?? undefined;
        const sessionTeams = await fetchTeamsForSession(effectiveTeamId);

        const teams = sessionTeams.map((t) => ({
          team_id: t.team_id,
          team_name: t.team_name,
          club_colors: t.club_colors,
          contact_person: t.contact_person,
          contact_email: t.contact_email,
          contact_phone: t.contact_phone,
        }));

        return {
          user: userInfo,
          teams,
          teamUsers: teams.map((t) => ({
            team_id: t.team_id,
            team_name: t.team_name,
          })),
        };
      } catch (error) {
        console.error('Error fetching user profile, using auth data as fallback:', error);
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
    enabled: !!authUser?.id && !!getSessionToken(),
    staleTime: 0,
    refetchOnMount: 'always',
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
