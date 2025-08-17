
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add: fetch teamId for the user
async function fetchTeamIdForUser(userId: number): Promise<number | undefined> {
  const { data, error } = await supabase
    .from("team_users")
    .select("team_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("Failed to fetch teamId for user", error);
    return undefined;
  }
  // Return the team_id if found and a number
  if (data && typeof data.team_id === "number") {
    return data.team_id;
  }
  return undefined;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('auth_data');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        if (authData.user && authData.expires > Date.now()) {
          setUser(authData.user);
          setIsAuthenticated(true);
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

  // Use the corrected verify_user_password function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Use the corrected verify_user_password function
      const { data, error } = await supabase.rpc('verify_user_password', {
        input_username_or_email: username,
        input_password: password
      });

      if (error) {
        return false;
      }

      // Check if data is an array and has results
      if (data && typeof Array.isArray === 'function' && Array.isArray(data) && data.length > 0) {
        const userData = data[0];
        
        // Fetch possible teamId mapping
        const teamId = await fetchTeamIdForUser(userData.user_id);

        const loggedInUser: User = {
          id: userData.user_id,
          username: userData.username,
          password: '', // Don't store password
          role: userData.role,
          email: userData.email,
          ...(teamId !== undefined ? { teamId } : {})
        };

        setUser(loggedInUser);
        setIsAuthenticated(true);
        persistAuthState(loggedInUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // If not logged in via login function (e.g., page refresh), try to hydrate from storage
  useEffect(() => {
    // Optionally, you can enhance to hydrate session for persistent login
    // Not implemented now for simplicity
  }, []);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    persistAuthState(null);
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
