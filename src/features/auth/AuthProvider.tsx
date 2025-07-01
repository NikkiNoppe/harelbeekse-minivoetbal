import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@shared/types/auth';
import { supabase } from '@shared/integrations/supabase/client';

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
    .single();
  
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

  useEffect(() => {
    // Simulate loading check
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Use the verify_user_password function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthProvider login called with username:', username);
      
      // Use the database function for proper password verification (handles bcrypt)
      const { data, error } = await supabase.rpc('verify_user_password', {
        input_username_or_email: username,
        input_password: password
      });

      console.log('🔍 AuthProvider verification result:', data);
      console.log('❌ AuthProvider verification error:', error);

      if (error) {
        console.error('💥 AuthProvider login error:', error);
        return false;
      }

      if (data && data.length > 0) {
        const userData = data[0];
        console.log('👤 AuthProvider user data:', userData);
        
        // Fetch possible teamId mapping
        const teamId = await fetchTeamIdForUser(userData.user_id);
        console.log('🏀 Fetched teamId:', teamId);

        const loggedInUser: User = {
          id: userData.user_id,
          username: userData.username,
          password: '', // Don't store password
          role: userData.role,
          email: userData.email,
          ...(teamId !== undefined ? { teamId } : {})
        };

        console.log('✅ Setting authenticated user:', loggedInUser);
        setUser(loggedInUser);
        setIsAuthenticated(true);
        return true;
      }

      console.log('❌ AuthProvider: No valid user data returned');
      return false;
    } catch (error) {
      console.error('💀 AuthProvider login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('👋 Logging out user');
    setUser(null);
    setIsAuthenticated(false);
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
