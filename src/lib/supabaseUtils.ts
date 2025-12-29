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
    
    // If teamIds are missing for player_manager, try to fetch them using SECURITY DEFINER RPC
    if (!teamIds && normalizedRole === 'player_manager') {
      console.log('🔍 Missing teamIds for player_manager, fetching via RPC...');
      try {
        const { data, error } = await supabase.rpc('get_user_team_ids_secure', {
          p_user_id: userId
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          const teamIdList = data.filter((id: number) => Number.isFinite(id));
          teamIds = teamIdList.join(',');
          console.log('✅ Fetched missing teamIds via RPC:', teamIds);
          
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
    
    // Always set context before each operation to ensure it's fresh
    // Database context can be lost between queries (new connections, session timeouts, etc.)
    // Wait for any existing context setup to complete (serialize calls)
    if (contextPromise) {
      await contextPromise;
    }
    
    // Check if we need to set context (optimization: only set if changed)
    const contextChanged = !lastContext || 
      lastContext.userId !== userId || 
      lastContext.role !== normalizedRole || 
      lastContext.teamIds !== teamIds;
    
    // Always set context, even if unchanged, to ensure it's fresh in the database
    // This prevents RLS issues when context is lost between queries
    contextPromise = (async () => {
      try {
        // Set user context before the operation
        const { error: contextError } = await supabase.rpc('set_current_user_context', {
          p_user_id: userId,
          p_role: normalizedRole,
          p_team_ids: teamIds
        });
        
        if (contextError) {
          console.error('❌ Error setting user context:', contextError);
          throw contextError;
        }
        
        // Verify context was set correctly (only in development and when changed)
        if (process.env.NODE_ENV === 'development' && contextChanged) {
          // Small delay to ensure context is propagated
          await new Promise(resolve => setTimeout(resolve, 10));
          
          const { data: verifyRole, error: verifyError } = await supabase.rpc('get_current_user_role');
          const { data: verifyTeamIds } = await supabase.rpc('get_current_user_team_ids');
          
          if (verifyError) {
            console.warn('⚠️ Could not verify user role after setting context:', verifyError);
          } else {
            const roleMatch = verifyRole === normalizedRole;
            if (roleMatch) {
              console.log('✅ Context set and verified:', {
                role: verifyRole,
                teamIds: verifyTeamIds,
                expectedTeamIds: teamIds
              });
            } else {
              // Role hierarchy: admin > player_manager > referee > public
              // If database role is higher than expected, it's not a problem (more permissions)
              // Only warn if database role is lower than expected (potential security issue)
              const roleHierarchy: Record<string, number> = {
                'admin': 3,
                'player_manager': 2,
                'referee': 1,
                'public': 0
              };
              const dbRoleLevel = roleHierarchy[verifyRole || ''] ?? -1;
              const expectedRoleLevel = roleHierarchy[normalizedRole] ?? -1;
              
              if (dbRoleLevel < expectedRoleLevel) {
                // Database role is lower than expected - potential security issue
                console.warn('⚠️ Context mismatch (potential security issue):', {
                  expectedRole: normalizedRole,
                  databaseRole: verifyRole,
                  message: 'Database role is lower than expected. This may cause access issues.'
                });
              } else {
                // Database role is higher than expected - not a problem, just informational
                console.debug('ℹ️ Context role differs (not a problem):', {
                  expectedRole: normalizedRole,
                  databaseRole: verifyRole,
                  message: 'Database role has more permissions than expected. This is fine.'
                });
              }
            }
          }
        }
        
        // Update cache
        lastContext = { userId, role: normalizedRole, teamIds };
        
        // Only log when context actually changes
        if (contextChanged) {
          console.log('✅ Context set for operation:', { userId, role: normalizedRole, teamIds });
          if (!teamIds && normalizedRole === 'player_manager') {
            console.warn('⚠️ No teamIds found for player_manager; RLS may block team data.');
          }
        }
      } catch (contextError) {
        console.error('❌ Could not set context for operation:', contextError);
        // Clear cache on error to force retry next time
        lastContext = null;
        // Don't throw - allow operation to continue (might work with cached context)
      } finally {
        contextPromise = null;
      }
    })();
    
    await contextPromise;
  }
  
  // Execute the operation
  return await operation();
};