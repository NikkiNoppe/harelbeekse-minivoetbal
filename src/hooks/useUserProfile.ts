import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { withUserContext } from "@/lib/supabaseUtils";

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

        // Fetch team relationships - multiple strategies to ensure we get the data
        let teams: Array<{
          team_id: number;
          team_name: string;
          club_colors?: string;
          contact_person?: string;
          contact_email?: string;
          contact_phone?: string;
        }> = [];

        // First, check localStorage for teamId (might have been set by supabaseUtils or previous operations)
        let teamIdFromStorage: number | null = null;
        try {
          const storedAuth = localStorage.getItem('auth_data');
          if (storedAuth) {
            const authData = JSON.parse(storedAuth);
            if (authData?.user?.teamId) {
              teamIdFromStorage = authData.user.teamId;
              console.log('✅ Found teamId in localStorage:', teamIdFromStorage);
            }
          }
        } catch (e) {
          console.warn('Could not read teamId from localStorage:', e);
        }

        // Use teamId from storage if authUser doesn't have it
        const effectiveTeamId = authUser.teamId || teamIdFromStorage;

        console.log('🔍 Fetching teams for user:', { 
          userId: authUser.id, 
          authTeamId: authUser.teamId, 
          storageTeamId: teamIdFromStorage,
          effectiveTeamId,
          role: authUser.role 
        });

        // Strategy 1: If we have a teamId (from auth or storage), use it directly (most reliable)
        if (effectiveTeamId) {
          console.log('✅ User has teamId in auth context, fetching team:', authUser.teamId);
          
          // First try with user context for full data
          const teamDataWithContext = await withUserContext(async () => {
            const { data: teamData, error: teamError } = await supabase
              .from('teams')
              .select('team_id, team_name, club_colors, contact_person, contact_email, contact_phone')
              .eq('team_id', effectiveTeamId)
              .single();

            if (!teamError && teamData) {
              return [{
                team_id: teamData.team_id,
                team_name: teamData.team_name,
                club_colors: teamData.club_colors,
                contact_person: teamData.contact_person,
                contact_email: teamData.contact_email,
                contact_phone: teamData.contact_phone,
              }];
            }
            return [];
          }, {
            userId: authUser.id,
            role: authUser.role,
            teamIds: String(effectiveTeamId),
          });

          if (teamDataWithContext && teamDataWithContext.length > 0) {
            teams = teamDataWithContext;
            console.log('✅ Successfully fetched team with context:', teams);
          } else {
            // Fallback: Use public view for at least team name
            console.log('⚠️ Could not fetch full team data, trying public view');
            const { data: publicTeamData, error: publicError } = await supabase
              .from('teams_public')
              .select('team_id, team_name')
              .eq('team_id', effectiveTeamId)
              .single();

            if (!publicError && publicTeamData) {
              teams = [{
                team_id: publicTeamData.team_id,
                team_name: publicTeamData.team_name,
              }];
              console.log('✅ Successfully fetched team from public view:', teams);
            }
          }
        }

        // Strategy 2: If no teamId found yet, try to fetch it from team_users
        // Strategy 2: If no teamId in auth user, try to fetch it from team_users first
        if (teams.length === 0 && !effectiveTeamId && authUser.role === 'player_manager') {
          console.log('🔄 No teamId in auth user, fetching from team_users first');
          const teamIdResult = await withUserContext(async () => {
            const { data: teamUsersData, error: teamUsersError } = await supabase
              .from('team_users')
              .select('team_id')
              .eq('user_id', authUser.id)
              .limit(1);

            if (teamUsersError) {
              console.warn('Could not fetch team_id from team_users:', teamUsersError);
              return null;
            }

            if (teamUsersData && teamUsersData.length > 0 && teamUsersData[0].team_id) {
              return teamUsersData[0].team_id;
            }
            return null;
          }, {
            userId: authUser.id,
            role: authUser.role,
          });

          // If we found a teamId, use it to fetch the team
          if (teamIdResult) {
            console.log('✅ Found teamId from team_users:', teamIdResult);
            
            // Update localStorage immediately so it's available for next operations
            try {
              const storedAuth = localStorage.getItem('auth_data');
              if (storedAuth) {
                const authData = JSON.parse(storedAuth);
                if (authData?.user) {
                  authData.user.teamId = teamIdResult;
                  localStorage.setItem('auth_data', JSON.stringify(authData));
                  console.log('✅ Updated localStorage with found teamId:', teamIdResult);
                }
              }
            } catch (e) {
              console.warn('Could not update localStorage:', e);
            }
            
            const teamDataWithFoundId = await withUserContext(async () => {
              const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('team_id, team_name, club_colors, contact_person, contact_email, contact_phone')
                .eq('team_id', teamIdResult)
                .single();

              if (!teamError && teamData) {
                return [{
                  team_id: teamData.team_id,
                  team_name: teamData.team_name,
                  club_colors: teamData.club_colors,
                  contact_person: teamData.contact_person,
                  contact_email: teamData.contact_email,
                  contact_phone: teamData.contact_phone,
                }];
              }
              if (teamError) {
                console.warn('Error fetching team data:', teamError);
              }
              return [];
            }, {
              userId: authUser.id,
              role: authUser.role,
              teamIds: String(teamIdResult),
            });

            if (teamDataWithFoundId && teamDataWithFoundId.length > 0) {
              teams = teamDataWithFoundId;
              console.log('✅ Successfully fetched team with found teamId:', teams);
            }
          }
        }

        // Strategy 3: If still no teams, try via team_users table with full join
        if (teams.length === 0) {
          console.log('🔄 Trying to fetch via team_users table with full join');
          const teamDataFromUsers = await withUserContext(async () => {
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

            if (teamUsersError) {
              console.warn('Could not fetch team_users:', teamUsersError);
              return [];
            }

            if (teamUsersData && teamUsersData.length > 0) {
              return teamUsersData
                .map((tu: any) => ({
                  team_id: tu.teams?.team_id || tu.team_id,
                  team_name: tu.teams?.team_name || 'Onbekend Team',
                  club_colors: tu.teams?.club_colors,
                  contact_person: tu.teams?.contact_person,
                  contact_email: tu.teams?.contact_email,
                  contact_phone: tu.teams?.contact_phone,
                }))
                .filter((t: any) => t.team_id);
            }
            return [];
          }, {
            userId: authUser.id,
            role: authUser.role,
            teamIds: authUser.teamId ? String(authUser.teamId) : undefined,
          });

          if (teamDataFromUsers && teamDataFromUsers.length > 0) {
            teams = teamDataFromUsers;
            console.log('✅ Successfully fetched teams via team_users:', teams);
          }
        }

        console.log('📊 Final teams result:', teams);

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

