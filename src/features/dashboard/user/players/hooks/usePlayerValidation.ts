
import { supabase } from "@shared/integrations/supabase/client";

export const usePlayerValidation = () => {
  // Check if player already exists in any team
  const checkPlayerExists = async (firstName: string, lastName: string, birthDate: string, excludePlayerId?: number) => {
    try {
      let query = supabase
        .from('players')
        .select(`
          player_id, 
          first_name, 
          last_name, 
          birth_date, 
          team_id,
          teams!inner(team_name)
        `)
        .eq('first_name', firstName.trim())
        .eq('last_name', lastName.trim())
        .eq('birth_date', birthDate);

      if (excludePlayerId) {
        query = query.neq('player_id', excludePlayerId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error checking player existence:', error);
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error checking player existence:', error);
      return null;
    }
  };

  // Check if name combination already exists (regardless of birth date)
  const checkNameExists = async (firstName: string, lastName: string, excludePlayerId?: number) => {
    try {
      let query = supabase
        .from('players')
        .select(`
          player_id, 
          first_name, 
          last_name, 
          birth_date, 
          team_id,
          teams!inner(team_name)
        `)
        .eq('first_name', firstName.trim())
        .eq('last_name', lastName.trim());

      if (excludePlayerId) {
        query = query.neq('player_id', excludePlayerId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error checking name existence:', error);
        return null;
      }
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error checking name existence:', error);
      return null;
    }
  };

  const validatePlayerData = (firstName: string, lastName: string, birthDate: string) => {
    return firstName.trim() && lastName.trim() && birthDate;
  };

  return {
    checkPlayerExists,
    checkNameExists,
    validatePlayerData
  };
};
