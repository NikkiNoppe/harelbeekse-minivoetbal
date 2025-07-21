import { supabase } from "../../MINIVOETBAL.SDK/client";

export interface Referee {
  user_id: number;
  username: string;
  email?: string;
}

export const refereeService = {
  // Get all users with referee role
  async getReferees(): Promise<Referee[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, email')
        .eq('role', 'referee')
        .order('username');

      if (error) {
        console.error('Error fetching referees:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in refereeService.getReferees:', error);
      throw error;
    }
  },

  // Get referee by ID
  async getRefereeById(userId: number): Promise<Referee | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, email')
        .eq('user_id', userId)
        .eq('role', 'referee')
        .single();

      if (error) {
        console.error('Error fetching referee by ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in refereeService.getRefereeById:', error);
      throw error;
    }
  }
}; 