import { supabase } from "@/integrations/supabase/client";
import { withUserContext } from "@/lib/supabaseUtils";

export interface Referee {
  user_id: number;
  username: string;
  email?: string; // no longer fetched client-side; kept optional for backward compat
}

export const refereeService = {
  // Get all users with referee role
  async getReferees(): Promise<Referee[]> {
    try {
      // Use withUserContext to ensure RLS policies work correctly
      return await withUserContext(async () => {
        const { data, error } = await supabase
          .from('referees_public' as any)
          .select('user_id, username')
          .order('username');

        if (error) {
          console.error('Error fetching referees:', error);
          throw error;
        }

        return (data as unknown as Referee[]) || [];
      });
    } catch (error) {
      console.error('Error in refereeService.getReferees:', error);
      throw error;
    }
  },

  // Get referee by ID
  async getRefereeById(userId: number): Promise<Referee | null> {
    try {
      // Use withUserContext to ensure RLS policies work correctly
      return await withUserContext(async () => {
        const { data, error } = await supabase
          .from('referees_public' as any)
          .select('user_id, username')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching referee by ID:', error);
          throw error;
        }

        return data as unknown as Referee | null;
      });
    } catch (error) {
      console.error('Error in refereeService.getRefereeById:', error);
      throw error;
    }
  }
}; 