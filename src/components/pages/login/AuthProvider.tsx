
import React, { useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { resetUserContextCache } from '@/lib/supabaseUtils';
import { AuthContext, AuthContextType } from '@/hooks/useAuth';
import { getRpcSessionArgs, getSessionToken } from '@/lib/authSession';
import { USE_SUPABASE_AUTH } from '@/config/authFlags';
import {
  loginWithSupabaseAuthBridge,
  restoreSupabaseAuthBridgeSession,
  signOutSupabaseAuthBridge,
} from '@/lib/supabaseAuthBridge';

function isSuperAdminUsername(username: string): boolean {
  return username.toLowerCase() === 'superadmin';
}

function normalizeRole(role: string): string {
  const r = String(role || '').toLowerCase();
  if (['team', 'manager', 'team_manager', 'player-manager'].includes(r)) {
    return 'player_manager';
  }
  return role;
}

async function restoreSessionContext(sessionToken: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('restore_user_session', {
    p_session_token: sessionToken,
  });
  if (error) {
    console.warn('Could not restore session context:', error.message);
    return false;
  }
  return data === true;
}

async function fetchTeamIdFromSession(): Promise<number | undefined> {
  try {
    const { data, error } = await supabase.rpc('get_user_team_ids_secure', getRpcSessionArgs());
    if (error || !Array.isArray(data) || data.length === 0) {
      return undefined;
    }
    const first = data[0];
    return typeof first === 'number' ? first : undefined;
  } catch {
    return undefined;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authContextReady, setAuthContextReady] = useState(false);

  const persistAuthState = (userData: User | null, sessionToken?: string) => {
    if (userData && sessionToken) {
      const authData = {
        user: userData,
        sessionToken,
        expires: Date.now() + (24 * 60 * 60 * 1000),
      };
      localStorage.setItem('auth_data', JSON.stringify(authData));
    } else {
      localStorage.removeItem('auth_data');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAuth = localStorage.getItem('auth_data');
        if (!storedAuth) {
          setAuthContextReady(true);
          return;
        }

        const authData = JSON.parse(storedAuth);
        if (!authData.user || !authData.sessionToken || authData.expires <= Date.now()) {
          localStorage.removeItem('auth_data');
          setAuthContextReady(true);
          return;
        }

        if (USE_SUPABASE_AUTH) {
          const bridge = await restoreSupabaseAuthBridgeSession();
          if (!bridge) {
            localStorage.removeItem('auth_data');
            setAuthContextReady(true);
            return;
          }
          persistAuthState(bridge.user, bridge.sessionToken);
          setUser(bridge.user);
          setIsAuthenticated(true);
          setAuthContextReady(true);
          return;
        }

        const restored = await restoreSessionContext(authData.sessionToken);
        if (!restored) {
          localStorage.removeItem('auth_data');
          setAuthContextReady(true);
          return;
        }

        let nextUser = authData.user as User;
        if (normalizeRole(nextUser.role) === 'player_manager' && !nextUser.teamId) {
          const teamId = await fetchTeamIdFromSession();
          if (teamId) {
            nextUser = { ...nextUser, teamId };
            persistAuthState(nextUser, authData.sessionToken);
          }
        }

        setUser(nextUser);
        setIsAuthenticated(true);
        setAuthContextReady(true);
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

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      if (isSuperAdminUsername(username)) {
        const { data, error } = await supabase.rpc('login_super_admin', {
          p_password: password,
        });
        if (error || !data?.[0]?.session_token) {
          return false;
        }

        const superAdminUser: User = {
          id: -1,
          username: 'SuperAdmin',
          password: '',
          role: 'admin',
          email: '',
          isSuperAdmin: true,
        };

        setUser(superAdminUser);
        setIsAuthenticated(true);
        persistAuthState(superAdminUser, data[0].session_token);
        resetUserContextCache();
        setAuthContextReady(true);
        return true;
      }

      if (USE_SUPABASE_AUTH) {
        const bridge = await loginWithSupabaseAuthBridge(username, password);
        if (bridge) {
          setUser(bridge.user);
          setIsAuthenticated(true);
          persistAuthState(bridge.user, bridge.sessionToken);
          resetUserContextCache();
          setAuthContextReady(true);
          return true;
        }
        return false;
      }

      const { data, error } = await supabase.rpc('login_user', {
        input_username_or_email: username,
        input_password: password,
      });

      if (error) {
        console.error('Login RPC error:', error);
        return false;
      }

      if (!data?.[0]) {
        return false;
      }

      const userData = data[0];
      const teamIds = userData.team_ids as number[] | null;
      const teamId = Array.isArray(teamIds) && teamIds.length > 0 ? teamIds[0] : undefined;

      const loggedInUser: User = {
        id: userData.user_id,
        username: userData.username,
        password: '',
        role: userData.role as User['role'],
        email: userData.email || '',
        isSuperAdmin: false,
        ...(teamId !== undefined ? { teamId } : {}),
      };

      setUser(loggedInUser);
      setIsAuthenticated(true);
      persistAuthState(loggedInUser, userData.session_token);
      resetUserContextCache();
      setAuthContextReady(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    const sessionToken = getSessionToken();
    if (sessionToken) {
      try {
        await supabase.rpc('logout_user', { p_session_token: sessionToken });
      } catch (e) {
        console.warn('Could not revoke session server-side:', e);
      }
    }
    if (USE_SUPABASE_AUTH) {
      await signOutSupabaseAuthBridge();
    }
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
