import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserProfileForSession } from "@/services/core/userProfileSessionFetch";
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
        const profile = await fetchUserProfileForSession();
        if (!profile) {
          throw new Error('Geen profiel voor sessie');
        }

        return {
          user: {
            user_id: profile.user_id,
            username: profile.username || authUser.username || 'Onbekende gebruiker',
            email: profile.email || authUser.email || '',
            role: profile.role || authUser.role || '',
          },
          teams: profile.teams.map((t) => ({
            team_id: t.team_id,
            team_name: t.team_name,
            club_colors: t.club_colors,
            contact_person: t.contact_person,
            contact_email: t.contact_email,
            contact_phone: t.contact_phone,
          })),
          teamUsers: profile.team_users,
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
