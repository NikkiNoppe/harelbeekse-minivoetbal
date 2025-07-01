
import { supabase } from "@shared/integrations/supabase/client";
import { User } from "@shared/types/auth";

interface Team {
  team_id: number;
  team_name: string;
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('username');
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    return (data || []).map(user => ({
      id: user.user_id,
      username: user.username,
      email: user.email || '',
      password: '',
      role: user.role,
      teamId: undefined
    }));
  },

  async getAllTeams(): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('team_id, team_name')
      .order('team_name');
    
    if (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
    
    return data || [];
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }
    
    return {
      id: data.user_id,
      username: data.username,
      email: data.email || '',
      password: '',
      role: data.role,
      teamId: undefined
    };
  },

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        username: userData.username,
        email: userData.email,
        role: userData.role
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }
    
    return {
      id: data.user_id,
      username: data.username,
      email: data.email || '',
      password: '',
      role: data.role,
      teamId: undefined
    };
  },

  async deleteUser(userId: number): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
    
    return true;
  }
};
