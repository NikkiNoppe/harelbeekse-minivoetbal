import { supabase } from "@/integrations/supabase/client";

/**
 * Wrapper function that sets user context before executing Supabase queries
 * This ensures Team Managers have proper RLS access to their data
 */
export const withUserContext = async <T>(
  operation: () => Promise<T>,
  options?: {
    userId?: number;
    role?: string;
    teamIds?: string;
  }
): Promise<T> => {
  // Get user context from localStorage if not provided
  const authDataString = localStorage.getItem('auth_data');
  let userData: any = null;

  if (authDataString) {
    try {
      const authData = JSON.parse(authDataString);
      userData = authData?.user || null;
    } catch (e) {
      console.warn('Invalid auth_data in localStorage');
    }
  }

  // Backward compatibility: fallback to legacy 'user' key
  if (!userData) {
    const legacyUserString = localStorage.getItem('user');
    userData = legacyUserString ? JSON.parse(legacyUserString) : null;
  }

  if (userData) {
    const userId = options?.userId ?? userData.id;
    const role = options?.role ?? userData.role;
    const teamIds = options?.teamIds ?? (userData.teamId ? String(userData.teamId) : '');
    
    try {
      // Set user context before the operation
      await supabase.rpc('set_current_user_context', {
        p_user_id: userId,
        p_role: role,
        p_team_ids: teamIds
      });
      
      console.log('✅ Context set for operation:', { userId, role, teamIds });
    } catch (contextError) {
      console.log('⚠️ Could not set context for operation:', contextError);
    }
  }
  
  // Execute the operation
  return await operation();
};