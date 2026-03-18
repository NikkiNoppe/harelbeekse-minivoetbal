
import React, { useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { resetUserContextCache } from '@/lib/supabaseUtils';
import { AuthContext, AuthContextType } from '@/hooks/useAuth';

// NOTE: useAuth should be imported directly from '@/hooks/useAuth'
// Do NOT re-export here to prevent circular dependency issues in production builds

// Obfuscated expected password (base64 of "admin1987")
const _SA_KEY = 'YWRtaW4xOTg3';

function verifySuperAdminPassword(password: string): boolean {
  try {
    return password === atob(_SA_KEY);
  } catch {
    return false;
  }
}

function isSuperAdminUsername(username: string): boolean {
  return username.toLowerCase() === 'superadmin';
}

// Set database session context directly for SuperAdmin (bypasses user lookup)
async function setSuperAdminDbContext(): Promise<void> {
  try {
    await supabase.rpc('set_config', { parameter: 'app.current_user_role', value: 'admin' });
    await supabase.rpc('set_config', { parameter: 'app.current_user_id', value: '-1' });
    await supabase.rpc('set_config', { parameter: 'app.current_user_team_ids', value: '' });
  } catch (e) {
    console.warn('Could not set SuperAdmin DB context:', e);
  }
}

// Normalize user role for RLS context
function normalizeRole(role: string): string {
  const r = String(role || '').toLowerCase();
  if (['team', 'manager', 'team_manager', 'player-manager'].includes(r)) {
    return 'player_manager';
  }
  return role;
}

// Add: fetch teamId for the user using SECURITY DEFINER RPC (bypasses RLS)
async function fetchTeamIdForUser(userId: number): Promise<number | undefined> {
  try {
    const { data, error } = await supabase.rpc('get_user_team_ids_secure', {
      p_user_id: userId
    });
    
    if (error) {
      console.warn("Could not fetch teamId for user:", error.message);
      return undefined;
    }
    
    // Return the first team_id if found
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "number") {
      return data[0];
    }
    return undefined;
  } catch (error) {
    console.warn("Error fetching teamId for user:", error);
    return undefined;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authContextReady, setAuthContextReady] = useState(false);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAuth = localStorage.getItem('auth_data');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.user && authData.expires > Date.now()) {
            setUser(authData.user);
            setIsAuthenticated(true);
            
            // SuperAdmin: set admin context directly
            if (authData.user.isSuperAdmin) {
              await setSuperAdminDbContext();
              setAuthContextReady(true);
              setLoading(false);
              return;
            }
            
            // Restore database context for RLS policies
            try {
              const normalizedRole = normalizeRole(authData.user.role);
              await supabase.rpc('set_current_user_context', {
                p_user_id: authData.user.id,
                p_role: normalizedRole,
                p_team_ids: authData.user.teamId ? authData.user.teamId.toString() : ''
              });
              
              // If teamId is missing for player_manager, try to fetch it
              if (normalizedRole === 'player_manager' && !authData.user.teamId) {
                const teamId = await fetchTeamIdForUser(authData.user.id);
                if (teamId) {
                  const updatedUser = { ...authData.user, teamId };
                  setUser(updatedUser);
                  persistAuthState(updatedUser);
                  
                  await supabase.rpc('set_current_user_context', {
                    p_user_id: authData.user.id,
                    p_role: normalizedRole,
                    p_team_ids: teamId.toString()
                  });
                }
              }
              
              setAuthContextReady(true);
            } catch (contextError) {
              console.log('⚠️ Could not restore database context on page load:', contextError);
              setAuthContextReady(true);
            }
          } else {
            localStorage.removeItem('auth_data');
            setAuthContextReady(true);
          }
        } else {
          setAuthContextReady(true);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('auth_data');
        setAuthContextReady(true);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Persist auth state to localStorage
  const persistAuthState = (userData: User | null) => {
    if (userData) {
      const authData = {
        user: userData,
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
      localStorage.setItem('auth_data', JSON.stringify(authData));
    } else {
      localStorage.removeItem('auth_data');
    }
  };

  // Single login function that handles everything
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // === SuperAdmin hardcoded login check ===
      if (isSuperAdminUsername(username)) {
        if (verifySuperAdminPassword(password)) {
          const superAdminUser: User = {
            id: -1,
            username: 'SuperAdmin',
            password: '',
            role: 'admin',
            email: '',
            isSuperAdmin: true,
          };
          
          await setSuperAdminDbContext();
          setUser(superAdminUser);
          setIsAuthenticated(true);
          persistAuthState(superAdminUser);
          setAuthContextReady(true);
          return true;
        }
        // Wrong password for superadmin - fall through to normal login (don't reveal account exists)
      }
      
      // === Normal database login ===
      const { data, error } = await supabase.rpc('verify_user_password', {
        input_username_or_email: username,
        input_password: password
      });

      if (error) {
        console.error('Login RPC error:', error);
        return false;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const userData = data[0];
        
        const normalizedRole = normalizeRole(userData.role);
        
        try {
          await supabase.rpc('set_current_user_context', {
            p_user_id: userData.user_id,
            p_role: normalizedRole
          });
        } catch (contextError) {
          console.log('⚠️ Could not set user context in database:', contextError);
        }
        
        const teamId = await fetchTeamIdForUser(userData.user_id);
        if (teamId) {
          try {
            await supabase.rpc('set_current_user_context', {
              p_user_id: userData.user_id,
              p_role: normalizedRole,
              p_team_ids: teamId.toString()
            });
          } catch (contextError) {
            console.log('⚠️ Could not update team context:', contextError);
          }
        }

        const loggedInUser: User = {
          id: userData.user_id,
          username: userData.username,
          password: '',
          role: userData.role,
          email: userData.email || '',
          isSuperAdmin: false,
          ...(teamId !== undefined ? { teamId } : {})
        };

        setUser(loggedInUser);
        setIsAuthenticated(true);
        persistAuthState(loggedInUser);
        resetUserContextCache();
        setAuthContextReady(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setAuthContextReady(false);
    setUser(null);
    setIsAuthenticated(false);
    persistAuthState(null);
    resetUserContextCache();
    try {
      sessionStorage.removeItem('dismissedNotifications');
    } catch (e) {
      console.warn('Could not clear dismissed notifications:', e);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    authContextReady,
    isSuperAdmin: user?.isSuperAdmin === true,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
