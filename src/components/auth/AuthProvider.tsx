
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  allUsers: User[];
  updateUser: (user: User) => void;
  addUser: (user: User) => void;
  removeUser: (userId: number) => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: User[] = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'referee1', password: 'ref123', role: 'referee' },
  { id: 3, username: 'team1manager', password: 'team123', role: 'player_manager', teamId: 1 },
  { id: 4, username: 'team2manager', password: 'team123', role: 'player_manager', teamId: 2 },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);

  useEffect(() => {
    // Simulate loading check
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('verify_user_password', {
        input_username_or_email: username,
        input_password: password
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data && data.length > 0) {
        const userData = data[0];
        const loggedInUser: User = {
          id: userData.user_id,
          username: userData.username,
          password: '', // Don't store password
          role: userData.role,
          email: userData.email
        };

        setUser(loggedInUser);
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const addUser = (newUser: User) => {
    setAllUsers(prev => [...prev, newUser]);
  };

  const removeUser = (userId: number) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  const refreshUsers = async () => {
    // In a real app, this would fetch users from the database
    // For now, we'll just trigger a re-render
    setAllUsers(prev => [...prev]);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    allUsers,
    updateUser,
    addUser,
    removeUser,
    refreshUsers,
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
