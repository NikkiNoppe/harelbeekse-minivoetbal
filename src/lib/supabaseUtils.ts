import { supabase } from "@/integrations/supabase/client";

// Cache to track the last set context to avoid redundant database calls
let lastContext: {
  userId: number;
  role: string;
  teamIds: string;
} | null = null;

// Promise lock to serialize context RPC calls and prevent parallel calls
let contextPromise: Promise<void> | null = null;

/**
 * Reset the context cache (useful when user logs out or changes)
 */
export const resetUserContextCache = () => {
  lastContext = null;
  contextPromise = null;
};

/**
 * Wrapper function that sets user context before executing Supabase queries
 * This ensures Team Managers have proper RLS access to their data
 * Optimized to only set context when it actually changes
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
    const rawRole = options?.role ?? userData.role;
    const normalizedRole = (() => {
      const r = String(rawRole || '').toLowerCase();
      if (['team', 'manager', 'team_manager', 'player-manager'].includes(r)) return 'player_manager';
      return rawRole;
    })();
    let teamIds = options?.teamIds ?? (userData.teamId ? String(userData.teamId) : '');
    
    // If teamIds are missing for player_manager, try to fetch them
    if (!teamIds && normalizedRole === 'player_manager') {
      console.log('🔍 Missing teamIds for player_manager, fetching...');
      try {
        const { data, error } = await supabase
          .from('team_users')
          .select('team_id')
          .eq('user_id', userId);

        if (!error && Array.isArray(data) && data.length > 0) {
          const teamIdList = data
            .map((row: any) => Number(row.team_id))
            .filter((id: number) => Number.isFinite(id));
          teamIds = teamIdList.join(',');
          console.log('✅ Fetched missing teamIds:', teamIds);
          
          // Update localStorage with the fetched teamId
          const authDataString = localStorage.getItem('auth_data');
          if (authDataString) {
            try {
              const authData = JSON.parse(authDataString);
              if (authData?.user) {
                // Preserve first team as primary in client state for UI compatibility
                const primaryTeamId = teamIdList[0];
                if (primaryTeamId !== undefined) {
                  authData.user.teamId = primaryTeamId;
                }
                localStorage.setItem('auth_data', JSON.stringify(authData));
                console.log('✅ Updated auth_data with fetched teamIds');
              }
            } catch (e) {
              console.warn('Could not update auth_data with fetched teamIds');
            }
          }
        }
      } catch (fetchError) {
        console.warn('Could not fetch missing teamIds:', fetchError);
      }
    }
    
    // Only set context if it has changed
    const contextChanged = !lastContext || 
      lastContext.userId !== userId || 
      lastContext.role !== normalizedRole || 
      lastContext.teamIds !== teamIds;
    
    if (contextChanged) {
      // Wait for any existing context setup to complete (serialize calls)
      if (contextPromise) {
        await contextPromise;
      }
      
      // Create new promise for this context setup
      contextPromise = (async () => {
        try {
          // Set user context before the operation
          await supabase.rpc('set_current_user_context', {
            p_user_id: userId,
            p_role: normalizedRole,
            p_team_ids: teamIds
          });
          
          // Update cache
          lastContext = { userId, role: normalizedRole, teamIds };
          
          // Only log when context actually changes
          console.log('✅ Context set for operation:', { userId, role: normalizedRole, teamIds });
          if (!teamIds && normalizedRole === 'player_manager') {
            console.warn('⚠️ No teamIds found for player_manager; RLS may block team data.');
          }
        } catch (contextError) {
          console.log('⚠️ Could not set context for operation:', contextError);
          // Clear cache on error to force retry next time
          lastContext = null;
        } finally {
          contextPromise = null;
        }
      })();
      
      await contextPromise;
    }
  }
  
  // Execute the operation
  return await operation();
};