
import { supabase } from "@/integrations/supabase/client";
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

  if (usersError) throw usersError;

  const transformedUsers: User[] = (usersData || []).map(user => {
    const teamUsers = user.team_users || [];
    const userTeams = teamUsers.map(tu => ({
      team_id: tu.teams?.team_id || 0,
      team_name: tu.teams?.team_name || ''
    })).filter(t => t.team_id > 0);
    
    return {
      id: user.user_id,
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role as any,
      teamId: userTeams.length > 0 ? userTeams[0].team_id : undefined
    };
  });

  return transformedUsers;
};

export const fetchTeams = async (): Promise<Team[]> => {
  const { data, error } = await supabase
    .from('teams')
    .select('team_id, team_name')
    .order('team_name');
  
  if (error) throw error;
  return data || [];
};

export const fetchTeamUsers = async (): Promise<TeamUser[]> => {
  const { data, error } = await supabase
    .from('team_users')
    .select(`
      user_id,
      team_id,
      teams!team_users_team_id_fkey(team_name)
    `);
  
  if (error) {
    console.error('Error fetching team users:', error);
    return [];
  }
  
  return (data || []).map(item => ({
    user_id: item.user_id,
    team_id: item.team_id,
    team_name: (item.teams as any)?.team_name || 'Unknown Team'
  }));
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
        const { error: pwdError } = await supabase.rpc('update_user_password', {
          user_id_param: editingUser.id,
          new_password: formData.password
        });
        if (pwdError) throw pwdError;
      }
      
      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('user_id', editingUser.id);

      if (userError) throw userError;

      // Update team assignment if role is player_manager
      if (formData.role === "player_manager" && formData.teamId) {
        // Remove existing team assignment
        await supabase
          .from('team_users')
          .delete()
          .eq('user_id', editingUser.id);
        
        // Add new team assignment
        await supabase
          .from('team_users')
          .insert({
            user_id: editingUser.id,
            team_id: formData.teamId
          });
      }
    } else {
      const { data: newUser, error: createError } = await supabase
        .rpc('create_user_with_hashed_password', {
          username_param: formData.username,
          email_param: formData.email || null,
          password_param: formData.password,
          role_param: formData.role
        });

      if (createError) throw createError;

      // Add team assignment if role is player_manager
      if (formData.role === "player_manager" && formData.teamId && newUser) {
        await supabase
          .from('team_users')
          .insert({
            user_id: newUser.user_id,
            team_id: formData.teamId
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
  // Remove team assignment first
  await supabase
    .from('team_users')
    .delete()
    .eq('user_id', userId);
  
  // Delete user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
};
