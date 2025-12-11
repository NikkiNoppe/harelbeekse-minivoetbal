
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { resetUserContextCache } from '@/lib/supabaseUtils';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Normalize user role for RLS context
function normalizeRole(role: string): string {
  const r = String(role || '').toLowerCase();
  if (['team', 'manager', 'team_manager', 'player-manager'].includes(r)) {
    return 'player_manager';
  }
  return role;
}

// Add: fetch teamId for the user (with error handling)
async function fetchTeamIdForUser(userId: number): Promise<number | undefined> {
  try {
    const { data, error } = await supabase
      .from("team_users")
      .select("team_id")
      .eq("user_id", userId)
      .limit(1);
    
    if (error) {
      console.warn("Could not fetch teamId for user (likely due to RLS):", error.message);
      return undefined;
    }
    
    // Return the team_id if found and a number
    if (Array.isArray(data) && data.length > 0 && typeof data[0].team_id === "number") {
      return data[0].team_id;
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
            
            // Restore database context for RLS policies
            try {
              const normalizedRole = normalizeRole(authData.user.role);
              await supabase.rpc('set_current_user_context', {
                p_user_id: authData.user.id,
                p_role: normalizedRole,
                p_team_ids: authData.user.teamId ? authData.user.teamId.toString() : ''
              });
              console.log('✅ Restored user context:', { role: normalizedRole, teamId: authData.user.teamId });
              
              // If teamId is missing for player_manager, try to fetch it
              if (normalizedRole === 'player_manager' && !authData.user.teamId) {
                console.log('🔍 Team Manager missing teamId, fetching...');
                const teamId = await fetchTeamIdForUser(authData.user.id);
                if (teamId) {
                  console.log('✅ Found missing teamId:', teamId);
                  // Update the user object and re-set context
                  const updatedUser = { ...authData.user, teamId };
                  setUser(updatedUser);
                  persistAuthState(updatedUser);
                  
                  await supabase.rpc('set_current_user_context', {
                    p_user_id: authData.user.id,
                    p_role: normalizedRole,
                    p_team_ids: teamId.toString()
                  });
                  console.log('✅ Updated context with fetched teamId:', teamId);
                }
              }
            } catch (contextError) {
              console.log('⚠️ Could not restore database context on page load:', contextError);
            }
          } else {
            localStorage.removeItem('auth_data');
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('auth_data');
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
      console.log('🔐 Attempting login for:', username);
      
      // Use the verify_user_password function
      const { data, error } = await supabase.rpc('verify_user_password', {
        input_username_or_email: username,
        input_password: password
      });

      if (error) {
        console.error('Login RPC error:', error);
        return false;
      }

      // Check if data is an array and has results
      if (data && Array.isArray(data) && data.length > 0) {
        const userData = data[0];
        console.log('✅ Login successful for user:', userData.username);
        
        // Normalize role for RLS context
        const normalizedRole = normalizeRole(userData.role);
        
        // Set initial user context for database access
        try {
          await supabase.rpc('set_current_user_context', {
            p_user_id: userData.user_id,
            p_role: normalizedRole
          });
          console.log('✅ User context set in database:', { role: normalizedRole, userId: userData.user_id });
        } catch (contextError) {
          console.log('⚠️ Could not set user context in database:', contextError);
        }
        
        // Try to fetch teamId now that context is set
        const teamId = await fetchTeamIdForUser(userData.user_id);
        if (teamId) {
          console.log('👥 Found teamId:', teamId);
          
          // Update context with team ID
          try {
            await supabase.rpc('set_current_user_context', {
              p_user_id: userData.user_id,
              p_role: normalizedRole,
              p_team_ids: teamId.toString()
            });
            console.log('✅ Full user context set with team ID:', teamId);
          } catch (contextError) {
            console.log('⚠️ Could not update team context:', contextError);
          }
        } else {
          console.log('👥 No teamId found - Team Manager may not have access yet');
        }

        const loggedInUser: User = {
          id: userData.user_id,
          username: userData.username,
          password: '', // Don't store password
          role: userData.role,
          email: userData.email || '',
          ...(teamId !== undefined ? { teamId } : {})
        };

        setUser(loggedInUser);
        setIsAuthenticated(true);
        persistAuthState(loggedInUser);
        // Reset context cache on login to ensure fresh context
        resetUserContextCache();
        return true;
      }

      console.log('❌ Login failed: Invalid credentials');
      return false;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    setUser(null);
    setIsAuthenticated(false);
    persistAuthState(null);
    // Reset context cache on logout
    resetUserContextCache();
    // Clear dismissed notifications so they show again on next login
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
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
