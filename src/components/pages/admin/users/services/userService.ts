
import { supabase } from "@/integrations/supabase/client";
import { getRpcSessionArgs } from "@/lib/authSession";
import { fetchTeamsForSession } from "@/services/core/teamsSessionFetch";
import { User } from "@/types/auth";


interface Team {
  team_id: number;
  team_name: string;
}

interface TeamUser {
  user_id: number;
  team_id: number;
  team_name: string;
}

export const fetchUsersWithTeams = async () => {
  const { data: usersData, error: usersError } = await supabase.rpc(
    'get_all_users_for_admin',
    getRpcSessionArgs(),
  );

  if (usersError) throw usersError;

  const transformedUsers: User[] = ((usersData as any[]) || []).map((user: {
    user_id: number;
    username: string;
    email?: string | null;
    role: string;
    team_users?: Array<{ team_id: number; team_name: string }>;
  }) => {
    const teamUsers = user.team_users || [];
    const userTeams = teamUsers.filter((t) => t.team_id > 0);

    return {
      id: user.user_id,
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role as User['role'],
      teamId: userTeams.length > 0 ? userTeams[0].team_id : undefined,
    };
  });

  return transformedUsers;
};

export const fetchTeams = async (): Promise<Team[]> => {
  const teams = await fetchTeamsForSession();
  return teams.map((t) => ({ team_id: t.team_id, team_name: t.team_name }));
};

export const fetchTeamUsers = async (): Promise<TeamUser[]> => {
  const { data, error } = await supabase.rpc('manage_team_user_for_session', {
    ...getRpcSessionArgs(),
    p_operation: 'list',
    p_user_id: 0,
  } as any);

  if (error) {
    console.error('Error fetching team users:', error);
    return [];
  }

  return ((data as unknown as TeamUser[]) || []);
};

export const saveUser = async (formData: any, editingUser: User | null): Promise<boolean> => {
  try {
    if (editingUser) {
      // Update existing user directly
      const updateData: any = {
        username: formData.username,
        role: formData.role,
        email: formData.email || null
      };
      
      if (formData.password?.trim()) {
        const { error: pwdError } = await supabase.rpc('update_user_password_for_session', {
          ...getRpcSessionArgs(),
          user_id_param: editingUser.id,
          new_password: formData.password
        });
        if (pwdError) throw pwdError;
      }
      
      const { data: updateResult, error: userError } = await supabase.rpc(
        'update_user_for_session',
        {
          ...getRpcSessionArgs(),
          p_user_id: editingUser.id,
          p_username: updateData.username,
          p_email: updateData.email,
          p_role: updateData.role,
        },
      );

      if (userError) throw userError;
      if (!(updateResult as { success?: boolean })?.success) {
        throw new Error('Gebruiker niet bijgewerkt');
      }

      if (formData.role === "player_manager" && formData.teamId) {
        const { error: teamLinkError } = await supabase.rpc('manage_team_user_for_session', {
          ...getRpcSessionArgs(),
          p_operation: 'assign',
          p_user_id: editingUser.id,
          p_team_id: formData.teamId,
        });
        if (teamLinkError) throw teamLinkError;
      } else if (formData.role !== "player_manager") {
        await supabase.rpc('manage_team_user_for_session', {
          ...getRpcSessionArgs(),
          p_operation: 'remove',
          p_user_id: editingUser.id,
        } as any);
      }
    } else {
      const { data: newUser, error: createError } = await supabase
        .rpc('create_user_for_session', {
          ...getRpcSessionArgs(),
          username_param: formData.username,
          email_param: formData.email || null,
          password_param: formData.password,
          role_param: formData.role
        });

      if (createError) throw createError;

      // Add team assignment if role is player_manager
      if (formData.role === "player_manager" && formData.teamId && newUser) {
        await supabase.rpc('manage_team_user_for_session', {
          ...getRpcSessionArgs(),
          p_operation: 'assign',
          p_user_id: newUser.user_id,
          p_team_id: formData.teamId,
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: number): Promise<void> => {
  const { data, error } = await supabase.rpc('delete_user_for_session', {
    ...getRpcSessionArgs(),
    p_user_id: userId,
  });
  if (error) throw error;
  if (!(data as { success?: boolean })?.success) {
    throw new Error('Gebruiker niet verwijderd');
  }
};
